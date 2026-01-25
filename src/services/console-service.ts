/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * Global console service singleton for capturing and managing console logs.
 *
 * Intercepts console methods before React mounts and stores logs in memory
 * with correlation IDs for tracing errors across React and Rust boundaries.
 *
 * Provides loose coupling between logging and UI components - components
 * subscribe to log events rather than directly accessing logs.
 */

import type { ConsoleLog, LogLevel } from '@/types/console';
import { globalEventBus, type EventType } from '@/events/bus';

/** Map log levels to event types */
const LOG_LEVEL_EVENTS: Record<LogLevel, EventType> = {
  debug: 'console.debug-emitted',
  info: 'console.info-emitted',
  warn: 'console.warn-emitted',
  error: 'console.error-emitted',
};

/** Log level hierarchy for filtering (lower number = more severe/important) */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

/** Check if a log level should be shown based on minimum log level */
function shouldShowLog(logLevel: LogLevel, minLogLevel: LogLevel): boolean {
  // Show logs that are at least as severe as the minimum level
  // e.g., if minLogLevel is 'info' (2), show error (0), warn (1), and info (2), but not debug (3)
  return LOG_LEVEL_PRIORITY[logLevel] <= LOG_LEVEL_PRIORITY[minLogLevel];
}

interface LogFilter {
  correlationId?: string;
  level?: LogLevel;
}

type LogEventHandler = (log: ConsoleLog) => void;

class ConsoleService {
  private logs: ConsoleLog[] = [];
  private maxLogs = 1000;
  private maxSizeBytes = 4 * 1024 * 1024; // 4MB default
  private currentSizeBytes = 0;
  private logIdCounter = 0;
  private subscribers = new Set<LogEventHandler>();
  private minLogLevel: LogLevel = 'info';
  private notificationsSuppressed = false; // For Storybook: prevent notifications during setup
  private originalConsole: {
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
    debug: typeof console.debug;
    info: typeof console.info;
  } | null = null;
  private initialized = false;

  /**
   * Generate unique log ID.
   */
  private generateLogId(): string {
    this.logIdCounter += 1;
    return `log_${String(Date.now())}_${String(this.logIdCounter)}`;
  }

  /**
   * Estimate the size of a log entry in bytes.
   *
   * Uses a fast estimation (may underestimate large objects in args):
   * - message.length * 2 (UTF-16 characters)
   * - args overhead ~100 bytes per arg (rough estimate)
   * - fixed overhead ~50 bytes (id, level, timestamp, etc.)
   *
   * @internal This is an approximation for memory limiting purposes.
   *           For very large objects in args, actual memory usage may be
   *           higher due to JSON serialization overhead.
   */
  private estimateLogSize(log: ConsoleLog): number {
    const messageSize = log.message.length * 2;
    const argsSize = log.args.length * 100;
    const fixedOverhead = 50;
    return messageSize + argsSize + fixedOverhead;
  }

  /**
   * Initialize console service and intercept console methods.
   *
   * Should be called before React mounts to capture all logs.
   */
  public initialize(): void {
    if (this.initialized) {
      return; // Already initialized
    }

    // Store original console methods
    /* eslint-disable no-console -- Required to store references to original console methods */
    this.originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
      info: console.info.bind(console),
    };
    /* eslint-enable no-console */

    // Intercept console methods
    // eslint-disable-next-line no-console -- Intentionally overriding console.log
    console.log = (...args: unknown[]): void => {
      this.originalConsole?.log(...args);
      this.addLog({
        level: 'debug', // Treat log as debug
        message: this.formatMessage(args),
        args,
      });
    };

    console.warn = (...args: unknown[]): void => {
      this.originalConsole?.warn(...args);
      this.addLog({
        level: 'warn',
        message: this.formatMessage(args),
        args,
      });
    };

    console.error = (...args: unknown[]): void => {
      this.originalConsole?.error(...args);
      this.addLog({
        level: 'error',
        message: this.formatMessage(args),
        args,
      });
    };

    // eslint-disable-next-line no-console -- Intentionally overriding console.debug
    console.debug = (...args: unknown[]): void => {
      this.originalConsole?.debug(...args);
      this.addLog({
        level: 'debug',
        message: this.formatMessage(args),
        args,
      });
    };

    // eslint-disable-next-line no-console -- Intentionally overriding console.info
    console.info = (...args: unknown[]): void => {
      this.originalConsole?.info(...args);
      this.addLog({
        level: 'info',
        message: this.formatMessage(args),
        args,
      });
    };

