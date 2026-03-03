import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { createServiceClient } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
} from "@/lib/utils/response";
import { updatePatientSchema } from "@/lib/validations/patient";
import type { Patient } from "@/types/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Get single patient by ID
 *
 * GET /api/patients/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const db = createServiceClient();

  let query = db.from("patients").select("*").eq("id", id).single();

  // Filter sensitive fields for frontdesk
  if (auth.profile.role === "frontdesk") {
    query = db
      .from("patients")
      .select(
        "id, uhid, full_name, date_of_birth, gender, phone, email, address, city, patient_type, is_active, created_at",
      )
      .eq("id", id)
      .single();
  }

  const { data: patient, error } = await query;

  if (error || !patient) {
    return errorResponse(ErrorCodes.NOT_FOUND, "Patient not found", 404);
  }

  return successResponse(patient as Patient);
}

/**
 * Update patient
 *
 * PUT /api/patients/[id]
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

  const result = updatePatientSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Validation failed",
      422,
      result.error.flatten(),
    );
  }

  const db = createServiceClient();

  // If phone is being updated, check uniqueness
  if (result.data.phone) {
    const { data: existing } = await db
      .from("patients")
      .select("id")
      .eq("phone", result.data.phone)
      .neq("id", id)
      .single();

    if (existing) {
      return errorResponse(
        ErrorCodes.CONFLICT,
        "Phone number already registered to another patient",
        409,
      );
    }
  }

  const { data: patient, error } = await db
    .from("patients")
    .update(result.data as never)
    .eq("id", id)
    .select()
    .single();

  if (error || !patient) {
    return errorResponse(ErrorCodes.NOT_FOUND, "Patient not found", 404);
  }

  return successResponse(patient as Patient);
}
