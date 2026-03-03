import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { generateUHID } from "@/lib/utils/uhid";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
} from "@/lib/utils/response";
import { createPatientSchema } from "@/lib/validations/patient";
import type { PatientListResponse } from "@/types/api";

/**
 * Patients API Routes
 *
 * GET /api/patients - List patients with search and pagination
 * POST /api/patients - Create new patient
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const db = createServiceClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const perPage = parseInt(searchParams.get("per_page") ?? "20");
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = db
    .from("patients")
    .select(
      "id, uhid, full_name, date_of_birth, gender, phone, email, city, patient_type, is_active, created_at",
      { count: "exact" },
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,phone.ilike.%${search}%,uhid.ilike.%${search}%`,
    );
  }

  // Frontdesk sees limited fields, doctor sees all fields
  if (auth.profile.role === "frontdesk") {
    query = db
      .from("patients")
      .select(
        "id, uhid, full_name, phone, email, city, patient_type, is_active, created_at",
        { count: "exact" },
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,phone.ilike.%${search}%,uhid.ilike.%${search}%`,
      );
    }
  }

  const { data, error, count } = await query;

  if (error) {
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch patients",
      500,
    );
  }

  const patients = data as PatientListResponse[];
  return successResponse(patients, {
    total: count ?? 0,
    page,
    per_page: perPage,
  });
}

/**
 * Create a new patient
 *
 * POST /api/patients - Create new patient
 * Validates phone uniqueness and generates UHID
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

  const result = createPatientSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Validation failed",
      422,
      result.error.flatten(),
    );
  }

  const db = createServiceClient();

  // Check phone uniqueness
  const { data: existing } = await db
    .from("patients")
    .select("id, uhid")
    .eq("phone", result.data.phone)
    .single();

  if (existing) {
    const existingPatient = existing as { id: string; uhid: string };
    return errorResponse(
      ErrorCodes.CONFLICT,
      "Phone number already registered",
      409,
      { uhid: existingPatient.uhid },
    );
  }

  const uhid = await generateUHID();

  // Use type assertion for insert due to Supabase type limitations
  const patientData = {
    ...result.data,
    uhid,
    created_by: auth.userId,
  };

  const { data: patient, error } = await db
    .from("patients")
    .insert(patientData as never)
    .select()
    .single();

  if (error) {
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to create patient",
      500,
    );
  }

  return successResponse(patient, undefined, 201);
}
