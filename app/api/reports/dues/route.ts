import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { requireRole } from "@/lib/middleware/role";
import { createServiceClient } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
} from "@/lib/utils/response";

/**
 * GET /api/reports/dues
 * Get outstanding dues report
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  // Only doctor can view reports
  const forbidden = requireRole(auth, "doctor");
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const minAmount = parseFloat(searchParams.get("min_amount") ?? "0");

  const db = createServiceClient();

  // Get bills with payment_status not 'paid'
  const { data: bills, error } = await db
    .from("bills")
    .select(
      `
      id,
      bill_number,
      bill_date,
      total_amount,
      payment_status,
      patients(id, full_name, uhid, phone)
    `,
    )
    .in("payment_status", ["due", "partial"])
    .order("bill_date", { ascending: true });

  if (error) {
    console.error("Dues report error:", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch dues data",
      500,
    );
  }

  // Get all payments
  const { data: payments } = await db
    .from("payments")
    .select("bill_id, amount, payment_type");

  const paymentsData = payments as Array<{
    bill_id: string;
    amount: number;
    payment_type: string;
  }> | null;

  const billsData = bills as Array<{
    id: string;
    bill_number: string;
    bill_date: string;
    total_amount: number;
    payment_status: string;
    patients: {
      id: string;
      full_name: string;
      uhid: string;
      phone: string;
    } | null;
  }> | null;

  // Calculate outstanding dues
  const dues: Array<{
    billId: string;
    billNumber: string;
    billDate: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    patient: {
      id: string;
      full_name: string;
      uhid: string;
      phone: string;
    } | null;
  }> = [];

  for (const bill of billsData ?? []) {
    const billPayments = (paymentsData ?? []).filter(
      (p) => p.bill_id === bill.id && p.payment_type !== "refund",
    );
    const paidAmount = billPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const dueAmount = Number(bill.total_amount) - paidAmount;

    if (dueAmount > minAmount) {
      dues.push({
        billId: bill.id,
        billNumber: bill.bill_number,
        billDate: bill.bill_date,
        totalAmount: Number(bill.total_amount),
        paidAmount,
        dueAmount,
        patient: bill.patients,
      });
    }
  }

  // Calculate totals
  const totalDues = dues.reduce((sum, d) => sum + d.dueAmount, 0);

  return successResponse({
    totalDues,
    totalBills: dues.length,
    oldestDue: dues.length > 0 ? dues[0] : null,
    dues: dues.sort((a, b) => a.dueAmount - b.dueAmount).reverse(),
  });
}
