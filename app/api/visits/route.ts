import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { createServiceClient } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
} from "@/lib/utils/response";
import { createVisitSchema } from "@/lib/validations/visit";
import type { Visit, VisitWithPatient } from "@/types/database";

/**
 * GET /api/visits
 * List visits with optional filters
 * Query params: patient_id, date, page, per_page
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patient_id");
  const date = searchParams.get("date");
  const page = parseInt(searchParams.get("page") ?? "1");
  const perPage = parseInt(searchParams.get("per_page") ?? "20");
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const db = createServiceClient();

  let query = db
    .from("visits")
    .select(
      `
      id,
      patient_id,
      visit_date,
      visit_time,
      visit_type,
      chief_complaint,
      current_symptoms,
      status,
      created_at,
      patients (
        full_name,
        uhid
      )
    `,
      { count: "exact" },
    )
    .order("visit_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (patientId) {
    query = query.eq("patient_id", patientId);
  }
  if (date) {
    query = query.eq("visit_date", date);
  }

  const { data, error, count } = await query;

  if (error) {
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch visits",
      500,
    );
  }

  return successResponse(data as VisitWithPatient[], {
    total: count ?? 0,
    page,
    per_page: perPage,
  });
}

/**
 * POST /api/visits
 * Create a new visit
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

  const result = createVisitSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Validation failed",
      422,
      result.error.flatten(),
    );
  }

  const db = createServiceClient();

  const visitData = {
    ...result.data,
    created_by: auth.userId,
  };

  const { data, error } = await db
    .from("visits")
    .insert(visitData as never)
    .select()
    .single();

  if (error) {
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to create visit",
      500,
    );
  }

  return successResponse(data as Visit, undefined, 201);
}
