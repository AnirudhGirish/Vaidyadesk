import { requireAuth } from "@/lib/middleware/auth";
import { successResponse } from "@/lib/utils/response";

/**
 * Get Current Session
 *
 * Returns the current user's session info including role and profile data.
 */
export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  return successResponse({
    userId: auth.userId,
    role: auth.profile.role,
    fullName: auth.profile.full_name,
    email: auth.profile.email,
    signatureUrl: auth.profile.signature_url,
  });
}
