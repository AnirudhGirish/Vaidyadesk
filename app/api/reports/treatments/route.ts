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
 * GET /api/reports/treatments
 * Get treatment statistics
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  // Only doctor can view reports
  const forbidden = requireRole(auth, "doctor");
  if (forbidden) return forbidden;

  const db = createServiceClient();

  // Get all treatments
  const { data: treatments, error } = await db.from("patient_treatments")
    .select(`
      id,
      status,
      sessions_total,
      sessions_consumed,
      service_name,
      catalogue_services(category)
    `);

  if (error) {
    console.error("Treatment report error:", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch treatment data",
      500,
    );
  }

  const treatmentsData = treatments as Array<{
    status: string;
    sessions_total: number;
    sessions_consumed: number;
    service_name: string;
    catalogue_services: { category: string | null } | null;
  }> | null;

  // Calculate statistics
  const total = (treatmentsData ?? []).length;
  const byStatus: Record<string, number> = {};
  const byService: Record<string, number> = {};

  for (const treatment of treatmentsData ?? []) {
    // Count by status
    byStatus[treatment.status] = (byStatus[treatment.status] ?? 0) + 1;

    // Count by service
    const serviceName = treatment.service_name;
    byService[serviceName] = (byService[serviceName] ?? 0) + 1;
  }

  // Calculate active sessions
  let totalSessions = 0;
  let consumedSessions = 0;
  for (const t of treatmentsData ?? []) {
    totalSessions += t.sessions_total;
    consumedSessions += t.sessions_consumed;
  }

  return successResponse({
    total,
    active: byStatus.active ?? 0,
    completed: byStatus.completed ?? 0,
    paused: byStatus.paused ?? 0,
    cancelled: byStatus.cancelled ?? 0,
    totalSessions,
    consumedSessions,
    remainingSessions: totalSessions - consumedSessions,
    topServices: Object.entries(byService)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  });
}
