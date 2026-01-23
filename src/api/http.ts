/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * HTTP API wrapper for Tauri commands.
 *
 * All HTTP requests must go through the Rust backend which uses curl
 * for accurate timing information. Direct browser access is not supported.
 *
 * Generates correlation IDs for all requests to enable error tracing
 * across React and Rust boundaries.
 */

import { invoke } from '@tauri-apps/api/core';
import { generateCorrelationId, getCorrelationId, withCorrelationId } from '@/utils/correlation-id';
import { fromBackendError, isAppError, type AppError } from '@/types/errors';
import { getConsoleService } from '@/services/console-service';
import type { HttpResponse, RequestParams } from '@/types/http';

/**
 * Extract error message from various error types.
 * Handles strings, Error objects, and unknown values.
 */
function extractErrorMessage(primary: unknown, fallback: unknown = 'Unknown error'): string {
  if (typeof primary === 'string') {
    return primary;
  }
  if (primary instanceof Error) {
    return primary.message;
  }
  if (typeof fallback === 'string') {
    return fallback;
  }
  if (fallback instanceof Error) {
    return fallback.message;
  }
  return 'Unknown error';
}

/**
 * Check if running in Tauri context
 */
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Execute an HTTP request through the Rust backend.
 *
 * This is a Tauri app - all HTTP requests must go through the Rust backend
 * which uses curl for accurate timing information. The browser fallback has
 * been removed as it cannot provide reliable timing data.
 *
 * Generates a correlation ID for the request and uses it throughout the request lifecycle.
 * Errors from Rust are converted to AppError with correlation IDs for tracing.
 *
 * @param params - The request parameters
 * @returns Promise resolving to the HTTP response
 * @throws AppError if the request fails (includes correlation ID for tracing)
 */
export async function executeRequest(params: RequestParams): Promise<HttpResponse> {
  // Generate correlation ID for this request (or use existing one from context)
  const correlationId = getCorrelationId() ?? generateCorrelationId();
  const isTauriEnv = isTauri();
  const consoleService = getConsoleService();

  // This is a Tauri app - we must use the backend for accurate timing
  if (!isTauriEnv) {
    const error: AppError = {
      correlationId,
      code: 'TAURI_NOT_AVAILABLE',
      message:
        'Tauri backend is not available. Please run the app using "just dev" or "npm run tauri dev" to access the Tauri window. Direct browser access (http://localhost:5173) is not supported.',
      source: 'frontend',
      timestamp: Date.now(),
    };

    consoleService.addLog({
      level: 'error',
      message: error.message,
      args: [error],
      correlationId: error.correlationId,
    });

    // Convert AppError to Error for throwing (ESLint requires Error objects)
    const errorObj = new Error(error.message);
    (errorObj as Error & { appError: AppError }).appError = error;
    throw errorObj;
  }

  return withCorrelationId(correlationId, async () => {
    try {
      const result = await invoke<HttpResponse>('execute_request', {
        params,
        correlation_id: correlationId,
      });
      return result;
    } catch (error) {
      // Convert Rust AppError to frontend AppError
      // Tauri serializes AppError, so it might be a string (JSON) or an object
      let appError: AppError;

      // Check if it's already an AppError
      if (isAppError(error)) {
        appError = error;
      } else if (typeof error === 'string') {
        // Try to parse JSON string
        try {
          const parsed = JSON.parse(error) as {
            correlation_id?: string;
            code?: string;
            message?: string;
            details?: unknown;
          };
          if (typeof parsed.correlation_id === 'string' && parsed.correlation_id.length > 0) {
            appError = fromBackendError({
              correlation_id: parsed.correlation_id,
              code: typeof parsed.code === 'string' ? parsed.code : 'UNKNOWN_ERROR',
              message: extractErrorMessage(parsed.message, error),
              details: parsed.details,
            });
          } else {
            throw new Error('Not a valid AppError JSON');
          }
        } catch (parseError: unknown) {
          // Not JSON or not AppError - fallback
          const errorMessage = extractErrorMessage(parseError, error);
          appError = {
            correlationId,
            code: 'HTTP_REQUEST_FAILED',
            message: errorMessage,
            source: 'backend',
            timestamp: Date.now(),
          };
        }
      } else if (typeof error === 'object' && error !== null) {
        // Try to parse as backend error object (snake_case)
        const err = error as Record<string, unknown>;
        if (typeof err.correlation_id === 'string') {
          appError = fromBackendError({
            correlation_id: err.correlation_id,
            code: typeof err.code === 'string' ? err.code : 'UNKNOWN_ERROR',
            message: extractErrorMessage(err.message, error),
            details: err.details,
          });
        } else {
          // Fallback: create frontend error with correlation ID
          const errorMessage = extractErrorMessage(error);
          appError = {
            correlationId,
            code: 'HTTP_REQUEST_FAILED',
            message: errorMessage,
            source: 'backend',
            timestamp: Date.now(),
          };
        }
      } else {
        // Fallback: create frontend error with correlation ID
        const errorMessage = extractErrorMessage(error);
        appError = {
          correlationId,
          code: 'HTTP_REQUEST_FAILED',
          message: errorMessage,
          source: 'backend',
          timestamp: Date.now(),
        };
      }

      // Log error to console service with correlation ID
      consoleService.addLog({
        level: 'error',
        message: `[${appError.code}] ${appError.message}`,
        args: [error],
        correlationId: appError.correlationId,
      });
      console.error('[HTTP Request Error]', appError);

      // Convert AppError to Error for throwing (ESLint requires Error objects)
      const errorObj = new Error(appError.message);
      (errorObj as Error & { appError: AppError }).appError = appError;
      throw errorObj;
    }
  });
}
