import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/middleware/auth";
import { createServiceClient } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
} from "@/lib/utils/response";
import { autoMarkTreatmentSession } from "@/lib/utils/treatment";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Schema for updating visit status in queue
const UpdateQueueStatusSchema = z.object({
  status: z.enum([
    "waiting",
    "arrived",
    "with_doctor",
    "completed",
    "cancelled",
  ]),
});

/**
 * PUT /api/queue/[id]/status
 * Update visit status in queue
 *
 * Frontdesk: can set waiting, arrived
 * Doctor: can set with_doctor, completed, cancelled
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

  const result = UpdateQueueStatusSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Validation failed",
      422,
      result.error.flatten(),
    );
  }

  const db = createServiceClient();

  // Get current visit
  const { data: visit, error: fetchError } = await db
    .from("visits")
    .select("id, patient_id, status")
    .eq("id", id)
    .single();

  if (fetchError || !visit) {
    return errorResponse(ErrorCodes.NOT_FOUND, "Visit not found", 404);
  }

  const visitData = visit as { id: string; patient_id: string; status: string };

  // Validate role-based status transitions
  if (auth.profile.role === "frontdesk") {
    const allowedStatuses = ["waiting", "arrived", "with_doctor", "completed"];
    if (!allowedStatuses.includes(result.data.status)) {
      return errorResponse(
        ErrorCodes.FORBIDDEN,
        "Frontdesk cannot cancel visits — only doctors can",
        403,
      );
    }
  }

  // Update status
  const { data: updatedVisit, error: updateError } = await db
    .from("visits")
    .update({ status: result.data.status } as never)
    .eq("id", id)
    .select()
    .single();

  if (updateError || !updatedVisit) {
    console.error("Status update error:", updateError);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to update status",
      500,
    );
  }

  // Auto-mark treatment session when visit completed
  if (result.data.status === "completed") {
    await autoMarkTreatmentSession(visitData.patient_id, id, auth.userId, db);
  }

  return successResponse(updatedVisit);
}
