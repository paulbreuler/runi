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

  it('filters logs by correlation ID', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();
    const correlationId = 'test-correlation-id-123';

    // Add logs with correlation ID - wrap in act() to ensure React state updates are flushed
    await act(async () => {
      service.addLog({
        level: 'debug',
        message: 'Message 1',
        args: [],
        timestamp: Date.now(),
        correlationId,
      });
      service.addLog({
        level: 'debug',
        message: 'Message 2',
        args: [],
        timestamp: Date.now(),
        correlationId: 'other-correlation-id',
      });
    });

    // Wait for logs to appear
    await waitFor(() => {
      expect(screen.getByText(/message 1/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Filter by correlation ID (exact match)
    const filterInput = screen.getByLabelText(/filter by correlation id/i);
    fireEvent.change(filterInput, { target: { value: correlationId } });

    expect(screen.getByText(/message 1/i)).toBeInTheDocument();
    expect(screen.queryByText(/message 2/i)).not.toBeInTheDocument();
  });

  it('filters logs by correlation ID with partial match', async () => {
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

    // Filter by partial correlation ID (first 8 chars should match)
    const filterInput = screen.getByLabelText(/filter by correlation id/i);
    fireEvent.change(filterInput, { target: { value: '7c7c06ef' } });

    // Should match the log with full correlation ID
    expect(screen.getByText(/error with correlation id/i)).toBeInTheDocument();
    expect(screen.queryByText(/different error/i)).not.toBeInTheDocument();
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
});
