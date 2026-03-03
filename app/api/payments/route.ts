import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/middleware/auth";
import { createServiceClient } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
} from "@/lib/utils/response";
import { createAuditLog } from "@/lib/utils/audit";

/**
 * GET /api/payments
 * List payments with optional filters
 * Query params: bill_id, patient_id, from_date, to_date, page, per_page
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const billId = searchParams.get("bill_id");
  const patientId = searchParams.get("patient_id");
  const fromDate = searchParams.get("from_date");
  const toDate = searchParams.get("to_date");
  const page = parseInt(searchParams.get("page") ?? "1");
  const perPage = parseInt(searchParams.get("per_page") ?? "20");
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const db = createServiceClient();

  let query = db
    .from("payments")
    .select(
      `
      id,
      bill_id,
      patient_id,
      payment_date,
      amount,
      payment_mode,
      reference_number,
      payment_type,
      notes,
      created_at,
      bills(bill_number, total_amount, payment_status),
      patients(id, full_name, uhid)
    `,
      { count: "exact" },
    )
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (billId) {
    query = query.eq("bill_id", billId);
  }

  if (patientId) {
    query = query.eq("patient_id", patientId);
  }

  if (fromDate) {
    query = query.gte("payment_date", fromDate);
  }

  if (toDate) {
    query = query.lte("payment_date", toDate);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Payments fetch error:", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch payments",
      500,
    );
  }

  return successResponse(data, { total: count ?? 0, page, per_page: perPage });
}

// Add payment schema
const AddPaymentSchema = z.object({
  bill_id: z.string().uuid(),
  amount: z.number().positive(),
  payment_mode: z.enum(["cash", "upi", "card", "netbanking", "cheque"]),
  reference_number: z.string().optional(),
  payment_type: z.enum(["payment", "advance", "refund"]).default("payment"),
  notes: z.string().optional(),
});

/**
 * POST /api/payments
 * Add a payment to an existing bill
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

  const result = AddPaymentSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Validation failed",
      422,
      result.error.flatten(),
    );
  }

  const db = createServiceClient();

  // Get the bill
  const { data: bill, error: billError } = await db
    .from("bills")
    .select("id, patient_id, total_amount, payment_status")
    .eq("id", result.data.bill_id)
    .single();

  if (billError || !bill) {
    return errorResponse(ErrorCodes.NOT_FOUND, "Bill not found", 404);
  }

  const billData = bill as {
    id: string;
    patient_id: string;
    total_amount: number;
    payment_status: string;
  };

  // Calculate total paid for this bill (excluding refunds)
  const { data: existingPayments } = await db
    .from("payments")
    .select("amount, payment_type")
    .eq("bill_id", result.data.bill_id);

  const paymentsData = existingPayments as Array<{
    amount: number;
    payment_type: string;
  }> | null;
  const totalPaid = (paymentsData ?? [])
    .filter((p) => p.payment_type !== "refund")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // Insert the new payment
  const { data: payment, error: paymentError } = await db
    .from("payments")
    .insert({
      bill_id: result.data.bill_id,
      patient_id: billData.patient_id,
      payment_date: new Date().toISOString().split("T")[0],
      amount: result.data.amount,
      payment_mode: result.data.payment_mode,
      reference_number: result.data.reference_number ?? null,
      payment_type: result.data.payment_type,
      notes: result.data.notes ?? null,
      created_by: auth.userId,
    } as never)
    .select()
    .single();

  if (paymentError || !payment) {
    console.error("Payment creation error:", paymentError);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to create payment",
      500,
    );
  }

  // Update bill payment status
  const newTotalPaid =
    result.data.payment_type !== "refund"
      ? totalPaid + result.data.amount
      : totalPaid - result.data.amount;

  let newStatus: "paid" | "partial" | "due" = "due";
  if (result.data.payment_type === "refund") {
    newStatus =
      newTotalPaid <= 0
        ? "due"
        : newTotalPaid >= billData.total_amount
          ? "paid"
          : "partial";
  } else {
    if (newTotalPaid >= billData.total_amount) {
      newStatus = "paid";
    } else if (newTotalPaid > 0) {
      newStatus = "partial";
    }
  }

  await db
    .from("bills")
    .update({ payment_status: newStatus } as never)
    .eq("id", result.data.bill_id);

  const paymentRecord = payment as { id: string; [key: string]: unknown };

  // Create audit log
  await createAuditLog(
    auth,
    "payments",
    paymentRecord.id,
    "create",
    null,
    paymentRecord as Record<string, unknown>,
  );

  return successResponse(payment, undefined, 201);
}
