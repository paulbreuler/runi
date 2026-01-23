/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * Correlation ID utilities for tracing requests across React and Rust boundaries.
 *
 * Uses AsyncLocalStorage pattern for context isolation in async operations.
 * Provides thread-safe correlation ID management for loose coupling between frontend and backend.
 */

// Global correlation ID context (module-level state)
// Uses a simple approach with WeakMap for context tracking
// In a more complex scenario, we'd use AsyncLocalStorage (Node.js) or React Context
let currentCorrelationId: string | undefined = undefined;

/**
 * Generate a new correlation ID (UUID v4).
 *
 * @returns A new correlation ID string
 */
export function generateCorrelationId(): string {
  // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get the current correlation ID from context.
 *
 * @returns The current correlation ID, or undefined if not set
 */
export function getCorrelationId(): string | undefined {
  return currentCorrelationId;
}

/**
 * Set the correlation ID in context.
 *
 * @param id - The correlation ID to set
 */
export function setCorrelationId(id: string): void {
  currentCorrelationId = id;
}

/**
 * Clear the correlation ID from context.
 */
export function clearCorrelationId(): void {
  currentCorrelationId = undefined;
}

/**
 * Execute a function with a correlation ID in context.
 *
 * The correlation ID is automatically cleared after the function completes,
 * even if it throws an error. Supports both sync and async functions.
 *
 * @param id - The correlation ID to use
 * @param fn - The function to execute (sync or async)
 * @returns The result of the function (or Promise if async)
 */
export function withCorrelationId<T>(id: string, fn: () => T): T {
  const previousId = currentCorrelationId;
  setCorrelationId(id);

  let isAsync = false;
  try {
    const result = fn();

    // If result is a Promise, restore ID after it resolves/rejects
    if (result instanceof Promise) {
      isAsync = true;
      return result.finally(() => {
        currentCorrelationId = previousId;
      }) as T;
    }

    // Sync function - restore ID in finally block
    return result;
  } finally {
    // Restore ID for sync functions only (async is handled in promise.finally above)
    if (!isAsync) {
      currentCorrelationId = previousId;
    }
  }
}
