import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { requireRole } from "@/lib/middleware/role";
import { createServiceClient } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
} from "@/lib/utils/response";
import { updateMedicineSchema } from "@/lib/validations/catalogue";
import type { CatalogueMedicine } from "@/types/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/catalogue/medicines/[id]
 * Get single medicine
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const db = createServiceClient();

  const { data, error } = await db
    .from("catalogue_medicines")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return errorResponse(ErrorCodes.NOT_FOUND, "Medicine not found", 404);
  }

  return successResponse(data as CatalogueMedicine);
}

/**
 * PUT /api/catalogue/medicines/[id]
 * Update medicine
 * Doctor only
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const forbidden = requireRole(auth, "doctor");
  if (forbidden) return forbidden;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid JSON body", 400);
  }

  const result = updateMedicineSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Validation failed",
      422,
      result.error.flatten(),
    );
  }

  const db = createServiceClient();

  const { data, error } = await db
    .from("catalogue_medicines")
    .update(result.data as never)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return errorResponse(ErrorCodes.NOT_FOUND, "Medicine not found", 404);
  }

  return successResponse(data as CatalogueMedicine);
}
