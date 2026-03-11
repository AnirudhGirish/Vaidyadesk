/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { successResponse, errorResponse, ErrorCodes } from "@/lib/utils/response";

/**
 * GET /api/reports
 * Combined summary report used by the Reports page.
 * Query params: from_date, to_date
 */
export async function GET(request: NextRequest) {
    const auth = await requireAuth();
    if (auth instanceof Response) return auth;

    const { searchParams } = new URL(request.url);
    const today = new Date().toISOString().split("T")[0];
    const fromDate = searchParams.get("from_date") ?? new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    const toDate = searchParams.get("to_date") ?? today;

    const db = createServiceClient();

    // Parallel fetch all data
    const [billsResult, patientsResult, visitsResult] = await Promise.all([
        (db as any)
            .from("bills")
            .select("id, total_amount, payment_status, bill_date, bill_items")
            .gte("bill_date", fromDate)
            .lte("bill_date", toDate),
        (db as any)
            .from("patients")
            .select("id, created_at")
            .gte("created_at", fromDate + "T00:00:00")
            .lte("created_at", toDate + "T23:59:59"),
        (db as any)
            .from("visits")
            .select("id, visit_date, status")
            .gte("visit_date", fromDate)
            .lte("visit_date", toDate),
    ]);

    const bills: any[] = billsResult.data ?? [];
    const patients: any[] = patientsResult.data ?? [];
    const visits: any[] = visitsResult.data ?? [];

    // Revenue by day
    const revenueByDay: Record<string, number> = {};
    for (const b of bills) {
        if (b.payment_status === "paid" || b.payment_status === "partial") {
            const d = b.bill_date;
            revenueByDay[d] = (revenueByDay[d] ?? 0) + Number(b.total_amount ?? 0);
        }
    }

    // Fill in missing days with 0
    const dayMs = 86400000;
    const from = new Date(fromDate).getTime();
    const to = new Date(toDate).getTime();
    const revenueDays: Array<{ date: string; total: number }> = [];
    for (let t = from; t <= to; t += dayMs) {
        const d = new Date(t).toISOString().split("T")[0];
        revenueDays.push({ date: d, total: revenueByDay[d] ?? 0 });
    }

    const totalRevenue = bills.reduce((s: number, b: any) => {
        return b.payment_status === "paid" || b.payment_status === "partial"
            ? s + Number(b.total_amount ?? 0)
            : s;
    }, 0);

    const totalBills = bills.length;
    const avgBill = totalBills > 0 ? totalRevenue / totalBills : 0;

    // Dues summary
    const dueAmount = bills.reduce((s: number, b: any) => {
        return b.payment_status === "due" || b.payment_status === "partial"
            ? s + Number(b.total_amount ?? 0)
            : s;
    }, 0);

    // Top services
    const serviceCounts: Record<string, { count: number; revenue: number }> = {};
    for (const b of bills) {
        for (const item of b.bill_items ?? []) {
            const name = item.name ?? "Unknown";
            if (!serviceCounts[name]) serviceCounts[name] = { count: 0, revenue: 0 };
            serviceCounts[name].count += item.quantity ?? 1;
            serviceCounts[name].revenue += Number(item.line_total ?? 0);
        }
    }
    const topServices = Object.entries(serviceCounts)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5)
        .map(([name, val]) => ({ name, ...val }));

    return successResponse({
        revenue_by_day: revenueDays,
        total_revenue: totalRevenue,
        total_patients: patients.length,
        total_bills: totalBills,
        avg_bill: avgBill,
        due_amount: dueAmount,
        total_visits: visits.length,
        completed_visits: visits.filter((v: any) => v.status === "completed").length,
        top_services: topServices,
        period: { from_date: fromDate, to_date: toDate },
    });
}
