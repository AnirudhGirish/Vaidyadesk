import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { requireRole } from "@/lib/middleware/role";
import { createServiceClient } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
} from "@/lib/utils/response";

/**
 * POST /api/settings/signature
 * Upload doctor's signature - doctor only
 */
export async function POST(request: NextRequest) {
  // 1. Call requireAuth() and requireRole(auth, 'doctor')
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const forbidden = requireRole(auth, "doctor");
  if (forbidden) return forbidden;

  // 2. Accept a JSON body with a base64 signature string
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid JSON body", 400);
  }

  // Validate body has signature_data
  if (
    !body ||
    typeof body !== "object" ||
    !("signature_data" in body) ||
    typeof body.signature_data !== "string"
  ) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "signature_data is required and must be a string",
      400,
    );
  }

  const signature_data = body.signature_data;

  // 3. Validate it matches /^data:image\/(png|jpeg|jpg|webp);base64,/
  const base64Pattern = /^data:image\/(png|jpeg|jpg|webp);base64,/;
  if (!base64Pattern.test(signature_data)) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Invalid image format. Expected data URI with PNG, JPEG, JPG, or WEBP",
      400,
    );
  }

  // 4. Extract the mime type and base64 data
  const matches = signature_data.match(base64Pattern);
  if (!matches) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Could not parse image data",
      400,
    );
  }

  const mimeType = matches[1]; // e.g., 'png', 'jpeg', 'jpg', 'webp'
  const base64Data = signature_data.split(",")[1];

  if (!base64Data) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Missing base64 data",
      400,
    );
  }

  // 5. Convert to Buffer and check size is under 2MB
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64Data, "base64");
  } catch {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Invalid base64 data",
      400,
    );
  }

  const maxSize = 2 * 1024 * 1024; // 2MB
  if (buffer.length > maxSize) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      "Image size exceeds 2MB limit",
      400,
    );
  }

  const db = createServiceClient();

  // Generate unique filename
  const fileName = `signatures/${auth.userId}/${Date.now()}.${mimeType}`;

  // 6. Upload to Supabase Storage bucket 'signatures' using db.storage.from('signatures').upload() with upsert: true
  const { data: uploadData, error: uploadError } = await db.storage
    .from("signatures")
    .upload(fileName, buffer, {
      contentType: `image/${mimeType}`,
      upsert: true,
    });

  if (uploadError || !uploadData) {
    console.error("Signature upload error:", uploadError);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to upload signature",
      500,
    );
  }

  // 7. Create a signed URL with 10 year expiry using createSignedUrl()
  const tenYearsInSeconds = 10 * 365 * 24 * 60 * 60;
  const { data: signedUrlData, error: signedUrlError } = await db.storage
    .from("signatures")
    .createSignedUrl(fileName, tenYearsInSeconds);

  if (signedUrlError || !signedUrlData) {
    console.error("Signed URL error:", signedUrlError);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to generate signature URL",
      500,
    );
  }

  const signedUrl = signedUrlData.signedUrl;

  // 8. Update profiles table setting signature_url to the signed URL
  const { data: profile, error: updateError } = await db
    .from("profiles")
    .update({ signature_url: signedUrl } as never)
    .eq("id", auth.userId)
    .select()
    .single();

  if (updateError || !profile) {
    console.error("Profile update error:", updateError);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to update profile with signature",
      500,
    );
  }

  // 9. Return successResponse with the signature_url
  return successResponse({
    signature_url: signedUrl,
  });
}
