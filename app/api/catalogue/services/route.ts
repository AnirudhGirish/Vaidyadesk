import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { requireRole } from "@/lib/middleware/role";
import { createServiceClient } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
} from "@/lib/utils/response";
import {
  createServiceSchema,
  updateServiceSchema,
} from "@/lib/validations/catalogue";
import type { CatalogueService } from "@/types/database";

/**
 * GET /api/catalogue/services
 * List all services
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active_only") !== "false";

  const db = createServiceClient();

  let query = db
    .from("catalogue_services")
    .select(
      "id, name, description, category, duration_type, package_days, base_price, gst_applicable, gst_rate, is_active, created_at",
    )
    .order("created_at", { ascending: false });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch services",
      500,
    );
  }

  return successResponse(data as CatalogueService[]);
}

/**
 * POST /api/catalogue/services
 * Create a new service
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

  const result = createServiceSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Validation failed",
      422,
      result.error.flatten(),
    );
  }

  const db = createServiceClient();

  const serviceData = {
    ...result.data,
    created_by: auth.userId,
  };

  const { data, error } = await db
    .from("catalogue_services")
    .insert(serviceData as never)
    .select()
    .single();

  if (error) {
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to create service",
      500,
    );
  }

  return successResponse(data as CatalogueService, undefined, 201);
}
