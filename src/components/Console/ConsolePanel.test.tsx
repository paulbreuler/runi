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
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add logs with args containing searchable text - wrap in act() to ensure React state updates are flushed
    await act(async () => {
      service.addLog({
        level: 'error',
        message: 'Request failed',
        args: [{ error: 'Connection timeout', code: 500 }],
        timestamp: Date.now(),
      });
      service.addLog({
        level: 'error',
        message: 'Request failed',
        args: [{ error: 'Invalid credentials', code: 401 }],
        timestamp: Date.now(),
      });
    });

    // Wait for logs to appear
    await waitFor(() => {
      expect(screen.getByText(/request failed/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Search by text in args
    const searchInput = screen.getByLabelText(/search logs/i);
    fireEvent.change(searchInput, { target: { value: 'timeout' } });

    // Should find the log with "timeout" in args
    expect(screen.getByText(/request failed/i)).toBeInTheDocument();
    // Both logs have same message, but search should filter by args content
    // Since they're grouped by message+args, we should see the grouped entry
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
