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
 * GET /api/audit
 * Get audit logs - doctor only
 * Query params: table, record_id, from_date, to_date, page, per_page
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  // Only doctor can view audit logs
  const forbidden = requireRole(auth, "doctor");
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const tableName = searchParams.get("table");
  const recordId = searchParams.get("record_id");
  const fromDate = searchParams.get("from_date");
  const toDate = searchParams.get("to_date");
  const page = parseInt(searchParams.get("page") ?? "1");
  const perPage = parseInt(searchParams.get("per_page") ?? "20");
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const db = createServiceClient();

  let query = db
    .from("audit_logs")
    .select(
      `
      id,
      table_name,
      record_id,
      action,
      changed_by,
      changed_by_role,
      old_values,
      new_values,
      ip_address,
      created_at,
      profiles(full_name, role)
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (tableName) {
    query = query.eq("table_name", tableName);
  }

  if (recordId) {
    query = query.eq("record_id", recordId);
  }

  if (fromDate) {
    query = query.gte("created_at", fromDate);
  }

  if (toDate) {
    query = query.lte("created_at", toDate);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Audit logs fetch error:", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch audit logs",
      500,
    );
  }

  return successResponse(data, { total: count ?? 0, page, per_page: perPage });
}
