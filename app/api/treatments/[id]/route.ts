import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/middleware/auth";
import { createServiceClient } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
} from "@/lib/utils/response";
import { createAuditLog } from "@/lib/utils/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/treatments/[id]
 * Get single treatment with sessions
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const db = createServiceClient();

  const { data: treatment, error } = await db
    .from("patient_treatments")
    .select(
      `
      *,
      patients(id, full_name, uhid),
      catalogue_services(name, category)
    `,
    )
    .eq("id", id)
    .single();

  if (error || !treatment) {
    return errorResponse(ErrorCodes.NOT_FOUND, "Treatment not found", 404);
  }

  // Get treatment sessions
  const { data: sessions } = await db
    .from("treatment_sessions")
    .select("*")
    .eq("patient_treatment_id", id)
    .order("session_date", { ascending: true });

  const treatmentWithSessions = Object.assign({}, treatment, {
    sessions: sessions ?? [],
  });
  return successResponse(treatmentWithSessions);
}

// Update treatment schema
const UpdateTreatmentSchema = z.object({
  status: z.enum(["active", "completed", "cancelled", "paused"]).optional(),
  notes: z.string().optional(),
});

/**
 * PUT /api/treatments/[id]
 * Update treatment status/notes
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid JSON body", 400);
  }

  const result = UpdateTreatmentSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Validation failed",
      422,
      result.error.flatten(),
    );
  }

  const db = createServiceClient();

  // Get current treatment
  const { data: currentTreatment, error: fetchError } = await db
    .from("patient_treatments")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !currentTreatment) {
    return errorResponse(ErrorCodes.NOT_FOUND, "Treatment not found", 404);
  }

  const currentData = currentTreatment as Record<string, unknown>;
  const currentStatus = currentData.status as string;

  // Validate status transitions
  if (result.data.status) {
    if (currentStatus === "completed" || currentStatus === "cancelled") {
      return errorResponse(
        ErrorCodes.CONFLICT,
        "Cannot change status of completed or cancelled treatment",
        409,
      );
    }
  }

  // Update treatment
  const { data: updatedTreatment, error: updateError } = await db
    .from("patient_treatments")
    .update(result.data as never)
    .eq("id", id)
    .select()
    .single();

  if (updateError || !updatedTreatment) {
    console.error("Treatment update error:", updateError);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to update treatment",
      500,
    );
  }

  // Create audit log
  await createAuditLog(
    auth,
    "patient_treatments",
    id,
    "update",
    currentData,
    updatedTreatment as Record<string, unknown>,
  );

  return successResponse(updatedTreatment);
}
