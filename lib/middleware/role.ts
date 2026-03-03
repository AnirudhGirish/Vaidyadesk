import { errorResponse, ErrorCodes } from "@/lib/utils/response";
import type { AuthContext } from "./auth";
import type { UserRole } from "@/types/database";

/**
 * Require Role
 *
 * Checks if the authenticated user has the required role.
 * Returns null if authorized, error Response if not.
 *
 * Usage:
 * const forbidden = requireRole(auth, 'doctor')
 * if (forbidden) return forbidden
 */
export function requireRole(
  auth: AuthContext,
  role: UserRole,
): Response | null {
  if (auth.profile.role !== role) {
    return errorResponse(ErrorCodes.FORBIDDEN, "Insufficient permissions", 403);
  }
  return null;
}

/**
 * Require Doctor Role
 *
 * Convenience function for doctor-only routes.
 */
export function requireDoctor(auth: AuthContext): Response | null {
  return requireRole(auth, "doctor");
}

/**
 * Require Frontdesk Role
 *
 * Convenience function for frontdesk-only routes.
 */
export function requireFrontdesk(auth: AuthContext): Response | null {
  return requireRole(auth, "frontdesk");
}
