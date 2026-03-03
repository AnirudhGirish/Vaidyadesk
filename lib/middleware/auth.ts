import { createAuthClient } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { errorResponse, ErrorCodes } from "@/lib/utils/response";
import type { Profile } from "@/types/database";

export type AuthContext = {
  userId: string;
  profile: Profile;
};

/**
 * Require Authentication
 *
 * Call this at the top of every API route handler.
 * Verifies session and fetches user profile.
 *
 * @returns AuthContext with user info or error Response
 */
export async function requireAuth(): Promise<AuthContext | Response> {
  const auth = await createAuthClient();
  const {
    data: { user },
    error,
  } = await auth.auth.getUser();

  if (error || !user) {
    return errorResponse(
      ErrorCodes.UNAUTHORIZED,
      "Authentication required",
      401,
    );
  }

  const db = createServiceClient();
  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return errorResponse(ErrorCodes.UNAUTHORIZED, "Profile not found", 401);
  }

  return { userId: user.id, profile };
}
