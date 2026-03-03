import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { createServiceClient } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
} from "@/lib/utils/response";
import { updateVisitSchema } from "@/lib/validations/visit";
import type { Visit, VisitWithPatient } from "@/types/database";
import { autoMarkTreatmentSession } from "@/lib/utils/treatment";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/visits/[id]
 * Get single visit with patient details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const db = createServiceClient();

  const { data, error } = await db
    .from("visits")
    .select(
      `
      *,
      patients (
        full_name,
        uhid,
        date_of_birth,
        gender
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return errorResponse(ErrorCodes.NOT_FOUND, "Visit not found", 404);
  }

  // Hide internal_notes and doctor_notes from frontdesk
  if (auth.profile.role === "frontdesk") {
    const visitData = data as Visit & {
      internal_notes: string | null;
      doctor_notes: string | null;
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { internal_notes, doctor_notes, ...safeData } = visitData;
    return successResponse(safeData);
  }

  return successResponse(data as VisitWithPatient);
}

/**
 * PUT /api/visits/[id]
 * Update visit (status, notes, etc.)
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

  const result = updateVisitSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Validation failed",
      422,
      result.error.flatten(),
    );
  }

  const db = createServiceClient();

  // Frontdesk cannot update clinical fields
  if (auth.profile.role === "frontdesk") {
    const { doctor_notes, internal_notes, ...allowedFields } = result.data;
    if (doctor_notes !== undefined || internal_notes !== undefined) {
      return errorResponse(
        ErrorCodes.FORBIDDEN,
        "Frontdesk cannot update clinical notes",
        403,
      );
    }

    // Allow only status updates for frontdesk
    const updateData = { status: allowedFields.status };

    const { data, error } = await db
      .from("visits")
      .update(updateData as never)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return errorResponse(ErrorCodes.NOT_FOUND, "Visit not found", 404);
    }

    return successResponse(data as Visit);
  }

  // Doctor can update all fields
  const { data, error } = await db
    .from("visits")
    .update(result.data as never)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return errorResponse(ErrorCodes.NOT_FOUND, "Visit not found", 404);
  }

  const visitData = data as Visit;

  // Auto-mark treatment session when visit completed
  if (result.data.status === "completed") {
    try {
      await autoMarkTreatmentSession(visitData.patient_id, id, auth.userId, db);
    } catch (sessionError) {
      return successResponse({
        visit: visitData,
        warning:
          "Visit marked complete but session auto-mark failed. Please mark the session manually.",
      });
    }
  }

  return successResponse(visitData);
}
