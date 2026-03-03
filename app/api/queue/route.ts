import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/middleware/auth";
import { createServiceClient } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
} from "@/lib/utils/response";

type VisitWithPatient = {
  id: string;
  visit_type: string;
  visit_time: string | null;
  chief_complaint: string | null;
  status: string;
  created_at: string;
  patients: {
    id: string;
    full_name: string;
    uhid: string;
    date_of_birth: string;
    gender: string;
    patient_type: string;
  } | null;
};

/**
 * GET /api/queue
 * Get today's queue with patient info
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const today = new Date().toISOString().split("T")[0];
  const db = createServiceClient();

  const { data, error } = await db
    .from("visits")
    .select(
      `
      id,
      visit_type,
      visit_time,
      chief_complaint,
      status,
      created_at,
      patients(id, full_name, uhid, date_of_birth, gender, patient_type)
    `,
    )
    .eq("visit_date", today)
    .neq("status", "cancelled")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Queue fetch error:", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch queue",
      500,
    );
  }

  const visits = data as VisitWithPatient[] | null;

  // Add token number
  const queue = (visits ?? []).map((visitItem, index) => ({
    ...visitItem,
    token: index + 1,
  }));

  return successResponse(queue);
}

// Add to queue schema
const AddToQueueSchema = z.object({
  patient_id: z.string().uuid(),
  visit_type: z.enum(["walkin", "appointment"]).default("walkin"),
  visit_time: z.string().optional(),
  chief_complaint: z.string().optional(),
});

/**
 * POST /api/queue
 * Add patient to today's queue (creates a visit)
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

  const result = AddToQueueSchema.safeParse(body);
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

  const today = new Date().toISOString().split("T")[0];

  // Check if patient already in queue today
  const { data: existingVisit } = await db
    .from("visits")
    .select("id, status")
    .eq("patient_id", result.data.patient_id)
    .eq("visit_date", today)
    .neq("status", "cancelled")
    .single();

  if (existingVisit) {
    return errorResponse(
      ErrorCodes.CONFLICT,
      "Patient already in queue today",
      409,
    );
  }

  // Create visit (add to queue)
  const { data: visit, error } = await db
    .from("visits")
    .insert({
      patient_id: result.data.patient_id,
      visit_date: today,
      visit_time: result.data.visit_time ?? null,
      visit_type: result.data.visit_type,
      chief_complaint: result.data.chief_complaint ?? null,
      status: "waiting",
      created_by: auth.userId,
    } as never)
    .select()
    .single();

  if (error || !visit) {
    console.error("Queue add error:", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to add to queue",
      500,
    );
  }

  return successResponse(visit, undefined, 201);
}
