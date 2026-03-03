import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/middleware/auth";
import { requireRole } from "@/lib/middleware/role";
import { createServiceClient } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
} from "@/lib/utils/response";
import { calculateBillItems, calculateBillTotals } from "@/lib/utils/gst";
import { createAuditLog } from "@/lib/utils/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/bills/[id]
 * Get single bill with patient and payment details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const db = createServiceClient();

  // Get bill with patient details
  const { data: bill, error } = await db
    .from("bills")
    .select(
      `
      *,
      patients(id, full_name, uhid, phone, email, date_of_birth, gender)
    `,
    )
    .eq("id", id)
    .single();

  if (error || !bill) {
    return errorResponse(ErrorCodes.NOT_FOUND, "Bill not found", 404);
  }

  // Get payments for this bill
  const { data: payments } = await db
    .from("payments")
    .select("*")
    .eq("bill_id", id)
    .order("payment_date", { ascending: true });

  const billWithPayments = Object.assign({}, bill, {
    payments: payments ?? [],
  });
  return successResponse(billWithPayments);
}

// Update bill schema - doctor only
const UpdateBillSchema = z.object({
  discount_type: z.enum(["flat", "percentage", "none"]).optional(),
  discount_value: z.number().min(0).optional(),
  notes: z.string().optional(),
  payment_status: z.enum(["paid", "partial", "due", "advance"]).optional(),
});

/**
 * PUT /api/bills/[id]
 * Update bill - doctor only
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  // Only doctor can update bills
  const forbidden = requireRole(auth, "doctor");
  if (forbidden) return forbidden;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid JSON body", 400);
  }

  const result = UpdateBillSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Validation failed",
      422,
      result.error.flatten(),
    );
  }

  const db = createServiceClient();

  // Get current bill
  const { data: currentBill, error: fetchError } = await db
    .from("bills")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !currentBill) {
    return errorResponse(ErrorCodes.NOT_FOUND, "Bill not found", 404);
  }

  const currentBillData = currentBill as Record<string, unknown>;

  // If discount is being updated, recalculate totals
  let updateData: Record<string, unknown> = { ...result.data };

  if (
    result.data.discount_type !== undefined ||
    result.data.discount_value !== undefined
  ) {
    const billItems = currentBillData.bill_items as Array<{
      item_id: string;
      item_type: "service" | "medicine";
      name: string;
      quantity: number;
      unit_price: number;
      gst_applicable: boolean;
      gst_rate: number;
    }>;
    const newDiscountType =
      result.data.discount_type ?? (currentBillData.discount_type as string);
    const newDiscountValue =
      result.data.discount_value ?? (currentBillData.discount_value as number);

    const calculatedItems = calculateBillItems(billItems);
    const totals = calculateBillTotals(
      calculatedItems,
      newDiscountType as "flat" | "percentage" | "none",
      newDiscountValue,
    );

    // Rebuild GST breakdown
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

    updateData = {
      ...updateData,
      discount_amount: totals.discount_amount,
      total_amount: totals.total_amount,
      gst_breakdown: Object.entries(gstBreakdown).map(([rate, vals]) => ({
        rate: parseFloat(rate),
        taxable_amount: Math.round(vals.taxable * 100) / 100,
        gst_amount: Math.round(vals.gst * 100) / 100,
      })),
    };
  }

  // Update bill
  const { data: updatedBill, error: updateError } = await db
    .from("bills")
    .update(updateData as never)
    .eq("id", id)
    .select()
    .single();

  if (updateError || !updatedBill) {
    console.error("Bill update error:", updateError);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to update bill",
      500,
    );
  }

  const oldValues = currentBillData;
  const newValues = updatedBill as Record<string, unknown>;

  // Create audit log
  await createAuditLog(auth, "bills", id, "update", oldValues, newValues);

  return successResponse(updatedBill);
}
