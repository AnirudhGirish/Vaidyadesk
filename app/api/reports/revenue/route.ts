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
 * GET /api/reports/revenue
 * Get revenue report by date range
 * Query params: from_date, to_date, group_by (day|week|month)
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  // Only doctor can view reports
  const forbidden = requireRole(auth, "doctor");
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const fromDate = searchParams.get("from_date");
  const toDate = searchParams.get("to_date");
  const groupBy = searchParams.get("group_by") ?? "day";

  const db = createServiceClient();

  // Get bills with their payments
  let query = db
    .from("bills")
    .select(
      `
      id,
      bill_date,
      total_amount,
      payment_status,
      subtotal,
      discount_amount
    `,
    )
    .order("bill_date", { ascending: true });

  if (fromDate) {
    query = query.gte("bill_date", fromDate);
  }

  if (toDate) {
    query = query.lte("bill_date", toDate);
  }

  const { data: bills, error } = await query;

  if (error) {
    console.error("Revenue report error:", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch revenue data",
      500,
    );
  }

  // Get all payments in date range
  let paymentsQuery = db
    .from("payments")
    .select(
      `
      id,
      bill_id,
      payment_date,
      amount,
      payment_type
    `,
    )
    .order("payment_date", { ascending: true });

  if (fromDate) {
    paymentsQuery = paymentsQuery.gte("payment_date", fromDate);
  }

  if (toDate) {
    paymentsQuery = paymentsQuery.lte("payment_date", toDate);
  }

  const { data: payments } = await paymentsQuery;

  const paymentsData = payments as Array<{
    bill_id: string;
    amount: number;
    payment_type: string;
  }> | null;
  const billsData = bills as Array<{
    id: string;
    bill_date: string;
    total_amount: number;
    payment_status: string;
  }> | null;

  // Group by date
  const revenueByDate: Record<
    string,
    {
      date: string;
      totalBilled: number;
      totalCollected: number;
      totalDue: number;
      billCount: number;
    }
  > = {};

  for (const bill of billsData ?? []) {
    const dateKey = bill.bill_date;

    if (!revenueByDate[dateKey]) {
      revenueByDate[dateKey] = {
        date: dateKey,
        totalBilled: 0,
        totalCollected: 0,
        totalDue: 0,
        billCount: 0,
      };
    }

    revenueByDate[dateKey].totalBilled += Number(bill.total_amount);
    revenueByDate[dateKey].billCount += 1;

    if (bill.payment_status === "paid") {
      revenueByDate[dateKey].totalCollected += Number(bill.total_amount);
    } else if (bill.payment_status === "partial") {
      // Calculate actual paid amount from payments
      const billPayments = (paymentsData ?? []).filter(
        (p) => p.bill_id === bill.id && p.payment_type !== "refund",
      );
      const paidAmount = billPayments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );
      revenueByDate[dateKey].totalCollected += paidAmount;
      revenueByDate[dateKey].totalDue += Number(bill.total_amount) - paidAmount;
    } else {
      revenueByDate[dateKey].totalDue += Number(bill.total_amount);
    }
  }

  // If group by week or month, aggregate
  let finalData: Array<{
    date: string;
    totalBilled: number;
    totalCollected: number;
    totalDue: number;
    billCount: number;
  }>;

  if (groupBy === "month") {
    const byMonth: Record<string, (typeof revenueByDate)[string]> = {};
    for (const entry of Object.values(revenueByDate)) {
      const monthKey = entry.date.substring(0, 7); // YYYY-MM
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = {
          date: monthKey,
          totalBilled: 0,
          totalCollected: 0,
          totalDue: 0,
          billCount: 0,
        };
      }
      byMonth[monthKey].totalBilled += entry.totalBilled;
      byMonth[monthKey].totalCollected += entry.totalCollected;
      byMonth[monthKey].totalDue += entry.totalDue;
      byMonth[monthKey].billCount += entry.billCount;
    }
    finalData = Object.values(byMonth).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  } else {
    finalData = Object.values(revenueByDate).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

  // Calculate totals
  const totals = finalData.reduce(
    (acc, curr) => ({
      totalBilled: acc.totalBilled + curr.totalBilled,
      totalCollected: acc.totalCollected + curr.totalCollected,
      totalDue: acc.totalDue + curr.totalDue,
      billCount: acc.billCount + curr.billCount,
    }),
    { totalBilled: 0, totalCollected: 0, totalDue: 0, billCount: 0 },
  );

  return successResponse({
    summary: totals,
    breakdown: finalData,
  });
}
