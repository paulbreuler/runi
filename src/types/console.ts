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
  /** If true, this log can be updated in place (for metrics/logs that change over time) */
  isUpdating?: boolean;
}

/**
 * Type guard to check if a log is an updating log.
 *
 * @param log - Console log to check
 * @returns True if log is marked as updating
 */
export function isUpdatingLog(log: ConsoleLog): boolean {
  return log.isUpdating === true;
}
