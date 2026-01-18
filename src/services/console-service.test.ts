import { describe, expect, it, beforeEach, vi } from 'vitest';
import { initializeConsoleService, getConsoleService, type ConsoleLog } from './console-service';

describe('console-service', () => {
  beforeEach(() => {
    // Reset service state between tests
    const service = getConsoleService();
    service.clear();
    // Set minimum log level to debug to capture all logs in tests
    service.setMinLogLevel('debug');
    // Reset size limits to defaults for test isolation
    service.setMaxLogs(1000);
    service.setMaxSizeBytes(4 * 1024 * 1024); // 4MB
  });

  describe('singleton behavior', () => {
    it('returns the same instance on multiple calls', () => {
      const service1 = getConsoleService();
      const service2 = getConsoleService();
      expect(service1).toBe(service2);
    });

    it('initializes only once', () => {
      initializeConsoleService();
      const originalLog = console.log;
      // Call initialize again - should not re-intercept
      initializeConsoleService();
      expect(console.log).toBe(originalLog);
    });
  });

  describe('log interception', () => {
    it('intercepts console.log calls', () => {
      const service = getConsoleService();
      service.clear();
      initializeConsoleService();

      console.log('Test message');
      const logs = service.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      const lastLog = logs[logs.length - 1];
      expect(lastLog?.message).toContain('Test message');
      expect(lastLog?.level).toBe('debug');
    });

    it('intercepts console.error calls', () => {
      const service = getConsoleService();
      service.clear();
      initializeConsoleService();

      console.error('Error message');
      const logs = service.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      const lastLog = logs[logs.length - 1];
      expect(lastLog?.message).toContain('Error message');
      expect(lastLog?.level).toBe('error');
    });

    it('intercepts console.warn calls', () => {
      const service = getConsoleService();
      service.clear();
      initializeConsoleService();

      console.warn('Warning message');
      const logs = service.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      const lastLog = logs[logs.length - 1];
      expect(lastLog?.message).toContain('Warning message');
      expect(lastLog?.level).toBe('warn');
    });

    it('intercepts console.info calls', () => {
      const service = getConsoleService();
      service.clear();
      initializeConsoleService();

      console.info('Info message');
      const logs = service.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      const lastLog = logs[logs.length - 1];
      expect(lastLog?.message).toContain('Info message');
      expect(lastLog?.level).toBe('info');
    });

    it('intercepts console.debug calls', () => {
      const service = getConsoleService();
      service.clear();
      initializeConsoleService();

      console.debug('Debug message');
      const logs = service.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      const lastLog = logs[logs.length - 1];
      expect(lastLog?.message).toContain('Debug message');
      expect(lastLog?.level).toBe('debug');
    });

    it('still calls original console methods', () => {
      const spy = vi.spyOn(globalThis.console, 'log');
      initializeConsoleService();

      console.log('Test');
      expect(spy).toHaveBeenCalledWith('Test');
      spy.mockRestore();
    });
  });

  describe('log storage', () => {
    it('stores logs with unique IDs', () => {
      const service = getConsoleService();
      service.clear();
      initializeConsoleService();

      console.log('Message 1');
      console.log('Message 2');

      const logs = service.getLogs();
      expect(logs.length).toBeGreaterThanOrEqual(2);
      const ids = new Set(logs.map((log) => log.id));
      expect(ids.size).toBe(logs.length);
    });

    it('includes timestamp in logs', () => {
      const service = getConsoleService();
      service.clear();
      initializeConsoleService();

      const before = Date.now();
      console.log('Test');
      const after = Date.now();

      const logs = service.getLogs();
      const lastLog = logs[logs.length - 1];
      expect(lastLog?.timestamp).toBeGreaterThanOrEqual(before);
      expect(lastLog?.timestamp).toBeLessThanOrEqual(after);
    });

    it('limits log count to maxLogs', () => {
      const service = getConsoleService();
      service.clear();
      service.setMaxLogs(5);
      initializeConsoleService();

      for (let i = 0; i < 10; i++) {
        console.log(`Message ${String(i)}`);
      }

      const logs = service.getLogs();
      expect(logs.length).toBeLessThanOrEqual(5);
    });
  });

  describe('filtering', () => {
    it('filters logs by correlation ID', () => {
      const service = getConsoleService();
      service.clear();
      initializeConsoleService();

      const correlationId = 'test-correlation-id';
      console.log('Message 1');
      // Manually add a log with correlation ID
      const log: ConsoleLog = {
        id: 'test-id',
        level: 'debug',
        message: 'Test message',
        args: [],
        timestamp: Date.now(),
        correlationId,
      };
      service.addLog(log);

      const filtered = service.getLogs({ correlationId });
      expect(filtered.length).toBe(1);
      expect(filtered[0]?.correlationId).toBe(correlationId);
    });

    it('filters logs by level', () => {
      const service = getConsoleService();
      service.clear();
      initializeConsoleService();

      console.log('Debug message');
      console.error('Error message');
      console.warn('Warning message');

      const errorLogs = service.getLogs({ level: 'error' });
      expect(errorLogs.length).toBeGreaterThan(0);
      expect(errorLogs.every((log) => log.level === 'error')).toBe(true);
    });
  });

  describe('clear', () => {
    it('clears all logs', () => {
      const service = getConsoleService();
      service.clear();
      initializeConsoleService();

      console.log('Message 1');
      console.log('Message 2');
      expect(service.getLogs().length).toBeGreaterThanOrEqual(2);

      service.clear();
      expect(service.getLogs().length).toBe(0);
    });
  });

  describe('size-based limiting', () => {
    it('tracks current size in bytes', () => {
      const service = getConsoleService();
      service.clear();
      initializeConsoleService();

      expect(service.getCurrentSizeBytes()).toBe(0);

      console.log('Test message');
      expect(service.getCurrentSizeBytes()).toBeGreaterThan(0);
    });

    it('trims logs when exceeding maxSizeBytes', () => {
      const service = getConsoleService();
      service.clear();
      // Set a very small size limit (500 bytes)
      service.setMaxSizeBytes(500);
      initializeConsoleService();

      // Add many logs to exceed the limit
      for (let i = 0; i < 20; i++) {
        console.log(`This is a relatively long message number ${String(i)} that takes up space`);
      }

      // Should have trimmed to stay under limit
      expect(service.getCurrentSizeBytes()).toBeLessThanOrEqual(500);
      expect(service.getLogs().length).toBeLessThan(20);
    });

    it('updates size when logs are deleted', () => {
      const service = getConsoleService();
      service.clear();
      service.setMaxSizeBytes(1024 * 1024); // 1MB
      initializeConsoleService();

      console.log('Test message');
      const logs = service.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      const logToDelete = logs[0];
      expect(logToDelete).toBeDefined();
      // TypeScript doesn't understand expect().toBeDefined() is a type guard, so use non-null assertion
      // after we've verified it's defined
      const log = logToDelete!;

      const initialSize = service.getCurrentSizeBytes();
      expect(initialSize).toBeGreaterThan(0);

      // Delete the log
      service.deleteLog(log.id);
      expect(service.getCurrentSizeBytes()).toBeLessThan(initialSize);
    });

    it('resets size when cleared', () => {
      const service = getConsoleService();
      service.clear();
      service.setMaxSizeBytes(1024 * 1024); // 1MB
      initializeConsoleService();

      console.log('Test message');
      expect(service.getCurrentSizeBytes()).toBeGreaterThan(0);

      service.clear();
      expect(service.getCurrentSizeBytes()).toBe(0);
    });

    it('trims existing logs when setMaxSizeBytes is called with smaller limit', () => {
      const service = getConsoleService();
      service.clear();
      service.setMaxSizeBytes(1024 * 1024); // 1MB initially
      initializeConsoleService();

      // Add several logs
      for (let i = 0; i < 10; i++) {
        console.log(`Message ${String(i)} with some content`);
      }

      const initialCount = service.getLogs().length;
      const initialSize = service.getCurrentSizeBytes();

      // Verify we have meaningful data before trimming
      expect(initialSize).toBeGreaterThan(100);

      // Set a smaller limit that should trim logs
      service.setMaxSizeBytes(100);

      expect(service.getCurrentSizeBytes()).toBeLessThanOrEqual(100);
      expect(service.getLogs().length).toBeLessThan(initialCount);
    });

    it('stores sizeBytes on each log', () => {
      const service = getConsoleService();
      service.clear();
      service.setMinLogLevel('debug');
      service.setMaxSizeBytes(1024 * 1024); // 1MB to avoid trimming
      initializeConsoleService();

      console.log('Test message');
      const logs = service.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      const lastLog = logs[logs.length - 1];
      expect(lastLog?.sizeBytes).toBeGreaterThan(0);
    });

    it('returns correct maxSizeBytes', () => {
      const service = getConsoleService();
      service.setMaxSizeBytes(2 * 1024 * 1024); // 2MB
      expect(service.getMaxSizeBytes()).toBe(2 * 1024 * 1024);
    });
  });

  describe('event emission', () => {
    it('emits log events when logs are added', () => {
      const service = getConsoleService();
      service.clear();
      initializeConsoleService();

      const handler = vi.fn();
      service.subscribe(handler);

      console.log('Test message');
      expect(handler).toHaveBeenCalled();
    });

    it('allows unsubscribing from events', () => {
      const service = getConsoleService();
      service.clear();
      initializeConsoleService();

      const handler = vi.fn();
      service.subscribe(handler);
      console.log('Message 1');
      expect(handler).toHaveBeenCalledTimes(1);

      service.unsubscribe(handler);
      console.log('Message 2');
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not 2
    });
  });
});
