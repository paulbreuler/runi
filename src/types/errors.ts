/**
 * Structured error types with correlation IDs for tracing errors across React and Rust boundaries.
 *
 * Enables loose coupling between frontend and backend by providing structured error information
 * that can be traced through the entire request lifecycle.
 */

/**
 * Application error with correlation ID for tracing.
 *
 * Used for errors that propagate between React and Rust,
 * allowing errors to be traced through the entire system.
 */
export interface AppError {
  /** Correlation ID for tracing the error across boundaries */
  correlationId: string;
  /** Error code (e.g., 'HTTP_REQUEST_FAILED', 'INVALID_URL') */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Optional error details (structured data) */
  details?: unknown;
  /** Source of the error (frontend or backend) */
  source: 'frontend' | 'backend';
  /** Timestamp when the error occurred */
  timestamp: number;
}

/**
 * Create a frontend AppError.
 *
 * @param code - Error code
 * @param message - Error message
 * @param correlationId - Optional correlation ID (generated if not provided)
 * @param details - Optional error details
 * @returns AppError instance
 */
export function createFrontendError(
  code: string,
  message: string,
  correlationId?: string,
  details?: unknown
): AppError {
  return {
    correlationId: correlationId ?? generateCorrelationId(),
    code,
    message,
    details,
    source: 'frontend',
    timestamp: Date.now(),
  };
}

/**
 * Convert a backend AppError (from Rust) to frontend AppError.
 *
 * @param backendError - Backend error (from Rust JSON)
 * @returns Frontend AppError instance
 */
export function fromBackendError(backendError: {
  correlation_id: string;
  code: string;
  message: string;
  details?: unknown;
}): AppError {
  return {
    correlationId: backendError.correlation_id,
    code: backendError.code,
    message: backendError.message,
    details: backendError.details,
    source: 'backend',
    timestamp: Date.now(),
  };
}

/**
 * Check if an error is an AppError.
 *
 * @param error - Error to check
 * @returns True if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const err = error as Record<string, unknown>;
  return (
    typeof err.correlationId === 'string' &&
    typeof err.code === 'string' &&
    typeof err.message === 'string' &&
    (err.source === 'frontend' || err.source === 'backend')
  );
}

// Import generateCorrelationId for createFrontendError
import { generateCorrelationId } from '@/utils/correlation-id';
