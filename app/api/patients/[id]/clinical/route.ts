import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { requireRole } from "@/lib/middleware/role";
import { createServiceClient } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
} from "@/lib/utils/response";
import { clinicalProfileSchema } from "@/lib/validations/patient";
import type { PatientClinicalProfile } from "@/types/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Get patient clinical profile
 * Doctor only access
 *
 * GET /api/patients/[id]/clinical
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const forbidden = requireRole(auth, "doctor");
  if (forbidden) return forbidden;

  const { id } = await params;
  const db = createServiceClient();

  const { data, error } = await db
    .from("patient_clinical_profiles")
    .select("*")
    .eq("patient_id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch clinical profile",
      500,
    );
  }

  // Return null if no clinical profile yet — this is valid
  return successResponse(data);
}

/**
 * Create or update patient clinical profile
 * Doctor only
 *
 * PUT /api/patients/[id]/clinical
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const forbidden = requireRole(auth, "doctor");
  if (forbidden) return forbidden;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid JSON body", 400);
  }

  const result = clinicalProfileSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Validation failed",
      422,
      result.error.flatten(),
    );
  }

  const db = createServiceClient();

  // Verify patient exists
  const { data: patient } = await db
    .from("patients")
    .select("id")
    .eq("id", id)
    .single();

  if (!patient) {
    return errorResponse(ErrorCodes.NOT_FOUND, "Patient not found", 404);
  }

  // Upsert clinical profile
  const clinicalData = {
    patient_id: id,
    created_by: auth.userId,
    ...result.data,
  };

  const { data, error } = await db
    .from("patient_clinical_profiles")
    .upsert(clinicalData as never, { onConflict: "patient_id" })
    .select()
    .single();

  if (error) {
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to save clinical profile",
      500,
    );
  }

  return successResponse(data as PatientClinicalProfile);
}
