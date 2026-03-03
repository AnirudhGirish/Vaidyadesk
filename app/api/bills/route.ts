/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/middleware/auth";
import { createServiceClient } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
} from "@/lib/utils/response";
import { generateBillNumber } from "@/lib/utils/bill-number";
import { calculateBillItems, calculateBillTotals } from "@/lib/utils/gst";
import { createAuditLog } from "@/lib/utils/audit";

/**
 * GET /api/bills
 * List bills with optional filters
 * Query params: patient_id, payment_status, from_date, to_date, page, per_page
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patient_id");
  const paymentStatus = searchParams.get("payment_status");
  const fromDate = searchParams.get("from_date");
  const toDate = searchParams.get("to_date");
  const page = parseInt(searchParams.get("page") ?? "1");
  const perPage = parseInt(searchParams.get("per_page") ?? "20");
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const db = createServiceClient();

  let query = db
    .from("bills")
    .select(
      `
      id,
      bill_number,
      patient_id,
      visit_id,
      bill_date,
      subtotal,
      discount_type,
      discount_value,
      discount_amount,
      total_amount,
      payment_status,
      notes,
      created_at,
      patients(id, full_name, uhid, phone)
    `,
      { count: "exact" },
    )
    .order("bill_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (patientId) {
    query = query.eq("patient_id", patientId);
  }

  if (paymentStatus) {
    query = query.eq(
      "payment_status",
      paymentStatus as "paid" | "partial" | "due" | "advance",
    );
  }

  if (fromDate) {
    query = query.gte("bill_date", fromDate);
  }

  if (toDate) {
    query = query.lte("bill_date", toDate);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Bills fetch error:", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch bills",
      500,
    );
  }

  return successResponse(data, { total: count ?? 0, page, per_page: perPage });
}

// Bill item input schema
const BillItemInputSchema = z.object({
  item_id: z.string().uuid(),
  item_type: z.enum(["service", "medicine"]),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  gst_applicable: z.boolean(),
  gst_rate: z.number().min(0).max(28),
});

// Initial payment schema
const InitialPaymentSchema = z.object({
  amount: z.number().positive(),
  payment_mode: z.enum(["cash", "upi", "card", "netbanking", "cheque"]),
  reference_number: z.string().optional(),
});

// Create bill schema
const CreateBillSchema = z.object({
  patient_id: z.string().uuid(),
  visit_id: z.string().uuid().optional(),
  bill_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  items: z.array(BillItemInputSchema).min(1),
  discount_type: z.enum(["flat", "percentage", "none"]).default("none"),
  discount_value: z.number().min(0).default(0),
  notes: z.string().optional(),
  initial_payments: z.array(InitialPaymentSchema).default([]),
});

/**
 * POST /api/bills
 * Create a new bill with items and optional initial payments
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid JSON body", 400);
  }

  const result = CreateBillSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Validation failed",
      422,
      result.error.flatten(),
    );
  }

  const db = createServiceClient();

  // Check frontdesk discount limit
  if (auth.profile.role === "frontdesk") {
    const { data: settings } = await db
      .from("clinic_settings")
      .select("max_frontdesk_discount")
      .single();

    const settingsData = settings as { max_frontdesk_discount: number } | null;
    const maxDiscount = settingsData?.max_frontdesk_discount ?? 10;

    if (
      result.data.discount_type === "percentage" &&
      result.data.discount_value > maxDiscount
    ) {
      return errorResponse(
        ErrorCodes.FORBIDDEN,
        `Frontdesk cannot apply more than ${maxDiscount}% discount`,
        403,
      );
    }
  }

  // Verify patient exists
  const { data: patient } = await db
    .from("patients")
    .select("id, full_name")
    .eq("id", result.data.patient_id)
    .single();

  if (!patient) {
    return errorResponse(ErrorCodes.NOT_FOUND, "Patient not found", 404);
  }

  // Calculate bill items with GST
  const calculatedItems = calculateBillItems(result.data.items);

  // Calculate totals
  const totals = calculateBillTotals(
    calculatedItems,
    result.data.discount_type,
    result.data.discount_value,
  );

  // Generate bill number
  const billNumber = await generateBillNumber();

  // Build GST breakdown
  const gstBreakdown: Record<number, { taxable: number; gst: number }> = {};
  for (const item of calculatedItems) {
    if (item.gst_applicable) {
      if (!gstBreakdown[item.gst_rate]) {
        gstBreakdown[item.gst_rate] = { taxable: 0, gst: 0 };
      }
      gstBreakdown[item.gst_rate].taxable += item.line_subtotal;
      gstBreakdown[item.gst_rate].gst += item.gst_amount;
    }
  }

  // Determine payment status
  let paymentStatus: "paid" | "partial" | "due" = "due";
  const initialPaymentTotal = result.data.initial_payments.reduce(
    (sum, p) => sum + p.amount,
    0,
  );

  if (initialPaymentTotal >= totals.total_amount) {
    paymentStatus = "paid";
  } else if (initialPaymentTotal > 0) {
    paymentStatus = "partial";
  }

  // Insert bill
  const { data: bill, error: billError } = await db
    .from("bills")
    .insert({
      bill_number: billNumber,
      patient_id: result.data.patient_id,
      visit_id: result.data.visit_id ?? null,
      bill_date:
        result.data.bill_date ?? new Date().toISOString().split("T")[0],
      bill_items: calculatedItems,
      subtotal: totals.subtotal,
      discount_type: result.data.discount_type,
      discount_value: result.data.discount_value,
      discount_amount: totals.discount_amount,
      gst_breakdown: Object.entries(gstBreakdown).map(([rate, vals]) => ({
        rate: parseFloat(rate),
        taxable_amount: Math.round(vals.taxable * 100) / 100,
        gst_amount: Math.round(vals.gst * 100) / 100,
      })),
      total_amount: totals.total_amount,
      payment_status: paymentStatus,
      notes: result.data.notes ?? null,
      created_by: auth.userId,
    } as never)
    .select()
    .single();

  if (billError || !bill) {
    console.error("Bill creation error:", billError);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to create bill",
      500,
    );
  }

  const billRecord = bill as { id: string; [key: string]: unknown };

  // Insert initial payments if any
  if (result.data.initial_payments.length > 0) {
    const paymentInserts = result.data.initial_payments.map((payment) => ({
      bill_id: billRecord.id,
      patient_id: result.data.patient_id,
      payment_date:
        result.data.bill_date ?? new Date().toISOString().split("T")[0],
      amount: payment.amount,
      payment_mode: payment.payment_mode,
      reference_number: payment.reference_number ?? null,
      payment_type: "payment" as const,
      notes: null,
      created_by: auth.userId,
    }));

    const { error: paymentsError } = await db
      .from("payments")
      .insert(paymentInserts as any);

    if (paymentsError) {
      // Rollback the bill to maintain consistency
      await db.from("bills").delete().eq("id", billRecord.id);
      return errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        "Failed to record payments. Bill was not saved. Please try again.",
        500,
      );
    }

    // Update payment status based on actual payments
    const totalPaid = result.data.initial_payments.reduce(
      (sum, p) => sum + p.amount,
      0,
    );

    let updatedPaymentStatus: "paid" | "partial" | "due" = "due";
    if (totalPaid >= totals.total_amount) {
      updatedPaymentStatus = "paid";
    } else if (totalPaid > 0) {
      updatedPaymentStatus = "partial";
    }

    await (db as any)
      .from("bills")
      .update({ payment_status: updatedPaymentStatus })
      .eq("id", billRecord.id);
  }

  // Auto-create patient_treatments for package services
  for (const item of calculatedItems) {
    if (item.item_type !== "service") continue;

    const serviceResult = await (db as any)
      .from("catalogue_services")
      .select("duration_type, package_days")
      .eq("id", item.item_id)
      .single();

    const service = serviceResult.data as {
      duration_type: string;
      package_days: number | null;
    } | null;

    if (
      !service ||
      service.duration_type !== "package" ||
      !service.package_days
    )
      continue;

    const { error: treatmentError } = await (db as any)
      .from("patient_treatments")
      .insert({
        patient_id: result.data.patient_id,
        visit_id: result.data.visit_id ?? null,
        service_id: item.item_id,
        service_name: item.name,
        package_days: service.package_days,
        sessions_total: service.package_days,
        sessions_consumed: 0,
        start_date: new Date().toISOString().split("T")[0],
        status: "active",
        notes: `Created from bill ${billNumber}`,
        created_by: auth.userId,
      });

    if (treatmentError) {
      console.error(
        `Failed to create treatment for service ${item.name}:`,
        treatmentError.message,
      );
    }
  }

  // Create audit log
  await createAuditLog(
    auth,
    "bills",
    billRecord.id,
    "create",
    null,
    billRecord as Record<string, unknown>,
  );

  return successResponse(bill, undefined, 201);
}
