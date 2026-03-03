import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { requireRole } from "@/lib/middleware/role";
import { createServiceClient } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
} from "@/lib/utils/response";
import { updateServiceSchema } from "@/lib/validations/catalogue";
import type { CatalogueService } from "@/types/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/catalogue/services/[id]
 * Get single service
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const db = createServiceClient();

  const { data, error } = await db
    .from("catalogue_services")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return errorResponse(ErrorCodes.NOT_FOUND, "Service not found", 404);
  }

  return successResponse(data as CatalogueService);
}

/**
 * PUT /api/catalogue/services/[id]
 * Update service
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

  const result = updateServiceSchema.safeParse(body);
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
    .from("catalogue_services")
    .update(result.data as never)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return errorResponse(ErrorCodes.NOT_FOUND, "Service not found", 404);
  }

  return successResponse(data as CatalogueService);
}

/**
 * DELETE /api/catalogue/services/[id]
 * Soft delete service (set is_active to false)
 * Doctor only
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const forbidden = requireRole(auth, "doctor");
  if (forbidden) return forbidden;

  const { id } = await params;
  const db = createServiceClient();

  const { data, error } = await db
    .from("catalogue_services")
    .update({ is_active: false } as never)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return errorResponse(ErrorCodes.NOT_FOUND, "Service not found", 404);
  }

  return successResponse({ message: "Service deactivated successfully" });
}
