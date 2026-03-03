import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { requireRole } from "@/lib/middleware/role";
import { createServiceClient } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
} from "@/lib/utils/response";
import { prescriptionSchema } from "@/lib/validations/visit";
import type { VisitPrescription } from "@/types/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/visits/[id]/prescription
 * Get prescription for a visit
 * Both roles can view (needed for printing)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const db = createServiceClient();

  const { data, error } = await db
    .from("visit_prescriptions")
    .select("*")
    .eq("visit_id", id)
    .single();

  // PGRST116 = no rows found
  if (error && error.code !== "PGRST116") {
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch prescription",
      500,
    );
  }

  // Return null if no prescription yet — this is valid
  return successResponse(data as VisitPrescription | null);
}

/**
 * PUT /api/visits/[id]/prescription
 * Create or update prescription for a visit
 * Doctor only
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

  const result = prescriptionSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Validation failed",
      422,
      result.error.flatten(),
    );
  }

  const db = createServiceClient();

  // Get visit to get patient_id
  const { data: visit } = await db
    .from("visits")
    .select("patient_id")
    .eq("id", id)
    .single();

  if (!visit) {
    return errorResponse(ErrorCodes.NOT_FOUND, "Visit not found", 404);
  }

  const visitData = visit as { patient_id: string };

  const prescriptionData = {
    visit_id: id,
    patient_id: visitData.patient_id,
    created_by: auth.userId,
    medicines: result.data.medicines ?? [],
    treatment_notes: result.data.treatment_notes,
    diet_advice: result.data.diet_advice,
    lifestyle_advice: result.data.lifestyle_advice,
    follow_up_notes: result.data.follow_up_notes,
  };

  const { data, error } = await db
    .from("visit_prescriptions")
    .upsert(prescriptionData as never, { onConflict: "visit_id" })
    .select()
    .single();

  if (error) {
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to save prescription",
      500,
    );
  }

  return successResponse(data as VisitPrescription);
}
