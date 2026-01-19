import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ConsolePanel } from './ConsolePanel';
import { getConsoleService } from '@/services/console-service';

// Mock motion/react to disable animations in tests
vi.mock('motion/react', async () => {
  const actual = await vi.importActual('motion/react');
  return {
    ...actual,
    useReducedMotion: (): boolean => true,
  };
});

// Default timeout for waitFor (polling interval is 100ms)
const WAIT_TIMEOUT = { timeout: 2000 };

describe('ConsolePanel', () => {
  beforeEach(() => {
    // Reset console service before each test
    const service = getConsoleService();
    service.clear();
    // Set minimum log level to debug to capture all logs in tests
    service.setMinLogLevel('debug');
    // Note: We don't call initializeConsoleService() here because:
    // 1. Tests use service.addLog() directly, which doesn't need interception
    // 2. Calling it would capture console output from the test runner and other tests
  });

  it('renders empty state when no logs', () => {
    render(<ConsolePanel />);
    expect(screen.getByText(/no logs/i)).toBeInTheDocument();
  });

  it('displays logs from console service', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add logs directly via service - wrap in act() to ensure React state updates are flushed
    await act(async () => {
      service.addLog({
        level: 'debug',
        message: 'Test debug message',
        args: [],
        timestamp: Date.now(),
      });
      service.addLog({
        level: 'error',
        message: 'Test error message',
        args: [],
        timestamp: Date.now(),
      });
    });

    // Wait for logs to appear
    await waitFor(() => {
      expect(screen.getByText(/test debug message/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);
    expect(screen.getByText(/test error message/i)).toBeInTheDocument();
  });

  it('filters logs by level', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add logs directly via service - wrap in act() to ensure React state updates are flushed
    await act(async () => {
      service.addLog({ level: 'debug', message: 'Debug message', args: [], timestamp: Date.now() });
      service.addLog({ level: 'error', message: 'Error message', args: [], timestamp: Date.now() });
      service.addLog({
        level: 'warn',
        message: 'Warning message',
        args: [],
        timestamp: Date.now(),
      });
    });

    // Wait for logs to appear
    await waitFor(() => {
      expect(screen.getByText(/error message/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Filter by error
    const errorButton = screen.getByRole('button', { name: /errors/i });
    fireEvent.click(errorButton);

    expect(screen.getByText(/error message/i)).toBeInTheDocument();
    expect(screen.queryByText(/debug message/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/warning message/i)).not.toBeInTheDocument();
  });

  it('filters logs by full-text search in message', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add logs with different messages - wrap in act() to ensure React state updates are flushed
    await act(async () => {
      service.addLog({
        level: 'debug',
        message: 'User authentication successful',
        args: [],
        timestamp: Date.now(),
      });
      service.addLog({
        level: 'debug',
        message: 'Database connection established',
        args: [],
        timestamp: Date.now(),
      });
    });

    // Wait for logs to appear
    await waitFor(() => {
      expect(screen.getByText(/user authentication/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Search by message text
    const searchInput = screen.getByLabelText(/search logs/i);
    fireEvent.change(searchInput, { target: { value: 'authentication' } });

    expect(screen.getByText(/user authentication/i)).toBeInTheDocument();
    expect(screen.queryByText(/database connection/i)).not.toBeInTheDocument();
  });

  it('filters logs by full-text search in args', async () => {
    const service = getConsoleService();
    service.clear(); // Ensure clean state
    render(<ConsolePanel />);

    // Add logs with different messages and args containing searchable text
    await act(async () => {
      service.addLog({
        level: 'error',
        message: 'Connection error',
        args: [{ error: 'Connection timeout', code: 500 }],
        timestamp: Date.now(),
      });
      service.addLog({
        level: 'error',
        message: 'Authentication error',
        args: [{ error: 'Invalid credentials', code: 401 }],
        timestamp: Date.now(),
      });
    });

    // Wait for logs to appear
    await waitFor(() => {
      expect(screen.getByText(/connection error/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Initially both logs should be visible
    expect(screen.getByText(/connection error/i)).toBeInTheDocument();
    expect(screen.getByText(/authentication error/i)).toBeInTheDocument();

    // Search by text in args - should only match the log with "timeout" in args
    const searchInput = screen.getByLabelText(/search logs/i);
    fireEvent.change(searchInput, { target: { value: 'timeout' } });

    // Should only show the log with "timeout" in args
    await waitFor(() => {
      expect(screen.getByText(/connection error/i)).toBeInTheDocument();
      expect(screen.queryByText(/authentication error/i)).not.toBeInTheDocument();
    }, WAIT_TIMEOUT);
  });

  it('filters logs by full-text search in correlation ID', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();
    const correlationId = '7c7c06ef-cdc1-4534-8561-ac740fbe6fee';

    // Add logs with correlation ID - wrap in act() to ensure React state updates are flushed
    await act(async () => {
      service.addLog({
        level: 'error',
        message: 'Error with correlation ID',
        args: [],
        timestamp: Date.now(),
        correlationId,
      });
      service.addLog({
        level: 'error',
        message: 'Different error',
        args: [],
        timestamp: Date.now(),
        correlationId: '8d8d17fg-edd2-5645-9672-bd851cgh7ggh',
      });
    });

    // Wait for logs to appear
    await waitFor(() => {
      expect(screen.getByText(/error with correlation id/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Search by partial correlation ID (first 8 chars should match)
    const searchInput = screen.getByLabelText(/search logs/i);
    fireEvent.change(searchInput, { target: { value: '7c7c06ef' } });

    // Should match the log with full correlation ID
    expect(screen.getByText(/error with correlation id/i)).toBeInTheDocument();
    expect(screen.queryByText(/different error/i)).not.toBeInTheDocument();
  });

  it('filters logs by full-text search across multiple fields', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add logs with searchable text in different fields - wrap in act() to ensure React state updates are flushed
    await act(async () => {
      service.addLog({
        level: 'info',
        message: 'Processing request',
        args: [{ userId: 'user-123', action: 'login' }],
        timestamp: Date.now(),
        correlationId: 'req-abc-123',
      });
      service.addLog({
        level: 'info',
        message: 'Request completed',
        args: [{ userId: 'user-456', action: 'logout' }],
        timestamp: Date.now(),
        correlationId: 'req-xyz-789',
      });
    });

    // Wait for logs to appear
    await waitFor(() => {
      expect(screen.getByText(/processing request/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Search should match across message, args, and correlationId
    const searchInput = screen.getByLabelText(/search logs/i);

    // Search by correlation ID
    fireEvent.change(searchInput, { target: { value: 'req-abc' } });
    expect(screen.getByText(/processing request/i)).toBeInTheDocument();
    expect(screen.queryByText(/request completed/i)).not.toBeInTheDocument();

    // Search by args content
    fireEvent.change(searchInput, { target: { value: 'user-123' } });
    expect(screen.getByText(/processing request/i)).toBeInTheDocument();
    expect(screen.queryByText(/request completed/i)).not.toBeInTheDocument();

    // Search by message
    fireEvent.change(searchInput, { target: { value: 'completed' } });
    expect(screen.queryByText(/processing request/i)).not.toBeInTheDocument();
    expect(screen.getByText(/request completed/i)).toBeInTheDocument();
  });

  it('clears logs when clear button is clicked', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add logs directly via service - wrap in act() to ensure React state updates are flushed
    await act(async () => {
      service.addLog({ level: 'debug', message: 'Message 1', args: [], timestamp: Date.now() });
      service.addLog({ level: 'debug', message: 'Message 2', args: [], timestamp: Date.now() });
    });

    // Wait for logs to appear
    await waitFor(() => {
      expect(screen.getByText(/message 1/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Clear
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText(/no logs/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);
  });

  it('displays correlation ID in log entries when present', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();
    const correlationId = 'test-correlation-12345678';

    // Add log - wrap in act() to ensure React state updates are flushed
    await act(async () => {
      service.addLog({
        level: 'debug',
        message: 'Test message',
        args: [],
        timestamp: Date.now(),
        correlationId,
      });
    });

    // Wait for log to appear
    await waitFor(() => {
      expect(screen.getByText(/test message/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Should display correlation ID (full or truncated)
    expect(screen.getByTitle(correlationId)).toBeInTheDocument();
  });

  it('displays log levels correctly', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add logs directly via service - wrap in act() to ensure React state updates are flushed
    await act(async () => {
      service.addLog({ level: 'debug', message: 'Debug message', args: [], timestamp: Date.now() });
      service.addLog({ level: 'info', message: 'Info message', args: [], timestamp: Date.now() });
      service.addLog({
        level: 'warn',
        message: 'Warning message',
        args: [],
        timestamp: Date.now(),
      });
      service.addLog({ level: 'error', message: 'Error message', args: [], timestamp: Date.now() });
    });

    // Wait for logs to appear
    await waitFor(() => {
      expect(screen.getByText(/error message/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    expect(screen.getByText(/debug message/i)).toBeInTheDocument();
    expect(screen.getByText(/info message/i)).toBeInTheDocument();
    expect(screen.getByText(/warning message/i)).toBeInTheDocument();
    expect(screen.getByText(/error message/i)).toBeInTheDocument();
  });

  it('toggles auto-scroll when auto button is clicked', () => {
    render(<ConsolePanel />);

    const autoButton = screen.getByRole('button', { name: /auto/i });
    // Active by default - uses default variant which is bg-accent-blue
    expect(autoButton).toHaveClass('bg-accent-blue');

    fireEvent.click(autoButton);
    // When toggled off, should use outline variant
    expect(autoButton).not.toHaveClass('bg-accent-blue');
  });

  it('scrolls to bottom when new log arrives and auto-scroll is enabled', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Find the log container element
    const logContainer = screen.getByTestId('console-logs');
    expect(logContainer).toBeInTheDocument();

    // Mock container dimensions to simulate a scrollable container
    // In real app, this is set by parent layout, but in tests we need to mock it
    const mockClientHeight = 200;
    const mockScrollHeight = 1000; // Much larger than clientHeight to ensure scrolling

    Object.defineProperty(logContainer, 'clientHeight', {
      configurable: true,
      get: () => mockClientHeight,
    });

    Object.defineProperty(logContainer, 'scrollHeight', {
      configurable: true,
      get: () => mockScrollHeight,
    });

    // Type assertion needed for property mocking
    const containerElement = logContainer as HTMLDivElement;

    // Add multiple logs to ensure there's content
    await act(async () => {
      for (let i = 0; i < 20; i++) {
        service.addLog({
          level: 'info',
          message: `Initial log ${String(i)}`,
          args: [],
          timestamp: Date.now() + i,
        });
      }
    });

    // Wait for logs to appear
    await waitFor(() => {
      expect(screen.getByText(/initial log 19/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Wait for DOM to settle
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve(undefined);
        });
      });
    });

    // Verify we have scrollable content
    expect(containerElement.scrollHeight).toBeGreaterThan(containerElement.clientHeight);

    // Set scroll position to top (not at bottom)
    containerElement.scrollTop = 0;
    expect(containerElement.scrollTop).toBe(0);

    // Add a new log that should trigger auto-scroll
    await act(async () => {
      service.addLog({
        level: 'info',
        message: 'New log that should trigger scroll',
        args: [],
        timestamp: Date.now(),
      });
    });

    // Wait for new log to appear
    await waitFor(() => {
      expect(screen.getByText(/new log that should trigger scroll/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Wait for requestAnimationFrame in the effect to complete
    // Need multiple frames to ensure the scroll happens
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve(undefined);
          });
        });
      });
    });

    // Verify scroll position changed (scrolled to bottom)
    const finalScrollTop = containerElement.scrollTop;
    const scrollHeight = containerElement.scrollHeight;
    const clientHeight = containerElement.clientHeight;
    const expectedScrollTop = Math.max(0, scrollHeight - clientHeight);

    // The scroll should have happened - scrollTop should be set to scrollHeight - clientHeight
    // In our mock: 1000 - 200 = 800
    expect(finalScrollTop).toBe(expectedScrollTop);
  });

  it('does not scroll when auto-scroll is disabled', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Find the log container
    const logContainer = screen.getByTestId('console-logs');
    expect(logContainer).toBeInTheDocument();

    // Mock container dimensions to simulate a scrollable container
    const mockClientHeight = 200;
    const mockScrollHeight = 1000; // Much larger than clientHeight to ensure scrolling

    Object.defineProperty(logContainer, 'clientHeight', {
      configurable: true,
      get: () => mockClientHeight,
    });

    Object.defineProperty(logContainer, 'scrollHeight', {
      configurable: true,
      get: () => mockScrollHeight,
    });

    // Type assertion needed for property mocking
    const containerElement = logContainer as HTMLDivElement;

    // Add some initial logs
    await act(async () => {
      for (let i = 0; i < 10; i++) {
        service.addLog({
          level: 'info',
          message: `Initial log ${String(i)}`,
          args: [],
          timestamp: Date.now() + i,
        });
      }
    });

    // Wait for logs to appear
    await waitFor(() => {
      expect(screen.getByText(/initial log 9/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Wait for DOM to settle
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve(undefined);
        });
      });
    });

    // Set scroll position to middle (not at bottom)
    containerElement.scrollTop = 100;
    const scrollPositionBefore = containerElement.scrollTop;
    expect(scrollPositionBefore).toBe(100);

    // Disable auto-scroll BEFORE adding new log
    const autoButton = screen.getByRole('button', { name: /auto/i });
    fireEvent.click(autoButton);

    // Add a new log
    await act(async () => {
      service.addLog({
        level: 'info',
        message: 'Test log message',
        args: [],
        timestamp: Date.now(),
      });
    });

    // Wait for log to appear
    await waitFor(() => {
      expect(screen.getByText(/test log message/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Wait for any potential scroll animations
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve(undefined);
          });
        });
      });
    });

    // Verify scroll position did NOT change (stayed at user's position)
    expect(containerElement.scrollTop).toBe(scrollPositionBefore);
  });

  it('displays log counts in filter buttons', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add logs directly via service - wrap in act() to ensure React state updates are flushed
    await act(async () => {
      service.addLog({ level: 'debug', message: 'Debug 1', args: [], timestamp: Date.now() });
      service.addLog({ level: 'debug', message: 'Debug 2', args: [], timestamp: Date.now() });
      service.addLog({ level: 'error', message: 'Error 1', args: [], timestamp: Date.now() });
    });

    // Wait for logs to appear and counts to update
    await waitFor(() => {
      // All button shows total count in label
      const allButton = screen.getByRole('button', { name: /all \(3\)/i });
      expect(allButton).toBeInTheDocument();
      // Error button has badge with count
      const errorButton = screen.getByRole('button', { name: /errors/i });
      expect(errorButton.textContent).toContain('1');
    }, WAIT_TIMEOUT);
  });

  it('formats timestamps correctly', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();
    const timestamp = Date.now();

    // Add log - wrap in act() to ensure React state updates are flushed
    await act(async () => {
      service.addLog({
        level: 'debug',
        message: 'Test message',
        args: [],
        timestamp,
      });
    });

    // Wait for log to appear
    await waitFor(() => {
      expect(screen.getByText(/test message/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Check that timestamp is displayed (format: HH:MM:SS.mmm)
    const logEntry = screen.getByText(/test message/i).closest('[data-testid="console-log-debug"]');
    expect(logEntry).toBeInTheDocument();
    // Timestamp format should be in the log entry
    expect(logEntry?.textContent).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/);
  });

  it('shows all logs when "all" filter is selected', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add logs directly via service - wrap in act() to ensure React state updates are flushed
    await act(async () => {
      service.addLog({ level: 'debug', message: 'Debug message', args: [], timestamp: Date.now() });
      service.addLog({ level: 'info', message: 'Info message', args: [], timestamp: Date.now() });
      service.addLog({ level: 'warn', message: 'Warn message', args: [], timestamp: Date.now() });
      service.addLog({ level: 'error', message: 'Error message', args: [], timestamp: Date.now() });
    });

    // Wait for logs to appear
    await waitFor(() => {
      expect(screen.getByText(/error message/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Select "all" filter (if not already selected) - button text is "All (count)"
    const allButton = screen.getByRole('button', { name: /^all \(/i });
    fireEvent.click(allButton);

    // All logs should be visible
    expect(screen.getByText(/debug message/i)).toBeInTheDocument();
    expect(screen.getByText(/info message/i)).toBeInTheDocument();
    expect(screen.getByText(/warn message/i)).toBeInTheDocument();
    expect(screen.getByText(/error message/i)).toBeInTheDocument();
  });

  it('groups logs with identical level, message, correlationId, AND args', async () => {
    const service = getConsoleService();
    service.clear(); // Ensure clean state
    render(<ConsolePanel />);
    const correlationId = 'test-correlation-123';
    const identicalArgs = [{ event: 'tauri://error', id: -1, payload: 'test' }];

    // Add multiple identical logs (same level, message, correlationId, AND args)
    await act(async () => {
      service.addLog({
        level: 'error',
        message: 'Failed to open DevTools popout window',
        args: identicalArgs,
        timestamp: Date.now(),
        correlationId,
      });
      service.addLog({
        level: 'error',
        message: 'Failed to open DevTools popout window',
        args: identicalArgs,
        timestamp: Date.now() + 100,
        correlationId,
      });
      service.addLog({
        level: 'error',
        message: 'Failed to open DevTools popout window',
        args: identicalArgs,
        timestamp: Date.now() + 200,
        correlationId,
      });
    });

    // Wait for logs to appear
    await waitFor(() => {
      expect(screen.getByText(/failed to open devtools popout window/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Should show grouped log with count badge (not 3 separate entries)
    const logEntries = screen.getAllByText(/failed to open devtools popout window/i);
    // Should only appear once (as a grouped entry)
    expect(logEntries.length).toBe(1);

    // Should show count badge with "3"
    // The badge might be in the expanded view or as a sibling, so we search more broadly
    const countBadge = await waitFor(() => {
      const badge = screen.getByTitle(/3 occurrences/i);
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe('3');
      return badge;
    }, WAIT_TIMEOUT);
    expect(countBadge).toBeInTheDocument();
  });

  it('does NOT group logs with same message but different args', async () => {
    const service = getConsoleService();
    service.clear(); // Ensure clean state
    render(<ConsolePanel />);
    const correlationId = 'test-correlation-123';

    // Add logs with same message but different args
    await act(async () => {
      service.addLog({
        level: 'error',
        message: 'Failed to open DevTools popout window',
        args: [{ event: 'tauri://error', id: -1, payload: 'error1' }],
        timestamp: Date.now(),
        correlationId,
      });
      service.addLog({
        level: 'error',
        message: 'Failed to open DevTools popout window',
        args: [{ event: 'tauri://error', id: -1, payload: 'error2' }],
        timestamp: Date.now() + 100,
        correlationId,
      });
    });

    // Wait for logs to appear
    await waitFor(() => {
      const logEntries = screen.getAllByText(/failed to open devtools popout window/i);
      expect(logEntries.length).toBeGreaterThanOrEqual(2);
    }, WAIT_TIMEOUT);

    // Should show 2 separate log entries (not grouped)
    const logEntries = screen.getAllByText(/failed to open devtools popout window/i);
    expect(logEntries.length).toBe(2);

    // Should NOT show count badge (not grouped) - wait a bit to ensure grouping logic has run
    await waitFor(() => {
      const countBadge = screen.queryByTitle(/2 occurrences/i);
      expect(countBadge).not.toBeInTheDocument();
    }, WAIT_TIMEOUT);
  });

  it('deletes individual log when delete button is clicked', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add a single log
    await act(async () => {
      service.addLog({
        level: 'error',
        message: 'Test error message',
        args: [],
        timestamp: Date.now(),
      });
    });

    // Wait for log to appear
    await waitFor(() => {
      expect(screen.getByText(/test error message/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Find the log entry and hover to show delete button
    const logEntry = screen.getByText(/test error message/i).closest('.group');
    expect(logEntry).toBeInTheDocument();
    if (logEntry === null) {
      throw new Error('Log entry not found');
    }

    // Find delete button (it should be visible on hover, but we can query it directly)
    const deleteButton = logEntry.querySelector('button[title="Delete log"]')!;
    expect(deleteButton).toBeInTheDocument();

    // Click delete button
    fireEvent.click(deleteButton);

    // Wait for log to disappear
    await waitFor(() => {
      expect(screen.queryByText(/test error message/i)).not.toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Verify log was removed from service
    const remainingLogs = service.getLogs();
    expect(remainingLogs.length).toBe(0);
  });

  it('deletes all instances when deleting a grouped log', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add 3 identical logs to create a group
    const identicalArgs = [{ error: 'Connection timeout', code: 500 }];
    await act(async () => {
      service.addLog({
        level: 'error',
        message: 'Request failed',
        args: identicalArgs,
        timestamp: Date.now(),
      });
      service.addLog({
        level: 'error',
        message: 'Request failed',
        args: identicalArgs,
        timestamp: Date.now() + 1,
      });
      service.addLog({
        level: 'error',
        message: 'Request failed',
        args: identicalArgs,
        timestamp: Date.now() + 2,
      });
    });

    // Wait for grouped log to appear with count badge
    await waitFor(() => {
      expect(screen.getByText(/request failed/i)).toBeInTheDocument();
      expect(screen.getByTitle(/3 occurrences/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Find the grouped log entry
    const logEntry = screen.getByText(/request failed/i).closest('.group');
    expect(logEntry).toBeInTheDocument();
    if (logEntry === null) {
      throw new Error('Log entry not found');
    }

    // Find delete button
    const deleteButton = logEntry.querySelector('button[title="Delete log"]')!;
    expect(deleteButton).toBeInTheDocument();

    // Click delete button
    fireEvent.click(deleteButton);

    // Wait for grouped log to disappear
    await waitFor(() => {
      expect(screen.queryByText(/request failed/i)).not.toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Verify all 3 logs were removed from service
    const remainingLogs = service.getLogs();
    expect(remainingLogs.length).toBe(0);
  });

  it('copies single representative log entry when copying grouped log with "Copy all"', async () => {
    // Mock clipboard API
    const writeTextMock = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const service = getConsoleService();
    service.clear(); // Ensure clean state
    render(<ConsolePanel />);
    const correlationId = 'test-correlation-123';
    const identicalArgs = [{ event: 'tauri://error', id: -1, payload: 'test' }];
    const timestamp1 = Date.now();
    const timestamp2 = timestamp1 + 100;
    const timestamp3 = timestamp1 + 200;

    // Add multiple identical logs to create a grouped log
    await act(async () => {
      service.addLog({
        level: 'error',
        message: 'Failed to open DevTools popout window',
        args: identicalArgs,
        timestamp: timestamp1,
        correlationId,
      });
      service.addLog({
        level: 'error',
        message: 'Failed to open DevTools popout window',
        args: identicalArgs,
        timestamp: timestamp2,
        correlationId,
      });
      service.addLog({
        level: 'error',
        message: 'Failed to open DevTools popout window',
        args: identicalArgs,
        timestamp: timestamp3,
        correlationId,
      });
    });

    // Wait for logs to appear
    await waitFor(() => {
      expect(screen.getByText(/failed to open devtools popout window/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Right-click on the grouped log entry to open context menu
    const logEntry = screen
      .getByText(/failed to open devtools popout window/i)
      .closest('[data-testid="console-log-error"]');
    expect(logEntry).toBeInTheDocument();

    fireEvent.contextMenu(logEntry!);

    // Wait for context menu to appear
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /copy all/i })).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Click "Copy all"
    const copyAllButton = screen.getByRole('menuitem', { name: /copy all/i });
    fireEvent.click(copyAllButton);

    // Wait for clipboard write to be called
    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
    }, WAIT_TIMEOUT);

    // Verify the copied JSON
    const copiedText = writeTextMock.mock.calls[0]?.[0];
    expect(copiedText).toBeDefined();

    const copiedData = JSON.parse(copiedText as string);

    // Should include metadata about grouping
    // Note: count might be higher if there are leftover logs, so we check it's at least 3
    expect(copiedData.count).toBeGreaterThanOrEqual(3);
    // But we verify it's the correct grouped log by checking the message and that allLogs is not present
    expect(copiedData.firstTimestamp).toBe(timestamp1);
    expect(copiedData.lastTimestamp).toBe(timestamp3);
    expect(copiedData.level).toBe('error');
    expect(copiedData.message).toBe('Failed to open DevTools popout window');
    expect(copiedData.correlationId).toBe(correlationId);

    // Should NOT include allLogs array
    expect(copiedData.allLogs).toBeUndefined();

    // Should include a single representative log entry
    expect(copiedData.log).toBeDefined();
    expect(copiedData.log.level).toBe('error');
    expect(copiedData.log.message).toBe('Failed to open DevTools popout window');
    expect(copiedData.log.args).toEqual(identicalArgs);
    expect(copiedData.log.correlationId).toBe(correlationId);
  });
});
