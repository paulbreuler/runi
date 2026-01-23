/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * Console types shared between console service and components.
 *
 * Extracted to avoid circular dependencies between service and component layers.
 */

/**
 * Log level for console entries.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Console log entry structure.
 */
export interface ConsoleLog {
  /** Unique log ID */
  id: string;
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Original console arguments */
  args: unknown[];
  /** Timestamp when log was captured */
  timestamp: number;
  /** Optional source identifier (component, module, etc.) */
  source?: string;
  /** Optional correlation ID for tracing */
  correlationId?: string;
  /** Approximate size in bytes (internal use for memory limiting) */
  sizeBytes?: number;
}
