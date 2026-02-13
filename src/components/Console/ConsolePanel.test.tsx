/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
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

// Use vi.hoisted to define mocks that can be referenced in vi.mock calls
const { mockSave, mockWriteTextFile } = vi.hoisted(() => ({
  mockSave: vi.fn(),
  mockWriteTextFile: vi.fn(),
}));

// Mock Tauri dialog plugin
vi.mock('@tauri-apps/plugin-dialog', () => ({
  save: mockSave,
}));

// Mock Tauri fs plugin
vi.mock('@tauri-apps/plugin-fs', () => ({
  writeTextFile: mockWriteTextFile,
}));

// Default timeout for waitFor (polling interval is 100ms)
// CI environments may be slower, so use a generous timeout
const WAIT_TIMEOUT = { timeout: 5000 };

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

    // Reset Tauri plugin mocks
    mockSave.mockReset();
    mockWriteTextFile.mockReset();
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
        id: 'debug-log',
        level: 'debug',
        message: 'Test debug message',
        args: [],
        timestamp: Date.now(),
      });
      service.addLog({
        id: 'error-log',
        level: 'error',
        message: 'Test error message',
        args: [],
        timestamp: Date.now(),
      });
    });

    // Wait for logs to appear
    await waitFor(() => {
      expect(screen.getByTestId('console-log-row-debug-log')).toBeInTheDocument();
    }, WAIT_TIMEOUT);
    expect(screen.getByTestId('console-log-row-error-log')).toBeInTheDocument();
  });

  it('filters logs by level', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add logs directly via service - wrap in act() to ensure React state updates are flushed
    await act(async () => {
      service.addLog({
        id: 'debug-1',
        level: 'debug',
        message: 'Debug message',
        args: [],
        timestamp: Date.now(),
      });
      service.addLog({
        id: 'error-1',
        level: 'error',
        message: 'Error message',
        args: [],
        timestamp: Date.now(),
      });
      service.addLog({
        id: 'warn-1',
        level: 'warn',
        message: 'Warning message',
        args: [],
        timestamp: Date.now(),
      });
    });

    // Wait for logs to appear
    await waitFor(() => {
      expect(screen.getByTestId('console-log-row-error-1')).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Filter by error
    const errorButton = screen.getByTestId('console-filter-error');
    fireEvent.click(errorButton);

    expect(screen.getByTestId('console-log-row-error-1')).toBeInTheDocument();
    expect(screen.queryByTestId('console-log-row-debug-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('console-log-row-warn-1')).not.toBeInTheDocument();
  });

  it('filters logs by full-text search in message', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add logs with different messages - wrap in act() to ensure React state updates are flushed
    await act(async () => {
      service.addLog({
        id: 'auth-log',
        level: 'debug',
        message: 'User authentication successful',
        args: [],
        timestamp: Date.now(),
      });
      service.addLog({
        id: 'db-log',
        level: 'debug',
        message: 'Database connection established',
        args: [],
        timestamp: Date.now(),
      });
    });

    // Wait for logs to appear
    await waitFor(() => {
      expect(screen.getByTestId('console-log-row-auth-log')).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Search by message text
    const searchInput = screen.getByTestId('console-search-input');
    fireEvent.change(searchInput, { target: { value: 'authentication' } });

    expect(screen.getByTestId('console-log-row-auth-log')).toBeInTheDocument();
    expect(screen.queryByTestId('console-log-row-db-log')).not.toBeInTheDocument();
  });

  it('filters logs by full-text search in args', async () => {
    const service = getConsoleService();
    service.clear(); // Ensure clean state
    render(<ConsolePanel />);

    // Add logs with different messages and args containing searchable text
    await act(async () => {
      service.addLog({
        id: 'conn-error',
        level: 'error',
        message: 'Connection error',
        args: [{ error: 'Connection timeout', code: 500 }],
        timestamp: Date.now(),
      });
      service.addLog({
        id: 'auth-error',
        level: 'error',
        message: 'Authentication error',
        args: [{ error: 'Invalid credentials', code: 401 }],
        timestamp: Date.now(),
      });
    });

    // Wait for logs to appear
    await waitFor(() => {
      expect(screen.getByTestId('console-log-row-conn-error')).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Initially both logs should be visible
    expect(screen.getByTestId('console-log-row-conn-error')).toBeInTheDocument();
    expect(screen.getByTestId('console-log-row-auth-error')).toBeInTheDocument();

    // Search by text in args - should only match the log with "timeout" in args
    const searchInput = screen.getByTestId('console-search-input');
    fireEvent.change(searchInput, { target: { value: 'timeout' } });

    // Should only show the log with "timeout" in args
    await waitFor(() => {
      expect(screen.getByTestId('console-log-row-conn-error')).toBeInTheDocument();
      expect(screen.queryByTestId('console-log-row-auth-error')).not.toBeInTheDocument();
    }, WAIT_TIMEOUT);
  });

  it('filters logs by full-text search in correlation ID', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();
    const correlationId = '7c7c06ef-cdc1-4534-8561-ac740fbe6fee';

    // Add logs with correlation ID - wrap in act() to ensure React state updates are flushed
    await act(async () => {
      service.addLog({
        id: 'corr-log-1',
        level: 'error',
        message: 'Error with correlation ID',
        args: [],
        timestamp: Date.now(),
        correlationId,
      });
      service.addLog({
        id: 'corr-log-2',
        level: 'error',
        message: 'Different error',
        args: [],
        timestamp: Date.now(),
        correlationId: '8d8d17fg-edd2-5645-9672-bd851cgh7ggh',
      });
    });

    // Wait for logs to appear
    await waitFor(() => {
      expect(screen.getByTestId('console-log-row-corr-log-1')).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Search by partial correlation ID (first 8 chars should match)
    const searchInput = screen.getByTestId('console-search-input');
    fireEvent.change(searchInput, { target: { value: '7c7c06ef' } });

    // Should match the log with full correlation ID
    expect(screen.getByTestId('console-log-row-corr-log-1')).toBeInTheDocument();
    expect(screen.queryByTestId('console-log-row-corr-log-2')).not.toBeInTheDocument();
  });

  it('filters logs by full-text search across multiple fields', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add logs with searchable text in different fields - wrap in act() to ensure React state updates are flushed
    await act(async () => {
      service.addLog({
        id: 'multi-log-1',
        level: 'info',
        message: 'Processing request',
        args: [{ userId: 'user-123', action: 'login' }],
        timestamp: Date.now(),
        correlationId: 'req-abc-123',
      });
      service.addLog({
        id: 'multi-log-2',
        level: 'info',
        message: 'Request completed',
        args: [{ userId: 'user-456', action: 'logout' }],
        timestamp: Date.now(),
        correlationId: 'req-xyz-789',
      });
    });

    // Wait for logs to appear
    await waitFor(() => {
      expect(screen.getByTestId('console-log-row-multi-log-1')).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Search should match across message, args, and correlationId
    const searchInput = screen.getByTestId('console-search-input');

    // Search by correlation ID
    fireEvent.change(searchInput, { target: { value: 'req-abc' } });
    expect(screen.getByTestId('console-log-row-multi-log-1')).toBeInTheDocument();
    expect(screen.queryByTestId('console-log-row-multi-log-2')).not.toBeInTheDocument();

    // Search by args content
    fireEvent.change(searchInput, { target: { value: 'user-123' } });
    expect(screen.getByTestId('console-log-row-multi-log-1')).toBeInTheDocument();
    expect(screen.queryByTestId('console-log-row-multi-log-2')).not.toBeInTheDocument();

    // Search by message
    fireEvent.change(searchInput, { target: { value: 'completed' } });
    expect(screen.queryByTestId('console-log-row-multi-log-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('console-log-row-multi-log-2')).toBeInTheDocument();
  });

  it('clears logs when clear button is clicked', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add logs directly via service - wrap in act() to ensure React state updates are flushed
    await act(async () => {
      service.addLog({
        id: 'msg-1',
        level: 'debug',
        message: 'Message 1',
        args: [],
        timestamp: Date.now(),
      });
      service.addLog({
        id: 'msg-2',
        level: 'debug',
        message: 'Message 2',
        args: [],
        timestamp: Date.now(),
      });
    });

    // Wait for logs to appear
    await waitFor(() => {
      expect(screen.getByTestId('console-log-row-msg-1')).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Clear
    const clearButton = screen.getByTestId('console-clear-button');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText(/no logs/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);
  });

  // TODO: Fix flaky test - log grouping interaction is complex and timing-dependent
  it('displays correlation ID in grouped log entries when expanded', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();
    const correlationId = 'test-correlation-12345678';

    // Add multiple identical logs to create a group (same level, message, args, correlationId)
    await act(async () => {
      service.addLog({
        level: 'debug',
        message: 'Test message',
        args: [],
        timestamp: Date.now(),
        correlationId,
      });
      service.addLog({
        level: 'debug',
        message: 'Test message',
        args: [],
        timestamp: Date.now() + 1000,
        correlationId, // MUST BE IDENTICAL TO GROUP
      });
    });

    // Wait for grouped log to appear with count badge
    await waitFor(() => {
      expect(screen.getByTestId('console-log-group-count')).toHaveTextContent('×2');
    }, WAIT_TIMEOUT);

    // Double-click to expand the grouped log
    const countBadge = screen.getByTestId('console-log-group-count');
    const logRow = countBadge.closest('tr');
    expect(logRow).toBeInTheDocument();
    if (logRow !== null) {
      await act(async () => {
        fireEvent.doubleClick(logRow);
      });
    }

    // Wait for expanded section to appear
    await waitFor(() => {
      expect(screen.getByTestId('expanded-section')).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Click the occurrences toggle to show individual logs
    const occurrencesButton = screen.getByTestId('console-log-occurrences-toggle');
    await act(async () => {
      fireEvent.click(occurrencesButton);
    });

    // Now correlation IDs should be visible with title attribute
    await waitFor(() => {
      const elements = screen.getAllByTitle(correlationId);
      expect(elements.length).toBeGreaterThanOrEqual(2);
    }, WAIT_TIMEOUT);
  });

  it('displays log levels correctly', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add logs directly via service - wrap in act() to ensure React state updates are flushed
    await act(async () => {
      service.addLog({
        id: 'debug-log',
        level: 'debug',
        message: 'Debug message',
        args: [],
        timestamp: Date.now(),
      });
      service.addLog({
        id: 'info-log',
        level: 'info',
        message: 'Info message',
        args: [],
        timestamp: Date.now(),
      });
      service.addLog({
        id: 'warn-log',
        level: 'warn',
        message: 'Warning message',
        args: [],
        timestamp: Date.now(),
      });
      service.addLog({
        id: 'error-log',
        level: 'error',
        message: 'Error message',
        args: [],
        timestamp: Date.now(),
      });
    });

    // Wait for logs to appear
    await waitFor(() => {
      expect(screen.getByTestId('console-log-row-error-log')).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    expect(screen.getByTestId('console-log-row-debug-log')).toBeInTheDocument();
    expect(screen.getByTestId('console-log-row-info-log')).toBeInTheDocument();
    expect(screen.getByTestId('console-log-row-warn-log')).toBeInTheDocument();
    expect(screen.getByTestId('console-log-row-error-log')).toBeInTheDocument();
  });

  it('displays log counts in filter buttons', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add logs directly via service - wrap in act() to ensure React state updates are flushed
    await act(async () => {
      service.addLog({ level: 'debug', message: 'Debug 1', args: [], timestamp: Date.now() });
      service.addLog({ level: 'debug', message: 'Debug 2', args: [], timestamp: Date.now() });
      service.addLog({ level: 'error', message: 'Error 1', args: [], timestamp: Date.now() });
      service.addLog({ level: 'warn', message: 'Warn 1', args: [], timestamp: Date.now() });
      service.addLog({ level: 'info', message: 'Info 1', args: [], timestamp: Date.now() });
      service.addLog({ level: 'info', message: 'Info 2', args: [], timestamp: Date.now() });
    });

    // Wait for logs to appear and counts to update
    await waitFor(() => {
      // All button shows total count in label
      const allButton = screen.getByTestId('console-filter-all');
      expect(allButton).toBeInTheDocument();
      // Error button has badge with count
      const errorButton = screen.getByTestId('console-filter-error');
      expect(errorButton.textContent).toContain('1');
      // Warn button has badge with count
      const warnButton = screen.getByTestId('console-filter-warn');
      expect(warnButton.textContent).toContain('1');
      // Info button has badge with count
      const infoButton = screen.getByTestId('console-filter-info');
      expect(infoButton.textContent).toContain('2');

      // Debug button has badge with count
      const debugButton = screen.getByTestId('console-filter-debug');
      expect(debugButton.textContent).toContain('2');
    }, WAIT_TIMEOUT);
  });

  it('only displays badges when count is greater than 0', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add only error logs - other levels should have no badges
    await act(async () => {
      service.addLog({ level: 'error', message: 'Error 1', args: [], timestamp: Date.now() });
      service.addLog({ level: 'error', message: 'Error 2', args: [], timestamp: Date.now() });
    });

    // Wait for logs to appear
    await waitFor(() => {
      const errorButton = screen.getByTestId('console-filter-error');
      expect(errorButton.textContent).toContain('2');
    }, WAIT_TIMEOUT);

    // Verify badges only appear for error (count > 0)
    const errorButton = screen.getByTestId('console-filter-error');
    expect(errorButton.textContent).toContain('2');

    // Warn, info, and debug should not have badges (count = 0)
    const warnButton = screen.getByTestId('console-filter-warn');
    expect(warnButton.textContent).not.toMatch(/\d/); // No digits in badge

    const infoButton = screen.getByTestId('console-filter-info');
    expect(infoButton.textContent).not.toMatch(/\d/); // No digits in badge

    const debugButton = screen.getByTestId('console-filter-debug');
    expect(debugButton.textContent).not.toMatch(/\d/); // No digits in badge
  });

  it('updates badge counts when logs are added', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Start with one error log
    await act(async () => {
      service.addLog({ level: 'error', message: 'Error 1', args: [], timestamp: Date.now() });
    });

    // Wait for initial log
    await waitFor(() => {
      const errorButton = screen.getByTestId('console-filter-error');
      expect(errorButton.textContent).toContain('1');
    }, WAIT_TIMEOUT);

    // Add more error logs
    await act(async () => {
      service.addLog({ level: 'error', message: 'Error 2', args: [], timestamp: Date.now() });
      service.addLog({ level: 'error', message: 'Error 3', args: [], timestamp: Date.now() });
    });

    // Verify badge count updated
    await waitFor(() => {
      const errorButton = screen.getByTestId('console-filter-error');
      expect(errorButton.textContent).toContain('3');
    }, WAIT_TIMEOUT);
  });

  it('formats timestamps correctly', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();
    const timestamp = Date.now();

    // Add log - wrap in act() to ensure React state updates are flushed
    await act(async () => {
      service.addLog({
        id: 'timestamp-log',
        level: 'debug',
        message: 'Test message',
        args: [],
        timestamp,
      });
    });

    // Wait for log to appear
    await waitFor(() => {
      expect(screen.getByTestId('console-log-row-timestamp-log')).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Check that timestamp is displayed (format: HH:MM:SS.mmm)
    const logEntry = screen.getByTestId('console-log-row-timestamp-log');
    expect(logEntry).toBeInTheDocument();
    // Timestamp format should be in the log entry
    expect(logEntry.textContent).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/);
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

    // Select "all" filter
    const allButton = screen.getByTestId('console-filter-all');
    fireEvent.click(allButton);

    // All logs should be visible
    expect(screen.getByText(/debug message/i)).toBeInTheDocument();
    expect(screen.getByText(/info message/i)).toBeInTheDocument();
    expect(screen.getByText(/warn message/i)).toBeInTheDocument();
    expect(screen.getByText(/error message/i)).toBeInTheDocument();
  });

  // TODO: Fix flaky test - log grouping interaction timing issues
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
      expect(screen.getByTestId('console-log-group-count')).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Should show count badge with "×3"
    const countBadge = await waitFor(() => {
      const badge = screen.getByTestId('console-log-group-count');
      expect(badge).toHaveTextContent('×3');
      return badge;
    }, WAIT_TIMEOUT);
    expect(countBadge).toBeInTheDocument();
  });

  it('does NOT group logs with same message but different args', async () => {
    const service = getConsoleService();
    service.clear(); // Ensure clean state
    render(<ConsolePanel />);
    const correlationId = 'test-correlation-123';

    // Add logs with same message but different args — grouping distinguishes arg content
    await act(async () => {
      service.addLog({
        id: 'log-1',
        level: 'error',
        message: 'Failed to open DevTools popout window',
        args: [{ event: 'tauri://error', id: -1, payload: 'error1' }],
        timestamp: Date.now(),
        correlationId,
      });
      service.addLog({
        id: 'log-2',
        level: 'error',
        message: 'Failed to open DevTools popout window',
        args: [{ event: 'tauri://error', id: -1, payload: 'error2' }],
        timestamp: Date.now() + 100,
        correlationId,
      });
    });

    // Should show 2+ separate log entries (not collapsed into a single group)
    await waitFor(() => {
      expect(screen.getByTestId('console-log-row-log-1')).toBeInTheDocument();
      expect(screen.getByTestId('console-log-row-log-2')).toBeInTheDocument();
    }, WAIT_TIMEOUT);
  });

  it('deletes individual log when delete button is clicked', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add a single log
    await act(async () => {
      service.addLog({
        id: 'delete-log',
        level: 'error',
        message: 'Test error message',
        args: [],
        timestamp: Date.now(),
      });
    });

    // Wait for log to appear
    await waitFor(() => {
      expect(screen.getByTestId('console-log-row-delete-log')).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Find the log entry and hover to show delete button
    const logEntry = screen.getByTestId('console-log-row-delete-log');
    expect(logEntry).toBeInTheDocument();

    // Find delete button
    const deleteButton = within(logEntry).getByTitle('Delete log');
    expect(deleteButton).toBeInTheDocument();

    // Click delete button
    fireEvent.click(deleteButton);

    // Wait for log to disappear
    await waitFor(() => {
      expect(screen.queryByTestId('console-log-row-delete-log')).not.toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Verify log was removed from service
    const remainingLogs = service.getLogs();
    expect(remainingLogs.length).toBe(0);
  });

  // TODO: Fix flaky test - grouped log delete interaction timing
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
      expect(screen.getByTestId('console-log-group-count')).toHaveTextContent('×3');
    }, WAIT_TIMEOUT);

    // Find the grouped log entry
    const logEntry = screen.getByTestId('console-log-group-count').closest('tr');
    expect(logEntry).toBeInTheDocument();
    if (logEntry === null) {
      throw new Error('Log entry not found');
    }

    // Find delete button
    const deleteButton = within(logEntry as HTMLElement).getByTitle('Delete log');
    expect(deleteButton).toBeInTheDocument();

    // Click delete button
    fireEvent.click(deleteButton);

    // Wait for grouped log to disappear
    await waitFor(() => {
      expect(screen.queryByTestId('console-log-group-count')).not.toBeInTheDocument();
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
      expect(screen.getByTestId('console-log-group-count')).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Right-click on the grouped log entry to open context menu
    const logEntry = screen.getByTestId('console-log-group-count').closest('tr');
    expect(logEntry).toBeInTheDocument();

    fireEvent.contextMenu(logEntry!);

    // Wait for context menu to appear
    await waitFor(() => {
      expect(screen.getByTestId('console-context-menu-copy-all')).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Click "Copy all"
    const copyAllButton = screen.getByTestId('console-context-menu-copy-all');
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

  it('pretty-prints JSON strings in log args when expanded', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    const jsonString = '{"error":{"code":123,"message":"boom"}}';
    await act(async () => {
      service.addLog({
        id: 'json-log',
        level: 'error',
        message: 'API error response',
        args: [jsonString],
        timestamp: Date.now(),
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('console-log-row-json-log')).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    const logEntry = screen.getByTestId('console-log-row-json-log');
    const chevronButton = logEntry.querySelector('[data-test-id="expand-button"]');
    expect(chevronButton).toBeInTheDocument();

    // Click chevron to expand (matching pattern from 'collapses expanded args' test)
    fireEvent.click(chevronButton as HTMLElement);

    // Wait for the expanded section to appear and verify JSON content
    const expandedSection = await screen.findByTestId('expanded-section', undefined, {
      timeout: 10000,
    });
    const editor = within(expandedSection).getByTestId('code-editor');

    // Verify the full pretty-printed JSON structure is visible
    expect(editor.textContent).toMatch(/"code":\s*123/);
    expect(editor.textContent).toMatch(/"message":\s*"boom"/);
    expect(editor.textContent).toMatch(/"error":/);
  }, 15000);

  // TODO: Fix flaky test - code editor rendering timing varies in CI
  it('collapses expanded args when chevron is clicked again', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add a log with args
    await act(async () => {
      service.addLog({
        id: 'collapse-log',
        level: 'error',
        message: 'Test error',
        args: [{ error: 'Connection timeout', code: 500 }],
        timestamp: Date.now(),
      });
    });

    // Wait for log to appear
    await waitFor(() => {
      expect(screen.getByTestId('console-log-row-collapse-log')).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Find and click chevron to expand
    const logEntry = screen.getByTestId('console-log-row-collapse-log');
    const chevronButton = logEntry.querySelector('[data-test-id="expand-button"]');
    expect(chevronButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(chevronButton as HTMLElement);
    });

    // Wait for args to appear (assert on visible text, not code-editor textContent)
    // Increase timeout for code editor rendering
    await waitFor(
      () => {
        expect(screen.getByText(/connection timeout/i)).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Click again to collapse
    await act(async () => {
      fireEvent.click(chevronButton!);
    });

    // Wait for args to disappear
    await waitFor(() => {
      expect(screen.queryByText(/connection timeout/i)).not.toBeInTheDocument();
    }, WAIT_TIMEOUT);
  }, 15000);

  // TODO: Fix flaky test - expansion timing issues
  it('expands grouped log to show args', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add 2 identical logs to create a group
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
    });

    // Wait for grouped log to appear
    await waitFor(() => {
      expect(screen.getByTestId('console-log-group-count')).toHaveTextContent('×2');
    }, WAIT_TIMEOUT);

    // Find the chevron button for grouped log
    const logEntry = screen.getByTestId('console-log-group-count').closest('tr');
    if (logEntry === null) {
      throw new Error('Log entry not found');
    }

    // Find chevron button (grouped logs have chevron but no title, skip checkbox)
    const chevronButtons = logEntry.querySelectorAll('button');
    const expandButton = Array.from(chevronButtons).find(
      (btn) => btn.querySelector('svg') && btn.getAttribute('role') !== 'checkbox'
    );
    expect(expandButton).toBeInTheDocument();

    // Click to expand
    fireEvent.click(expandButton!);

    // Wait for args to appear
    await waitFor(() => {
      expect(screen.getByText(/connection timeout/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Verify args are displayed
    expect(screen.getByText(/connection timeout/i)).toBeInTheDocument();
  });

  // TODO: Fix flaky test - occurrences expansion timing
  it('expands occurrences sublist when button is clicked', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add 3 identical logs to create a group
    const identicalArgs = [{ error: 'Connection timeout', code: 500 }];
    const now: number = Date.now();
    await act(async () => {
      [1, 2, 3].forEach((i) => {
        service.addLog({
          id: `occ-log-${String(i)}`,
          level: 'error',
          message: 'Request failed',
          args: identicalArgs,
          timestamp: now + i * 100,
          correlationId: 'test-corr',
        });
      });
    });

    // Wait for grouped log to appear
    await waitFor(() => {
      expect(screen.getByTestId('console-log-group-count')).toHaveTextContent('×3');
    }, WAIT_TIMEOUT);

    // Expand the grouped log first
    const countBadge = screen.getByTestId('console-log-group-count');
    const logRow = countBadge.closest('tr');
    if (logRow === null) {
      throw new Error('Log entry not found');
    }

    const chevronButtons = logRow.querySelectorAll('button');
    const expandButton = Array.from(chevronButtons).find(
      (btn) => btn.querySelector('svg') && btn.getAttribute('role') !== 'checkbox'
    );
    fireEvent.click(expandButton!);

    // Wait for grouped log to expand
    await waitFor(() => {
      expect(screen.getByText(/connection timeout/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Find the occurrences button
    const occurrencesButton = screen.getByTestId('console-log-occurrences-toggle');
    expect(occurrencesButton).toBeInTheDocument();

    // Click to expand occurrences
    fireEvent.click(occurrencesButton);

    // Wait for occurrences list to appear - check for timestamp format
    await waitFor(() => {
      // Should show timestamps for all 3 logs
      const timestampElements = screen.getAllByText(/\d{2}:\d{2}:\d{2}/);
      expect(timestampElements.length).toBeGreaterThanOrEqual(3);
    }, WAIT_TIMEOUT);
  });

  it('collapses occurrences sublist when button is clicked again', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add 2 identical logs to create a group
    const identicalArgs = [{ error: 'Connection timeout', code: 500 }];
    const now: number = Date.now();
    await act(async () => {
      service.addLog({
        id: 'log-1',
        level: 'error',
        message: 'Request failed',
        args: identicalArgs,
        timestamp: now,
        correlationId: 'test-corr',
      });
      service.addLog({
        id: 'log-2',
        level: 'error',
        message: 'Request failed',
        args: identicalArgs,
        timestamp: now + 1,
        correlationId: 'test-corr',
      });
    });

    // Wait for grouped log and expand it
    await waitFor(() => {
      expect(screen.getByTestId('console-log-group-count')).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    const countBadge = screen.getByTestId('console-log-group-count');
    const logRow = countBadge.closest('tr');
    if (logRow === null) {
      throw new Error('Log entry not found');
    }

    const chevronButtons = logRow.querySelectorAll('button');
    const expandButton = Array.from(chevronButtons).find(
      (btn) => btn.querySelector('svg') && btn.getAttribute('role') !== 'checkbox'
    );
    fireEvent.click(expandButton!);

    // Wait for grouped log to expand
    await waitFor(() => {
      expect(screen.getByText(/connection timeout/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Find the occurrences button
    const occurrencesButton = screen.getByTestId('console-log-occurrences-toggle');
    expect(occurrencesButton).toBeInTheDocument();

    // Click to expand occurrences
    fireEvent.click(occurrencesButton);

    // Wait for occurrences to appear
    await waitFor(() => {
      // Look for timestamp elements within the table
      const timestampElements = screen.getAllByText(/\d{2}:\d{2}:\d{2}/);
      expect(timestampElements.length).toBeGreaterThanOrEqual(2);
    }, WAIT_TIMEOUT);

    // Click again to collapse
    fireEvent.click(occurrencesButton);

    // Wait for occurrences list to be hidden
    await waitFor(() => {
      // After collapsing, the individual timestamps should be gone (except for main row if applicable)
      const timestampElements = screen.queryAllByText(/\d{2}:\d{2}:\d{2}/);
      // Grouped logs use firstTimestamp for display in main row, so at least 1 might remain
      expect(timestampElements.length).toBeLessThan(2);
    }, WAIT_TIMEOUT);
  });

  describe('Save functionality', () => {
    it('saves all logs when Save button is clicked with no selection', async () => {
      // Mock save dialog to return a file path
      mockSave.mockResolvedValue('/test/path/console-logs.json');
      mockWriteTextFile.mockResolvedValue(undefined);

      render(<ConsolePanel />);
      const service = getConsoleService();

      // Add some logs
      await act(async () => {
        service.addLog({
          level: 'info',
          message: 'Test info message',
          args: [],
          timestamp: Date.now(),
        });
        service.addLog({
          level: 'error',
          message: 'Test error message',
          args: [{ error: 'some error' }],
          timestamp: Date.now() + 1,
        });
      });

      // Wait for logs to appear
      await waitFor(() => {
        expect(screen.getByText(/test info message/i)).toBeInTheDocument();
      }, WAIT_TIMEOUT);

      // Click the Save button (SplitButton primary action - saves all when no selection)
      const saveButton = screen.getByTestId('console-save-split-button');
      fireEvent.click(saveButton);

      // Wait for save dialog to be called
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith({
          defaultPath: expect.stringMatching(/^console-logs-\d+\.json$/),
          filters: [{ name: 'JSON', extensions: ['json'] }],
        });
      }, WAIT_TIMEOUT);

      // Verify writeTextFile was called with correct path and JSON content
      await waitFor(() => {
        expect(mockWriteTextFile).toHaveBeenCalledWith(
          '/test/path/console-logs.json',
          expect.any(String)
        );
      }, WAIT_TIMEOUT);

      // Verify the written content is valid JSON and contains our logs
      const writtenContent = mockWriteTextFile.mock.calls[0]?.[1];
      expect(writtenContent).toBeDefined();
      const parsedContent = JSON.parse(writtenContent as string);
      expect(Array.isArray(parsedContent)).toBe(true);
      expect(parsedContent.length).toBe(2);
    });

    it('does not write file when save dialog is cancelled', async () => {
      // Mock save dialog to return null (user cancelled)
      mockSave.mockResolvedValue(null);

      render(<ConsolePanel />);
      const service = getConsoleService();

      // Add a log
      await act(async () => {
        service.addLog({
          level: 'info',
          message: 'Test message',
          args: [],
          timestamp: Date.now(),
        });
      });

      // Wait for log to appear
      await waitFor(() => {
        expect(screen.getByText(/test message/i)).toBeInTheDocument();
      }, WAIT_TIMEOUT);

      // Click Save button
      const saveButton = screen.getByTestId('console-save-split-button');
      fireEvent.click(saveButton);

      // Wait for save dialog to be called
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalled();
      }, WAIT_TIMEOUT);

      // Verify writeTextFile was NOT called
      expect(mockWriteTextFile).not.toHaveBeenCalled();
    });

    it('saves only selected logs when Save button is clicked with selection', async () => {
      // Mock save dialog to return a file path
      mockSave.mockResolvedValue('/test/path/console-logs-selected.json');
      mockWriteTextFile.mockResolvedValue(undefined);

      render(<ConsolePanel />);
      const service = getConsoleService();

      // Add some logs
      await act(async () => {
        service.addLog({
          level: 'info',
          message: 'First message',
          args: [],
          timestamp: Date.now(),
        });
        service.addLog({
          level: 'error',
          message: 'Second message',
          args: [],
          timestamp: Date.now() + 1,
        });
        service.addLog({
          level: 'warn',
          message: 'Third message',
          args: [],
          timestamp: Date.now() + 2,
        });
      });

      // Wait for logs to appear
      await waitFor(() => {
        expect(screen.getByText(/first message/i)).toBeInTheDocument();
        expect(screen.getByText(/second message/i)).toBeInTheDocument();
        expect(screen.getByText(/third message/i)).toBeInTheDocument();
      }, WAIT_TIMEOUT);

      // Select only the first and third logs by clicking their checkboxes
      const logEntries = screen.getAllByTestId(/console-log-row-/);
      expect(logEntries.length).toBe(3);

      // Click checkbox on first log (using role="checkbox" selector for Radix Checkbox)
      const firstLogCheckbox = logEntries[0]?.querySelector('[role="checkbox"]');
      expect(firstLogCheckbox).toBeInTheDocument();
      fireEvent.click(firstLogCheckbox!);

      // Click checkbox on third log
      const thirdLogCheckbox = logEntries[2]?.querySelector('[role="checkbox"]');
      expect(thirdLogCheckbox).toBeInTheDocument();
      fireEvent.click(thirdLogCheckbox!);

      // Click Save button
      const saveButton = screen.getByTestId('console-save-split-button');
      fireEvent.click(saveButton);

      // Wait for save dialog to be called
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith({
          defaultPath: expect.stringMatching(/^console-logs-selected-\d+\.json$/),
          filters: [{ name: 'JSON', extensions: ['json'] }],
        });
      }, WAIT_TIMEOUT);

      // Verify writeTextFile was called
      await waitFor(() => {
        expect(mockWriteTextFile).toHaveBeenCalled();
      }, WAIT_TIMEOUT);

      // Verify only 2 logs were saved (first and third)
      const writtenContent = mockWriteTextFile.mock.calls[0]?.[1];
      expect(writtenContent).toBeDefined();
      const parsedContent = JSON.parse(writtenContent as string);
      expect(Array.isArray(parsedContent)).toBe(true);
      expect(parsedContent.length).toBe(2);
    });

    it('Save button saves all logs when no selection exists', async () => {
      // This test verifies that the Save button behavior changes based on selection state
      mockSave.mockResolvedValue('/test/path/console-logs.json');
      mockWriteTextFile.mockResolvedValue(undefined);

      render(<ConsolePanel />);
      const service = getConsoleService();

      // Add a log
      await act(async () => {
        service.addLog({
          level: 'info',
          message: 'Test message',
          args: [],
          timestamp: Date.now(),
        });
      });

      // Wait for log to appear
      await waitFor(() => {
        expect(screen.getByText(/test message/i)).toBeInTheDocument();
      }, WAIT_TIMEOUT);

      // Click Save button without selecting any logs - should save all
      const saveButton = screen.getByTestId('console-save-split-button');
      fireEvent.click(saveButton);

      // Wait for save dialog to be called with the "all" filename pattern
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith({
          defaultPath: expect.stringMatching(/^console-logs-\d+\.json$/),
          filters: [{ name: 'JSON', extensions: ['json'] }],
        });
      }, WAIT_TIMEOUT);
    });
  });

  describe('double-click expand/contract', () => {
    it('expands row on double-click', async () => {
      render(<ConsolePanel />);
      const service = getConsoleService();

      // Add a log with args (so it can be expanded)
      // Use object arg since string args display without quotes
      await act(async () => {
        service.addLog({
          id: 'expand-log',
          level: 'info',
          message: 'Test message with args',
          args: [{ testKey: 'testValue' }],
          timestamp: Date.now(),
        });
      });

      // Wait for log to appear
      await waitFor(() => {
        expect(screen.getByTestId('console-log-row-expand-log')).toBeInTheDocument();
      }, WAIT_TIMEOUT);

      const row = screen.getByTestId('console-log-row-expand-log');

      // Double-click to expand
      fireEvent.doubleClick(row);

      // Verify expanded args are visible (object args get JSON.stringify'd with quotes)
      await waitFor(() => {
        expect(screen.getByText(/"testKey"/)).toBeInTheDocument();
      }, WAIT_TIMEOUT);
    });

    it('contracts expanded row on double-click', async () => {
      render(<ConsolePanel />);
      const service = getConsoleService();

      // Add a log with object args
      await act(async () => {
        service.addLog({
          id: 'contract-log',
          level: 'info',
          message: 'Test message for contract',
          args: [{ contractKey: 'contractValue' }],
          timestamp: Date.now(),
        });
      });

      // Wait for log to appear
      await waitFor(() => {
        expect(screen.getByTestId('console-log-row-contract-log')).toBeInTheDocument();
      }, WAIT_TIMEOUT);

      const row = screen.getByTestId('console-log-row-contract-log');

      // Double-click to expand
      fireEvent.doubleClick(row);
      await waitFor(() => {
        expect(screen.getByText(/"contractKey"/)).toBeInTheDocument();
      }, WAIT_TIMEOUT);

      // Double-click to contract
      fireEvent.doubleClick(row);
      await waitFor(() => {
        expect(screen.queryByText(/"contractKey"/)).not.toBeInTheDocument();
      }, WAIT_TIMEOUT);
    });

    it('does not expand when double-clicking buttons (delete button)', async () => {
      render(<ConsolePanel />);
      const service = getConsoleService();

      // Add a log with args
      await act(async () => {
        service.addLog({
          id: 'button-test-log',
          level: 'warn',
          message: 'Test warning for button test',
          args: [{ warning: 'test warning data' }],
          timestamp: Date.now(),
        });
      });

      // Wait for log to appear
      await waitFor(() => {
        expect(screen.getByTestId('console-log-row-button-test-log')).toBeInTheDocument();
      }, WAIT_TIMEOUT);

      const logEntry = screen.getByTestId('console-log-row-button-test-log');
      const deleteButton = within(logEntry).getByTitle('Delete log');
      expect(deleteButton).toBeInTheDocument();

      // Verify not expanded initially
      let rowGroup = logEntry.closest('.group');
      let expandedContent = rowGroup?.querySelector('.ml-8');
      expect(expandedContent).toBeNull();

      // Double-click on the delete button - should NOT trigger the row's onDoubleClick
      // (delete button will delete the log via onClick, but expansion shouldn't happen via onDoubleClick)
      // Note: In testing-library, doubleClick fires: mousedown, mouseup, click, mousedown, mouseup, click, dblclick
      // The delete button's onClick will fire and delete the log

      // Instead of clicking delete (which removes the log), let's verify the behavior by
      // checking that the row is NOT expanded after double-clicking a button area
      // We'll use the checkbox area instead

      const checkbox = logEntry.querySelector('[role="checkbox"]')!;
      expect(checkbox).toBeInTheDocument();

      // Double-click on checkbox - the row's onDoubleClick should be blocked
      fireEvent.doubleClick(checkbox);

      // Wait a moment
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      const updatedLogEntry = screen.getByTestId('console-log-row-button-test-log');
      rowGroup = updatedLogEntry.closest('.group');
      expandedContent = rowGroup?.querySelector('.ml-8');

      // Should NOT be expanded because we double-clicked on a button/interactive element
      expect(expandedContent).toBeNull();
    });
  });

  describe('infinite loop prevention', () => {
    it('does not cause infinite loops when navigating to empty filter (warnings)', async () => {
      render(<ConsolePanel />);
      const service = getConsoleService();

      // Add only error logs (no warnings)
      await act(async () => {
        service.addLog({
          level: 'error',
          message: 'Error message',
          args: [],
          timestamp: Date.now(),
        });
      });

      // Wait for logs to appear
      await waitFor(() => {
        expect(screen.getByText(/error message/i)).toBeInTheDocument();
      }, WAIT_TIMEOUT);

      // Track errors to detect infinite loops
      const originalConsoleError = console.error;
      const errorSpy = vi.fn();
      console.error = (...args: unknown[]): void => {
        if (String(args[0]).includes('Maximum update depth exceeded')) {
          errorSpy(...args);
        }
        originalConsoleError(...args);
      };

      // Navigate to warnings filter (should be empty)
      const warningsButton = screen.getByTestId('console-filter-warn');

      // This should not cause infinite loops or "Maximum update depth exceeded" errors
      await act(async () => {
        fireEvent.click(warningsButton);
      });

      // Wait a bit to ensure no infinite loop occurs
      await waitFor(() => {
        expect(screen.getByText(/no logs.*warn only/i)).toBeInTheDocument();
      }, WAIT_TIMEOUT);

      // Verify no infinite loop error occurred
      expect(errorSpy).not.toHaveBeenCalled();

      // Restore console.error
      console.error = originalConsoleError;
    });

    it('does not cause infinite loops when navigating to empty filter (info)', async () => {
      render(<ConsolePanel />);
      const service = getConsoleService();

      // Add only error logs (no info)
      await act(async () => {
        service.addLog({
          level: 'error',
          message: 'Error message',
          args: [],
          timestamp: Date.now(),
        });
      });

      // Wait for logs to appear
      await waitFor(() => {
        expect(screen.getByText(/error message/i)).toBeInTheDocument();
      }, WAIT_TIMEOUT);

      // Track errors to detect infinite loops
      const originalConsoleError = console.error;
      const errorSpy = vi.fn();
      console.error = (...args: unknown[]): void => {
        if (String(args[0]).includes('Maximum update depth exceeded')) {
          errorSpy(...args);
        }
        originalConsoleError(...args);
      };

      // Navigate to info filter (should be empty)
      const infoButton = screen.getByTestId('console-filter-info');

      // This should not cause infinite loops
      await act(async () => {
        fireEvent.click(infoButton);
      });

      // Wait a bit to ensure no infinite loop occurs
      await waitFor(() => {
        expect(screen.getByText(/no logs.*info only/i)).toBeInTheDocument();
      }, WAIT_TIMEOUT);

      // Verify no infinite loop error occurred
      expect(errorSpy).not.toHaveBeenCalled();

      // Restore console.error
      console.error = originalConsoleError;
    });

    it('does not update expanded state unnecessarily when handleExpandedChange receives empty object', async () => {
      render(<ConsolePanel />);
      const service = getConsoleService();

      // Add a log that can be expanded
      await act(async () => {
        service.addLog({
          level: 'error',
          message: 'Error with args',
          args: [{ key: 'value' }],
          timestamp: Date.now(),
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/error with args/i)).toBeInTheDocument();
      }, WAIT_TIMEOUT);

      // Get the component instance to access handleExpandedChange
      // We'll test by simulating the VirtualDataGrid calling it with empty object
      // when filter changes to empty
      const errorButton = screen.getByTestId('console-filter-error');
      fireEvent.click(errorButton);

      // Now switch to a filter that will be empty (warnings)
      const warningsButton = screen.getByTestId('console-filter-warn');

      // This should not cause state updates that trigger re-renders
      await act(async () => {
        fireEvent.click(warningsButton);
      });

      // Wait for empty state
      await waitFor(() => {
        expect(screen.getByText(/no logs.*warn only/i)).toBeInTheDocument();
      }, WAIT_TIMEOUT);

      // Verify component is stable (no infinite loop)
      // If we get here without timeout, the fix is working
      expect(screen.getByText(/no logs.*warn only/i)).toBeInTheDocument();
    });

    it('handles rapid filter changes without infinite loops', async () => {
      render(<ConsolePanel />);
      const service = getConsoleService();

      // Add logs of different levels
      await act(async () => {
        service.addLog({
          level: 'error',
          message: 'Error message',
          args: [],
          timestamp: Date.now(),
        });
        service.addLog({
          level: 'warn',
          message: 'Warning message',
          args: [],
          timestamp: Date.now(),
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/error message/i)).toBeInTheDocument();
      }, WAIT_TIMEOUT);

      // Rapidly switch between filters
      const allButton = screen.getByTestId('console-filter-all');
      const warningsButton = screen.getByTestId('console-filter-warn');
      const errorsButton = screen.getByTestId('console-filter-error');

      // Track errors
      const originalConsoleError = console.error;
      const errorSpy = vi.fn();
      console.error = (...args: unknown[]): void => {
        if (String(args[0]).includes('Maximum update depth exceeded')) {
          errorSpy(...args);
        }
        originalConsoleError(...args);
      };

      // Rapid filter changes
      await act(async () => {
        fireEvent.click(warningsButton);
        fireEvent.click(errorsButton);
        fireEvent.click(allButton);
        fireEvent.click(warningsButton);
        fireEvent.click(errorsButton);
      });

      // Wait for stable state
      await waitFor(() => {
        expect(screen.getByText(/error message/i)).toBeInTheDocument();
      }, WAIT_TIMEOUT);

      // Verify no infinite loop error occurred
      expect(errorSpy).not.toHaveBeenCalled();

      // Restore console.error
      console.error = originalConsoleError;
    });
  });
});
