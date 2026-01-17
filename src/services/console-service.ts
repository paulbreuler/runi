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
  private logIdCounter = 0;
  private subscribers = new Set<LogEventHandler>();
  private minLogLevel: LogLevel = 'info';
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
   * Add a log entry.
   *
   * Logs are filtered based on the minimum log level setting.
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
    };

    // Filter based on minimum log level
    if (!shouldShowLog(fullLog.level, this.minLogLevel)) {
      return;
    }

    this.logs.push(fullLog);

    // Limit log count
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Notify subscribers
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
  }

  /**
   * Delete a specific log by ID.
   */
  public deleteLog(id: string): void {
    this.logs = this.logs.filter((log) => log.id !== id);
  }

  /**
   * Set maximum number of logs to keep.
   */
  public setMaxLogs(max: number): void {
    this.maxLogs = max;
    if (this.logs.length > max) {
      this.logs = this.logs.slice(-max);
    }
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
