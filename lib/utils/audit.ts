import { createServiceClient } from "@/lib/supabase/server";
import type { AuthContext } from "@/lib/middleware/auth";
import type { AuditAction } from "@/types/database";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Create an audit log entry
 *
 * Call this for all financial mutations and other important changes.
 * Logs old and new values for tracking.
 */
export async function createAuditLog(
  auth: AuthContext,
  tableName: string,
  recordId: string,
  action: AuditAction,
  oldValues?: Record<string, unknown> | null,
  newValues?: Record<string, unknown> | null,
): Promise<void> {
  const db = createServiceClient();

  // Use type assertion to bypass strict type checking
  // The Database type definition doesn't have proper Insert types
  const { error } = await db.from("audit_logs").insert({
    table_name: tableName,
    record_id: recordId,
    action: action,
    changed_by: auth.userId,
    changed_by_role: auth.profile.role,
    old_values: oldValues ?? null,
    new_values: newValues ?? null,
  } as any);

  if (error) {
    console.error("Failed to create audit log:", error);
  }
}
