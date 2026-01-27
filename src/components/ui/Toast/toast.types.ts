/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * Toast variant type - aligns with event bus ToastType.
 */
export type ToastVariant = 'error' | 'warning' | 'info' | 'success';

/**
 * Internal toast data structure stored in the Zustand store.
 */
export interface ToastData {
  /** Unique identifier for the toast */
  id: string;
  /** Toast variant (determines styling) */
  variant: ToastVariant;
  /** Toast message (aligned with event bus field name) */
  message: string;
  /** Optional detailed description (aligned with event bus field name) */
  details?: string;
  /** Optional correlation ID for error tracing */
  correlationId?: string;
  /** Auto-dismiss duration in milliseconds */
  duration?: number;
  /** Optional test ID for testing purposes */
  testId?: string;
  /** Timestamp when toast was created */
  createdAt: number;
  /** Deduplication counter - shows "(xN)" when > 1 */
  count: number;
  /** Timestamp when toast was last updated (for deduplication) */
  lastUpdatedAt: number;
}

/**
 * Options for creating a toast via the public API.
 */
export interface ToastOptions {
  /** Toast message */
  message: string;
  /** Optional detailed description */
  details?: string;
  /** Optional correlation ID for error tracing */
  correlationId?: string;
  /** Auto-dismiss duration in milliseconds (overrides default) */
  duration?: number;
  /** Optional test ID for testing purposes */
  testId?: string;
}

/**
 * Default durations for each toast variant (in milliseconds).
 * Error toasts use Infinity to require manual dismissal.
 */
export const DEFAULT_DURATIONS: Record<ToastVariant, number> = {
  success: 3000,
  info: 4000,
  warning: 5000,
  error: Infinity,
} as const;

/**
 * Deduplication window in milliseconds (5 minutes).
 */
export const DEDUPLICATION_WINDOW_MS = 5 * 60 * 1000;
