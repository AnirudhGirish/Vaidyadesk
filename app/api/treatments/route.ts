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

/**
 * GET /api/treatments
 * List treatments with optional filters
 * Query params: patient_id, status, page, per_page
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patient_id");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1");
  const perPage = parseInt(searchParams.get("per_page") ?? "20");
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const db = createServiceClient();

  let query = db
    .from("patient_treatments")
    .select(
      `
      id,
      patient_id,
      visit_id,
      service_name,
      service_id,
      package_days,
      sessions_total,
      sessions_consumed,
      start_date,
      end_date,
      status,
      notes,
      created_at,
      patients(full_name, uhid)
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (patientId) {
    query = query.eq("patient_id", patientId);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) {
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch treatments",
      500,
    );
  }

  return successResponse(data, { total: count ?? 0, page, per_page: perPage });
}

// Schema for creating a treatment
const CreateTreatmentSchema = z.object({
  patient_id: z.string().uuid(),
  visit_id: z.string().uuid().optional(),
  service_id: z.string().uuid(),
  service_name: z.string(),
  package_days: z.number().int().positive().optional(),
  sessions_total: z.number().int().positive(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/treatments
 * Create a new treatment package for a patient
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

  const result = CreateTreatmentSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Validation failed",
      422,
      result.error.flatten(),
    );
  }

  const db = createServiceClient();

  // Verify service exists and is active
  const { data: service } = await db
    .from("catalogue_services")
    .select("id, name, duration_type, package_days, base_price")
    .eq("id", result.data.service_id)
    .eq("is_active", true)
    .single();

  if (!service) {
    return errorResponse(
      ErrorCodes.NOT_FOUND,
      "Service not found or inactive",
      404,
    );
  }

  // Calculate end date if it's a package
  let endDate: string | null = null;
  const serviceData = service as {
    duration_type: string;
    package_days: number | null;
  };
  if (serviceData.duration_type === "package" && result.data.package_days) {
    const start = result.data.start_date
      ? new Date(result.data.start_date)
      : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + result.data.package_days);
    endDate = end.toISOString().split("T")[0];
  }

  const patientData = {
    patient_id: result.data.patient_id,
    visit_id: result.data.visit_id ?? null,
    service_id: result.data.service_id,
    service_name: result.data.service_name,
    package_days: result.data.package_days ?? serviceData.package_days,
    sessions_total: result.data.sessions_total,
    sessions_consumed: 0,
    start_date:
      result.data.start_date ?? new Date().toISOString().split("T")[0],
    end_date: endDate,
    status: "active",
    notes: result.data.notes ?? null,
    created_by: auth.userId,
  };

  const { data: treatment, error } = await db
    .from("patient_treatments")
    .insert(patientData as never)
    .select()
    .single();

  if (error || !treatment) {
    console.error("Treatment creation error:", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to create treatment",
      500,
    );
  }

  const treatmentRecord = treatment as { id: string; [key: string]: unknown };

  // Create audit log
  await createAuditLog(
    auth,
    "patient_treatments",
    treatmentRecord.id,
    "create",
    null,
    treatmentRecord as Record<string, unknown>,
  );

  return successResponse(treatment, undefined, 201);
}
