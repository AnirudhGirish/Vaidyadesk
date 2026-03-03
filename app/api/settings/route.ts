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

/**
 * GET /api/settings
 * Get clinic settings (both roles can access)
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const db = createServiceClient();

  const { data: settings, error } = await db
    .from("clinic_settings")
    .select("*")
    .single();

  if (error || !settings) {
    return errorResponse(
      ErrorCodes.NOT_FOUND,
      "Clinic settings not found",
      404,
    );
  }

  // Return safe settings (hide sensitive data if any)
  return successResponse(settings);
}

// Update settings schema - doctor only
const UpdateSettingsSchema = z.object({
  clinic_name: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  gst_number: z.string().optional(),
  logo_url: z.string().optional(),
  default_gst_rate: z.number().min(0).max(28).optional(),
  max_frontdesk_discount: z.number().min(0).max(100).optional(),
  bill_prefix: z.string().min(1).optional(),
  financial_year_start_month: z.number().min(1).max(12).optional(),
});

/**
 * PUT /api/settings
 * Update clinic settings - doctor only
 */
export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  // Only doctor can update settings
  const forbidden = requireRole(auth, "doctor");
  if (forbidden) return forbidden;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid JSON body", 400);
  }

  const result = UpdateSettingsSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Validation failed",
      422,
      result.error.flatten(),
    );
  }

  const db = createServiceClient();

  // Get current settings
  const { data: currentSettings, error: fetchError } = await db
    .from("clinic_settings")
    .select("*")
    .single();

  if (fetchError || !currentSettings) {
    return errorResponse(
      ErrorCodes.NOT_FOUND,
      "Clinic settings not found",
      404,
    );
  }

  const currentData = currentSettings as Record<string, unknown>;

  // Update settings
  const { data: settings, error } = await db
    .from("clinic_settings")
    .update({
      ...result.data,
      updated_by: auth.userId,
    } as never)
    .eq("id", currentData.id as string)
    .select()
    .single();

  if (error || !settings) {
    console.error("Settings update error:", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to update settings",
      500,
    );
  }

  return successResponse(settings);
}
