import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/middleware/auth";
import { createServiceClient } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
} from "@/lib/utils/response";

/**
 * GET /api/appointments
 * List appointments with optional filters
 * Query params: patient_id, date, status, from_date, to_date, page, per_page
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patient_id");
  const date = searchParams.get("date");
  const status = searchParams.get("status");
  const fromDate = searchParams.get("from_date");
  const toDate = searchParams.get("to_date");
  const page = parseInt(searchParams.get("page") ?? "1");
  const perPage = parseInt(searchParams.get("per_page") ?? "20");
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const db = createServiceClient();

  let query = db
    .from("appointments")
    .select(
      `
      id,
      patient_id,
      appointment_date,
      appointment_time,
      duration_minutes,
      status,
      notes,
      created_at,
      patients(id, full_name, uhid, phone)
    `,
      { count: "exact" },
    )
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true })
    .range(from, to);

  if (patientId) {
    query = query.eq("patient_id", patientId);
  }

  if (date) {
    query = query.eq("appointment_date", date);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (fromDate) {
    query = query.gte("appointment_date", fromDate);
  }

  if (toDate) {
    query = query.lte("appointment_date", toDate);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Appointments fetch error:", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch appointments",
      500,
    );
  }

  return successResponse(data, { total: count ?? 0, page, per_page: perPage });
}

// Create appointment schema
const CreateAppointmentSchema = z.object({
  patient_id: z.string().uuid(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/),
  duration_minutes: z.number().int().positive().default(30),
  notes: z.string().optional(),
});

/**
 * POST /api/appointments
 * Create a new appointment
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

  const result = CreateAppointmentSchema.safeParse(body);
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
    .eq("id", result.data.patient_id)
    .single();

  if (!patient) {
    return errorResponse(ErrorCodes.NOT_FOUND, "Patient not found", 404);
  }

  // Check for conflicting appointment at same time
  const { data: conflict } = await db
    .from("appointments")
    .select("id")
    .eq("appointment_date", result.data.appointment_date)
    .eq("appointment_time", result.data.appointment_time)
    .eq("status", "scheduled")
    .single();

  if (conflict) {
    return errorResponse(
      ErrorCodes.CONFLICT,
      "Appointment slot already booked",
      409,
    );
  }

  // Create appointment
  const { data: appointment, error } = await db
    .from("appointments")
    .insert({
      patient_id: result.data.patient_id,
      appointment_date: result.data.appointment_date,
      appointment_time: result.data.appointment_time,
      duration_minutes: result.data.duration_minutes,
      status: "scheduled",
      notes: result.data.notes ?? null,
      created_by: auth.userId,
    } as never)
    .select()
    .single();

  if (error || !appointment) {
    console.error("Appointment creation error:", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to create appointment",
      500,
    );
  }

  return successResponse(appointment, undefined, 201);
}
