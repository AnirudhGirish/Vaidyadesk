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
 * GET /api/reports/patients
 * Get patient statistics
 * Query params: from_date, to_date
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

  const db = createServiceClient();

  // Base query
  let query = db
    .from("patients")
    .select("id, patient_type, referred_by, created_at", { count: "exact" });

  if (fromDate) {
    query = query.gte("created_at", fromDate);
  }

  if (toDate) {
    query = query.lte("created_at", toDate);
  }

  const { data: patients, error } = await query;

  if (error) {
    console.error("Patient report error:", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch patient data",
      500,
    );
  }

  const patientsData = patients as Array<{
    patient_type: string;
    referred_by: string | null;
  }> | null;

  // Calculate statistics
  const total = (patientsData ?? []).length;
  const byType: Record<string, number> = {};
  const byReferral: Record<string, number> = {};

  for (const patient of patientsData ?? []) {
    // Count by type
    byType[patient.patient_type] = (byType[patient.patient_type] ?? 0) + 1;

    // Count by referral
    const referral = patient.referred_by ?? "Self";
    byReferral[referral] = (byReferral[referral] ?? 0) + 1;
  }

  return successResponse({
    total,
    byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
    byReferral: Object.entries(byReferral).map(([source, count]) => ({
      source,
      count,
    })),
  });
}
