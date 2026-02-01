/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

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
 * Minimal crash report payload for frontend failures.
 *
 * Intentionally excludes PII (no user agent, IP, or request content).
 */
export interface FrontendCrashReport {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  pathname: string;
  buildMode: 'dev' | 'release';
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
 * Create a minimal frontend crash report payload.
 */
export function createCrashReport(input: {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp?: string;
  pathname?: string;
  buildMode?: 'dev' | 'release';
}): FrontendCrashReport {
  return {
    message: input.message,
    stack: input.stack,
    componentStack: input.componentStack,
    timestamp: input.timestamp ?? new Date().toISOString(),
    pathname: input.pathname ?? window.location.pathname,
    buildMode: input.buildMode ?? 'release',
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
 * Handles both direct AppError objects and Error objects with nested `appError` property.
 * This allows error handling to work correctly when AppError is wrapped in an Error object.
 *
 * @param error - Error to check
 * @returns True if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const err = error as Record<string, unknown>;

  // Check if AppError properties are directly on the object
  if (
    typeof err.correlationId === 'string' &&
    typeof err.code === 'string' &&
    typeof err.message === 'string' &&
    (err.source === 'frontend' || err.source === 'backend')
  ) {
    return true;
  }

  // Check if AppError is nested in `appError` property (when wrapped in Error object)
  if (err.appError !== undefined && typeof err.appError === 'object' && err.appError !== null) {
    const nested = err.appError as Record<string, unknown>;
    return (
      typeof nested.correlationId === 'string' &&
      typeof nested.code === 'string' &&
      typeof nested.message === 'string' &&
      (nested.source === 'frontend' || nested.source === 'backend')
    );
  }

  return false;
}

// Import generateCorrelationId for createFrontendError
import { generateCorrelationId } from '@/utils/correlation-id';
