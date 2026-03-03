import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { requireRole } from "@/lib/middleware/role";
import { createServiceClient } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
} from "@/lib/utils/response";
import { createMedicineSchema } from "@/lib/validations/catalogue";
import type { CatalogueMedicine } from "@/types/database";

/**
 * GET /api/catalogue/medicines
 * List all medicines
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active_only") !== "false";
  const type = searchParams.get("type");

  const db = createServiceClient();

  let query = db
    .from("catalogue_medicines")
    .select(
      "id, name, type, form, unit, price_per_unit, gst_applicable, gst_rate, is_active, created_at",
    )
    .order("created_at", { ascending: false });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch medicines",
      500,
    );
  }

  return successResponse(data as CatalogueMedicine[]);
}

/**
 * POST /api/catalogue/medicines
 * Create a new medicine
 * Doctor only
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const forbidden = requireRole(auth, "doctor");
  if (forbidden) return forbidden;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid JSON body", 400);
  }

  const result = createMedicineSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Validation failed",
      422,
      result.error.flatten(),
    );
  }

  const db = createServiceClient();

  const medicineData = {
    ...result.data,
    created_by: auth.userId,
  };

  const { data, error } = await db
    .from("catalogue_medicines")
    .insert(medicineData as never)
    .select()
    .single();

  if (error) {
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to create medicine",
      500,
    );
  }

  return successResponse(data as CatalogueMedicine, undefined, 201);
}
