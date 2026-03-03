import type { ApiResponse } from "@/types/api";

/**
 * Success Response
 * Returns a standardized success response with optional metadata
 */
export function successResponse<T>(
  data: T,
  meta?: ApiResponse["meta"],
  status = 200,
): Response {
  return Response.json({ success: true, data, meta }, { status });
}

/**
 * Error Response
 * Returns a standardized error response
 */
export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown,
): Response {
  return Response.json(
    { success: false, error: { code, message, details } },
    { status },
  );
}

/**
 * Standard error codes
 */
export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
