import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/middleware/auth";
import { requireRole } from "@/lib/middleware/role";
import { createServiceClient } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
} from "@/lib/utils/response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/appointments/[id]
 * Get single appointment
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const db = createServiceClient();

  const { data: appointment, error } = await db
    .from("appointments")
    .select(
      `
      *,
      patients(id, full_name, uhid, phone, email)
    `,
    )
    .eq("id", id)
    .single();

  if (error || !appointment) {
    return errorResponse(ErrorCodes.NOT_FOUND, "Appointment not found", 404);
  }

  return successResponse(appointment);
}

// Update appointment schema
const UpdateAppointmentSchema = z.object({
  appointment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  appointment_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  duration_minutes: z.number().int().positive().optional(),
  status: z
    .enum([
      "scheduled",
      "confirmed",
      "arrived",
      "completed",
      "cancelled",
      "no_show",
    ])
    .optional(),
  notes: z.string().optional(),
});

/**
 * PUT /api/appointments/[id]
 * Update appointment
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

  const result = UpdateAppointmentSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Validation failed",
      422,
      result.error.flatten(),
    );
  }

  const db = createServiceClient();

  // Check for conflicting appointment at new time
  if (result.data.appointment_date || result.data.appointment_time) {
    const { data: existing } = await db
      .from("appointments")
      .select("id, appointment_date, appointment_time")
      .eq("id", id)
      .single();

    if (!existing) {
      return errorResponse(ErrorCodes.NOT_FOUND, "Appointment not found", 404);
    }

    const existingData = existing as {
      appointment_date: string;
      appointment_time: string;
    };
    const newDate =
      result.data.appointment_date ?? existingData.appointment_date;
    const newTime =
      result.data.appointment_time ?? existingData.appointment_time;

    const { data: conflict } = await db
      .from("appointments")
      .select("id")
      .eq("appointment_date", newDate)
      .eq("appointment_time", newTime)
      .eq("status", "scheduled")
      .neq("id", id)
      .single();

    if (conflict) {
      return errorResponse(
        ErrorCodes.CONFLICT,
        "Appointment slot already booked",
        409,
      );
    }
  }

  // Update appointment
  const { data: appointment, error } = await db
    .from("appointments")
    .update(result.data as never)
    .eq("id", id)
    .select()
    .single();

  if (error || !appointment) {
    console.error("Appointment update error:", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to update appointment",
      500,
    );
  }

  const updatedAppointment = appointment as { status: string; patient_id: string; appointment_time: string };

  // If status changed to 'arrived', ensure patient is in today's queue
  if (updatedAppointment.status === "arrived") {
    const today = new Date().toISOString().split("T")[0];

    // Check if patient is already actively in the queue today
    const { data: existingVisit } = await db
      .from("visits")
      .select("id")
      .eq("patient_id", updatedAppointment.patient_id)
      .eq("visit_date", today)
      .in("status", ["waiting", "with_doctor"])
      .maybeSingle();

    if (!existingVisit) {
      const { error: insertErr } = await db.from("visits").insert({
        patient_id: updatedAppointment.patient_id,
        visit_date: today,
        visit_time: updatedAppointment.appointment_time || null,
        visit_type: "appointment",
        status: "waiting",
        created_by: auth.userId,
      } as never);
      if (insertErr) {
        console.error("Auto queue add error:", insertErr);
      }
    }
  }

  return successResponse(appointment);
}

/**
 * DELETE /api/appointments/[id]
 * Cancel appointment (soft delete - sets status to 'cancelled')
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const db = createServiceClient();

  // Check if appointment exists
  const { data: existing } = await db
    .from("appointments")
    .select("id, status")
    .eq("id", id)
    .single();

  if (!existing) {
    return errorResponse(ErrorCodes.NOT_FOUND, "Appointment not found", 404);
  }

  // Soft delete - update status to cancelled
  const { error } = await db
    .from("appointments")
    .update({ status: "cancelled" } as never)
    .eq("id", id);

  if (error) {
    console.error("Appointment cancel error:", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to cancel appointment",
      500,
    );
  }

  return successResponse({ id, status: "cancelled" });
}