    this.initialized = true;
  }

  /**
   * Format console arguments into a message string.
   */
  private formatMessage(args: unknown[]): string {
    return args
      .map((arg) => {
        if (typeof arg === 'string') {
          return arg;
        }
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      })
      .join(' ');
  }

  /**
   * Set the minimum log level to display.
   *
   * Logs below this level will be filtered out.
   */
  public setMinLogLevel(level: LogLevel): void {
    this.minLogLevel = level;
  }

  /**
   * Get the current minimum log level.
   */
  public getMinLogLevel(): LogLevel {
    return this.minLogLevel;
  }

  /**
   * Add a new log entry or update an existing one if ID matches.
   *
   * If a log with the same `id` already exists and has `isUpdating: true`,
   * the existing log is updated in place. Otherwise, a new log is added.
   *
   * @param log - Log entry with required `id` field
   *
   * @example
   * ```typescript
   * // Create or update memory metrics log
   * service.addOrUpdateLog({
   *   id: 'memory-metrics',
   *   level: 'info',
   *   message: 'Memory Usage',
   *   args: [{ current: 245.5, average: 220.3 }],
   *   isUpdating: true,
   * });
   * ```
   */
  public addOrUpdateLog(log: Partial<ConsoleLog> & { id: string }): void {
    // Check if log with same ID exists and is marked as updating
    const existingIndex = this.logs.findIndex((l) => l.id === log.id);
    if (existingIndex !== -1) {
      const existingLog = this.logs[existingIndex];
      if (existingLog?.isUpdating === true) {
        // Update existing log in place
        const oldSize = existingLog.sizeBytes ?? 0;
        const updatedLog: ConsoleLog = {
          ...existingLog,
          ...log,
          id: log.id, // Ensure ID is preserved
          timestamp: log.timestamp ?? existingLog.timestamp, // Preserve original timestamp or use new one
          isUpdating: log.isUpdating ?? existingLog.isUpdating, // Preserve isUpdating flag
        };

        // Re-estimate size
        const newSize = this.estimateLogSize(updatedLog);
        updatedLog.sizeBytes = newSize;

        // Update size tracking
        this.currentSizeBytes = this.currentSizeBytes - oldSize + newSize;

        // Replace log in array
        this.logs[existingIndex] = updatedLog;

        // Re-apply trimming logic after update (in case log grew and exceeded limits)
        // Trim by count limit
        if (this.logs.length > this.maxLogs) {
          const removed = this.logs.splice(0, this.logs.length - this.maxLogs);
          for (const removedLog of removed) {
            this.currentSizeBytes -= removedLog.sizeBytes ?? 0;
          }
        }

        // Trim by size limit
        while (this.currentSizeBytes > this.maxSizeBytes && this.logs.length > 0) {
          const removed = this.logs.shift();
          if (removed !== undefined) {
            this.currentSizeBytes -= removed.sizeBytes ?? 0;
          }
        }

        // Notify subscribers (unless suppressed for Storybook isolation)
        if (!this.notificationsSuppressed) {
          this.subscribers.forEach((handler) => {
            try {
              handler(updatedLog);
            } catch (error) {
              // Ignore subscriber errors
              this.originalConsole?.error('Console service subscriber error:', error);
            }
          });

          // Emit event via event bus
          globalEventBus.emit(LOG_LEVEL_EVENTS[updatedLog.level], updatedLog);
        }

        return;
      }
    }

    // No existing updating log found - add as new log (with isUpdating flag preserved)
    this.addLog(log);
  }

  /**
   * Add a log entry.
   *
   * Logs are filtered based on the minimum log level setting.
   * Memory is limited by both count (maxLogs) and size (maxSizeBytes).
   */
  public addLog(log: Partial<ConsoleLog>): void {
    const fullLog: ConsoleLog = {
      id: log.id ?? this.generateLogId(),
      level: log.level ?? 'debug',
      message: log.message ?? '',
      args: log.args ?? [],
      timestamp: log.timestamp ?? Date.now(),
      source: log.source,
      correlationId: log.correlationId,
      isUpdating: log.isUpdating,
    };

    // Filter based on minimum log level
    if (!shouldShowLog(fullLog.level, this.minLogLevel)) {
      return;
    }

    // Estimate and store size for this log
    const logSize = this.estimateLogSize(fullLog);
    fullLog.sizeBytes = logSize;

    this.logs.push(fullLog);
    this.currentSizeBytes += logSize;

    // Trim by count limit
    if (this.logs.length > this.maxLogs) {
      const removed = this.logs.splice(0, this.logs.length - this.maxLogs);
      for (const removedLog of removed) {
        this.currentSizeBytes -= removedLog.sizeBytes ?? 0;
      }
    }

    // Trim by size limit
    while (this.currentSizeBytes > this.maxSizeBytes && this.logs.length > 0) {
      const removed = this.logs.shift();
      if (removed !== undefined) {
        this.currentSizeBytes -= removed.sizeBytes ?? 0;
      }
    }

    // Notify subscribers (unless suppressed for Storybook isolation)
    if (!this.notificationsSuppressed) {
      this.subscribers.forEach((handler) => {
        try {
          handler(fullLog);
        } catch (error) {
          // Ignore subscriber errors
          this.originalConsole?.error('Console service subscriber error:', error);
        }
      });

      // Emit event via event bus
      globalEventBus.emit(LOG_LEVEL_EVENTS[fullLog.level], fullLog);
    }
  }

  /**
   * Get logs, optionally filtered.
   */
  public getLogs(filter?: LogFilter): ConsoleLog[] {
    let filtered = this.logs;

    const correlationId = filter?.correlationId;
    if (correlationId !== undefined && correlationId !== '') {
      filtered = filtered.filter((log) => log.correlationId === correlationId);
    }

    const level = filter?.level;
    if (level !== undefined) {
      filtered = filtered.filter((log) => log.level === level);
    }

    return filtered;
  }

  /**
   * Clear all logs.
   */
  public clear(): void {
    this.logs = [];
    this.logIdCounter = 0;
    this.currentSizeBytes = 0;
  }

  /**
   * Suppress notifications (for Storybook isolation).
   * When suppressed, addLog() will not notify subscribers.
   * This prevents cross-story contamination in Storybook.
   */
  public suppressNotifications(): void {
    this.notificationsSuppressed = true;
  }

  /**
   * Re-enable notifications (for Storybook isolation).
   */
  public enableNotifications(): void {
    this.notificationsSuppressed = false;
  }

  /**
   * Delete a specific log by ID.
   */
  public deleteLog(id: string): void {
    const logIndex = this.logs.findIndex((log) => log.id === id);
    if (logIndex !== -1) {
      const removed = this.logs[logIndex];
      if (removed !== undefined) {
        this.currentSizeBytes -= removed.sizeBytes ?? 0;
      }
      this.logs.splice(logIndex, 1);
    }
  }

  /**
   * Set maximum number of logs to keep.
   */
  public setMaxLogs(max: number): void {
    this.maxLogs = max;
    if (this.logs.length > max) {
      const removed = this.logs.splice(0, this.logs.length - max);
      for (const log of removed) {
        this.currentSizeBytes -= log.sizeBytes ?? 0;
      }
    }
  }

  /**
   * Set maximum size in bytes for log storage.
   */
  public setMaxSizeBytes(maxBytes: number): void {
    this.maxSizeBytes = maxBytes;
    // Trim if current size exceeds new limit
    while (this.currentSizeBytes > this.maxSizeBytes && this.logs.length > 0) {
      const removed = this.logs.shift();
      if (removed !== undefined) {
        this.currentSizeBytes -= removed.sizeBytes ?? 0;
      }
    }
  }

  /**
   * Get current total size of logs in bytes.
   */
  public getCurrentSizeBytes(): number {
    return this.currentSizeBytes;
  }

  /**
   * Get maximum size in bytes for log storage.
   */
  public getMaxSizeBytes(): number {
    return this.maxSizeBytes;
  }

  /**
   * Subscribe to log events.
   */
  public subscribe(handler: LogEventHandler): () => void {
    this.subscribers.add(handler);
    return (): void => {
      this.subscribers.delete(handler);
    };
  }

  /**
   * Unsubscribe from log events.
   */
  public unsubscribe(handler: LogEventHandler): void {
    this.subscribers.delete(handler);
  }
}

// Singleton instance
let consoleServiceInstance: ConsoleService | null = null;

/**
 * Get the console service singleton instance.
 */
export function getConsoleService(): ConsoleService {
  consoleServiceInstance ??= new ConsoleService();
  return consoleServiceInstance;
}

/**
 * Initialize the console service.
 *
 * Should be called before React mounts (e.g., in main.tsx).
 */
export function initializeConsoleService(): void {
  const service = getConsoleService();
  service.initialize();
}

// Export types
export type { ConsoleLog, LogLevel } from '@/types/console';
export { ConsoleService };
