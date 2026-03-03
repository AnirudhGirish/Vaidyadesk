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

// Schema for marking session
const MarkSessionSchema = z.object({
  session_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/treatments/[id]/session
 * Mark a treatment session as completed
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid JSON body", 400);
  }

  const result = MarkSessionSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Validation failed",
      422,
      result.error.flatten(),
    );
  }

  const db = createServiceClient();

  // Get treatment
  const { data: treatment, error: fetchError } = await db
    .from("patient_treatments")
    .select("id, sessions_consumed, sessions_total, status, patient_id")
    .eq("id", id)
    .single();

  if (fetchError || !treatment) {
    return errorResponse(ErrorCodes.NOT_FOUND, "Treatment not found", 404);
  }

  const treatmentData = treatment as {
    id: string;
    sessions_consumed: number;
    sessions_total: number;
    status: string;
    patient_id: string;
  };

  // Validate treatment is active
  if (treatmentData.status !== "active") {
    return errorResponse(ErrorCodes.CONFLICT, "Treatment is not active", 409);
  }

  // Check if all sessions already consumed
  if (treatmentData.sessions_consumed >= treatmentData.sessions_total) {
    return errorResponse(
      ErrorCodes.CONFLICT,
      "All sessions already consumed",
      409,
    );
  }

  const sessionDate =
    result.data.session_date ?? new Date().toISOString().split("T")[0];

  // Check if session already marked for this date
  const { data: existingSession } = await db
    .from("treatment_sessions")
    .select("id")
    .eq("patient_treatment_id", id)
    .eq("session_date", sessionDate)
    .single();

  if (existingSession) {
    return errorResponse(
      ErrorCodes.CONFLICT,
      "Session already marked for this date",
      409,
    );
  }

  const nextSessionNumber = treatmentData.sessions_consumed + 1;

  // Create session record
  const { data: sessionRecord, error: sessionError } = await db
    .from("treatment_sessions")
    .insert({
      patient_treatment_id: id,
      patient_id: treatmentData.patient_id,
      session_number: nextSessionNumber,
      session_date: sessionDate,
      marked_by: auth.userId,
      notes: result.data.notes ?? null,
    } as never)
    .select()
    .single();

  if (sessionError || !sessionRecord) {
    console.error("Session creation error:", sessionError);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to record session",
      500,
    );
  }

  // Update treatment consumed count
  const newStatus =
    nextSessionNumber >= treatmentData.sessions_total ? "completed" : "active";

  const { data: updatedTreatment, error: updateError } = await db
    .from("patient_treatments")
    .update({
      sessions_consumed: nextSessionNumber,
      status: newStatus,
    } as never)
    .eq("id", id)
    .select()
    .single();

  if (updateError || !updatedTreatment) {
    // Rollback the session insert
    await db
      .from("treatment_sessions")
      .delete()
      .eq("id", (sessionRecord as { id: string }).id);
    console.error("Treatment update error:", updateError);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to update treatment progress. Please try again.",
      500,
    );
  }

  // Create audit log
  await createAuditLog(
    auth,
    "treatment_sessions",
    (sessionRecord as { id: string }).id,
    "create",
    null,
    sessionRecord as Record<string, unknown>,
  );

  return successResponse(
    {
      treatment: updatedTreatment,
      session: sessionRecord,
    },
    undefined,
    201,
  );
}
