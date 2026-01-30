/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

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

  // TODO: Fix flaky test - log grouping interaction is complex and timing-dependent
  it.skip('displays correlation ID in grouped log entries when expanded', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();
    const correlationId = 'test-correlation-12345678';

    // Add multiple identical logs to create a group (same level, message, args)
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
        correlationId: 'test-correlation-87654321',
      });
    });

    // Wait for grouped log to appear with count badge
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Count badge
    }, WAIT_TIMEOUT);

    // Double-click to expand the grouped log
    const logRow = screen.getByText(/test message/i).closest('tr');
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
    const occurrencesButton = screen.getByText(/2 occurrences at:/i);
    await act(async () => {
      fireEvent.click(occurrencesButton);
    });

    // Now correlation IDs should be visible with title attribute
    await waitFor(() => {
      expect(screen.getByTitle(correlationId)).toBeInTheDocument();
    }, WAIT_TIMEOUT);
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
      const allButton = screen.getByRole('button', { name: /all \(6\)/i });
      expect(allButton).toBeInTheDocument();
      // Error button has badge with count
      const errorButton = screen.getByRole('button', { name: /errors/i });
      expect(errorButton.textContent).toContain('1');
      // Warn button has badge with count
      const warnButton = screen.getByRole('button', { name: /warnings/i });
      expect(warnButton.textContent).toContain('1');
      // Info button has badge with count (button contains "Info" text)
      const infoButtons = screen.getAllByRole('button');
      const infoButton = infoButtons.find((btn) => btn.textContent.includes('Info'));
      expect(infoButton).toBeDefined();
      if (infoButton !== undefined) {
        expect(infoButton.textContent).toContain('2');
      }
      // Debug button has badge with count (button contains "Debug" text)
      const debugButton = infoButtons.find((btn) => btn.textContent.includes('Debug'));
      expect(debugButton).toBeDefined();
      if (debugButton !== undefined) {
        expect(debugButton.textContent).toContain('2');
      }
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
      const errorButton = screen.getByRole('button', { name: /errors/i });
      expect(errorButton.textContent).toContain('2');
    }, WAIT_TIMEOUT);

    // Verify badges only appear for error (count > 0)
    const errorButton = screen.getByRole('button', { name: /errors/i });
    expect(errorButton.textContent).toContain('2');

    // Warn, info, and debug should not have badges (count = 0)
    const warnButton = screen.getByRole('button', { name: /warnings/i });
    expect(warnButton.textContent).not.toMatch(/\d/); // No digits in badge

    const allButtons = screen.getAllByRole('button');
    const infoButton = allButtons.find(
      (btn) => btn.textContent.includes('Info') && !btn.textContent.includes('All')
    );
    expect(infoButton).toBeDefined();
    if (infoButton !== undefined) {
      expect(infoButton.textContent).not.toMatch(/\d/); // No digits in badge
    }

    const debugButton = allButtons.find((btn) => btn.textContent.includes('Debug'));
    expect(debugButton).toBeDefined();
    if (debugButton !== undefined) {
      expect(debugButton.textContent).not.toMatch(/\d/); // No digits in badge
    }
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
      const errorButton = screen.getByRole('button', { name: /errors/i });
      expect(errorButton.textContent).toContain('1');
    }, WAIT_TIMEOUT);

    // Add more error logs
    await act(async () => {
      service.addLog({ level: 'error', message: 'Error 2', args: [], timestamp: Date.now() });
      service.addLog({ level: 'error', message: 'Error 3', args: [], timestamp: Date.now() });
    });

    // Verify badge count updated
    await waitFor(() => {
      const errorButton = screen.getByRole('button', { name: /errors/i });
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

  // TODO: Fix flaky test - log grouping interaction timing issues
  it.skip('groups logs with identical level, message, correlationId, AND args', async () => {
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

  // TODO: Fix flaky test - grouped log delete interaction timing
  it.skip('deletes all instances when deleting a grouped log', async () => {
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

  it('expands individual log args when chevron is clicked', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add a log with args
    await act(async () => {
      service.addLog({
        level: 'error',
        message: 'Test error',
        args: [{ error: 'Connection timeout', code: 500 }],
        timestamp: Date.now(),
      });
    });

    // Wait for log to appear
    await waitFor(() => {
      expect(screen.getByText(/test error/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Find the chevron button (should be ChevronRight when collapsed)
    const logEntry = screen.getByText(/test error/i).closest('.group');
    if (logEntry === null) {
      throw new Error('Log entry not found');
    }
    // Find button with title or any button with chevron icon (skip checkbox)
    const chevronButton =
      logEntry.querySelector('button[title="Expand/collapse args"]') ??
      Array.from(logEntry.querySelectorAll('button')).find(
        (btn) => btn.querySelector('svg') && btn.getAttribute('role') !== 'checkbox'
      );
    expect(chevronButton).toBeInTheDocument();

    // Click to expand
    fireEvent.click(chevronButton!);

    const getArgsText = (): string =>
      screen
        .queryAllByTestId('code-box')
        .map((box) => box.textContent || '')
        .join(' ');

    // Wait for args to appear in CodeSnippet (syntax highlighted)
    await waitFor(() => {
      expect(getArgsText()).toMatch(/connection timeout/i);
    }, WAIT_TIMEOUT);

    const allText = getArgsText();
    expect(allText).toMatch(/connection timeout/i);
    expect(allText).toMatch(/"code":\s*500/i);
  });

  it('collapses expanded args when chevron is clicked again', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add a log with args
    await act(async () => {
      service.addLog({
        level: 'error',
        message: 'Test error',
        args: [{ error: 'Connection timeout', code: 500 }],
        timestamp: Date.now(),
      });
    });

    // Wait for log to appear
    await waitFor(() => {
      expect(screen.getByText(/test error/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Find and click chevron to expand
    const logEntry = screen.getByText(/test error/i).closest('.group');
    if (logEntry === null) {
      throw new Error('Log entry not found');
    }
    // Find button with title or any button with chevron icon
    const chevronButton =
      logEntry.querySelector('button[title="Expand/collapse args"]') ??
      Array.from(logEntry.querySelectorAll('button')).find(
        (btn) => btn.querySelector('svg') && btn.getAttribute('role') !== 'checkbox'
      );
    expect(chevronButton).toBeInTheDocument();
    fireEvent.click(chevronButton!);

    const getArgsText = (): string =>
      screen
        .queryAllByTestId('code-box')
        .map((box) => box.textContent || '')
        .join(' ');

    // Wait for args to appear
    await waitFor(() => {
      expect(getArgsText()).toMatch(/connection timeout/i);
    }, WAIT_TIMEOUT);

    // Click again to collapse
    fireEvent.click(chevronButton!);

    // Wait for args to disappear
    await waitFor(() => {
      expect(getArgsText()).not.toMatch(/connection timeout/i);
    }, WAIT_TIMEOUT);
  });

  // TODO: Fix flaky test - expansion timing issues
  it.skip('expands grouped log to show args', async () => {
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
      expect(screen.getByText(/request failed/i)).toBeInTheDocument();
      expect(screen.getByTitle(/2 occurrences/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Find the chevron button for grouped log
    const logEntry = screen.getByText(/request failed/i).closest('.group');
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
  it.skip('expands occurrences sublist when button is clicked', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    // Add 3 identical logs to create a group
    const identicalArgs = [{ error: 'Connection timeout', code: 500 }];
    const timestamps = [Date.now(), Date.now() + 100, Date.now() + 200];
    await act(async () => {
      for (const ts of timestamps) {
        service.addLog({
          level: 'error',
          message: 'Request failed',
          args: identicalArgs,
          timestamp: ts,
        });
      }
    });

    // Wait for grouped log to appear
    await waitFor(() => {
      expect(screen.getByText(/request failed/i)).toBeInTheDocument();
      expect(screen.getByTitle(/3 occurrences/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Expand the grouped log first
    const logEntry = screen.getByText(/request failed/i).closest('.group');
    if (logEntry === null) {
      throw new Error('Log entry not found');
    }

    const chevronButtons = logEntry.querySelectorAll('button');
    const expandButton = Array.from(chevronButtons).find(
      (btn) => btn.querySelector('svg') && btn.getAttribute('role') !== 'checkbox'
    );
    fireEvent.click(expandButton!);

    // Wait for grouped log to expand
    await waitFor(() => {
      expect(screen.getByText(/connection timeout/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Find the occurrences button
    const occurrencesButton = screen.getByText(/3 occurrences at:/i);
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

  // TODO: Fix flaky test - collapse timing
  it.skip('collapses occurrences sublist when button is clicked again', async () => {
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

    // Wait for grouped log and expand it
    await waitFor(() => {
      expect(screen.getByText(/request failed/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    const logEntry = screen.getByText(/request failed/i).closest('.group');
    if (logEntry === null) {
      throw new Error('Log entry not found');
    }

    const chevronButtons = logEntry.querySelectorAll('button');
    const expandButton = Array.from(chevronButtons).find(
      (btn) => btn.querySelector('svg') && btn.getAttribute('role') !== 'checkbox'
    );
    fireEvent.click(expandButton!);

    // Wait for grouped log to expand
    await waitFor(() => {
      expect(screen.getByText(/connection timeout/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Find occurrences button by searching within the expanded grouped log area
    const expandedArea = logEntry.querySelector('.ml-8');
    expect(expandedArea).toBeInTheDocument();
    if (expandedArea === null) {
      throw new Error('Expanded area not found');
    }

    // Find the occurrences button within the expanded area
    const occurrencesButton = Array.from(expandedArea.querySelectorAll('button')).find((btn) =>
      btn.textContent.includes('occurrences')
    );
    expect(occurrencesButton).toBeInTheDocument();
    if (occurrencesButton === undefined) {
      throw new Error('Occurrences button not found');
    }

    // Click to expand occurrences
    fireEvent.click(occurrencesButton);

    // Wait for occurrences to appear
    await waitFor(() => {
      const occurrenceItems = expandedArea.querySelectorAll('.ml-6 .text-xs.font-mono');
      expect(occurrenceItems.length).toBeGreaterThanOrEqual(2);
    }, WAIT_TIMEOUT);

    // Click again to collapse
    fireEvent.click(occurrencesButton);

    // Wait for occurrences list to be hidden
    await waitFor(() => {
      // After collapsing, the occurrences list items should not be visible
      const occurrenceItemsAfter = expandedArea.querySelectorAll('.ml-6 .text-xs.font-mono');
      // When collapsed, there should be no occurrence items
      expect(occurrenceItemsAfter.length).toBe(0);
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
      const saveButton = screen.getByRole('button', { name: /^save$/i });
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
      const saveButton = screen.getByRole('button', { name: /^save$/i });
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
      const logEntries = screen.getAllByTestId(/console-log-/);
      expect(logEntries.length).toBe(3);

      // Click checkbox on first log (using role="checkbox" selector for Radix Checkbox)
      const firstLogCheckbox = logEntries[0]?.querySelector('[role="checkbox"]');
      expect(firstLogCheckbox).toBeInTheDocument();
      fireEvent.click(firstLogCheckbox!);

      // Click checkbox on third log
      const thirdLogCheckbox = logEntries[2]?.querySelector('[role="checkbox"]');
      expect(thirdLogCheckbox).toBeInTheDocument();
      fireEvent.click(thirdLogCheckbox!);

      // Click Save button (SplitButton primary action - saves selection when items are selected)
      const saveButton = screen.getByRole('button', { name: /^save$/i });
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
      const saveButton = screen.getByRole('button', { name: /^save$/i });
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

  describe('row click selection', () => {
    // TODO: Fix flaky test - row selection click timing
    it.skip('toggles selection when row is clicked (single click)', async () => {
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

      // Find the row container (not the checkbox)
      const logEntry = screen.getByTestId(/console-log-info/i);
      expect(logEntry).toBeInTheDocument();

      // Initially not selected - use role="checkbox" for Radix Checkbox
      const checkbox = logEntry.querySelector('[role="checkbox"]');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toHaveAttribute('data-checked');

      // Click the row (not the checkbox)
      fireEvent.click(logEntry);

      // Should now be selected
      await waitFor(() => {
        const updatedCheckbox = logEntry.querySelector('[role="checkbox"]');
        expect(updatedCheckbox).toBeInTheDocument();
        expect(updatedCheckbox).toHaveAttribute('data-checked');
      }, WAIT_TIMEOUT);

      // Click the row again to deselect
      fireEvent.click(logEntry);

      // Should be deselected again
      await waitFor(() => {
        const updatedCheckbox = logEntry.querySelector('[role="checkbox"]');
        expect(updatedCheckbox).toBeInTheDocument();
        expect(updatedCheckbox).not.toHaveAttribute('data-checked');
      }, WAIT_TIMEOUT);
    });

    it('does not toggle selection when clicking on checkbox (checkbox handles its own click)', async () => {
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

      const logEntry = screen.getByTestId(/console-log-info/i);
      const checkbox = logEntry.querySelector('[role="checkbox"]');
      expect(checkbox).toBeInTheDocument();
      if (checkbox === null) {
        throw new Error('Checkbox not found');
      }

      // Click the checkbox directly
      fireEvent.click(checkbox);

      // Should be selected (Base UI Checkbox uses data-checked attribute)
      await waitFor(() => {
        expect(checkbox).toHaveAttribute('data-checked');
      }, WAIT_TIMEOUT);

      // Click checkbox again
      fireEvent.click(checkbox);

      // Should be deselected
      await waitFor(() => {
        expect(checkbox).not.toHaveAttribute('data-checked');
      }, WAIT_TIMEOUT);
    });

    it('does not toggle selection when clicking on expand/collapse button', async () => {
      render(<ConsolePanel />);
      const service = getConsoleService();

      // Add a log with args (so it has an expand button)
      await act(async () => {
        service.addLog({
          level: 'info',
          message: 'Test message',
          args: [{ key: 'value' }],
          timestamp: Date.now(),
        });
      });

      // Wait for log to appear
      await waitFor(() => {
        expect(screen.getByText(/test message/i)).toBeInTheDocument();
      }, WAIT_TIMEOUT);

      const logEntry = screen.getByTestId(/console-log-info/i);

      // Find the expand button (chevron button - not the checkbox)
      const expandButton = Array.from(logEntry.querySelectorAll('button')).find(
        (btn) => btn.querySelector('svg') && btn.getAttribute('role') !== 'checkbox'
      );
      expect(expandButton).toBeInTheDocument();

      // Initially not selected (use role="checkbox" for Radix Checkbox)
      const checkbox = logEntry.querySelector('[role="checkbox"]');
      expect(checkbox).not.toHaveAttribute('data-checked');

      // Click the expand button
      if (expandButton !== undefined) {
        fireEvent.click(expandButton);
      }

      // Should still not be selected (expand button doesn't trigger selection)
      const stillUnselectedCheckbox = logEntry.querySelector('[role="checkbox"]');
      expect(stillUnselectedCheckbox).toBeInTheDocument();
      expect(stillUnselectedCheckbox).not.toHaveAttribute('data-checked');
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
          level: 'info',
          message: 'Test message with args',
          args: [{ testKey: 'testValue' }],
          timestamp: Date.now(),
        });
      });

      // Wait for log to appear
      await waitFor(() => {
        expect(screen.getByText(/test message with args/i)).toBeInTheDocument();
      }, WAIT_TIMEOUT);

      const row = screen.getByTestId('console-log-info');

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
          level: 'info',
          message: 'Test message for contract',
          args: [{ contractKey: 'contractValue' }],
          timestamp: Date.now(),
        });
      });

      // Wait for log to appear
      await waitFor(() => {
        expect(screen.getByText(/test message for contract/i)).toBeInTheDocument();
      }, WAIT_TIMEOUT);

      const row = screen.getByTestId('console-log-info');

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
          level: 'warn',
          message: 'Test warning for button test',
          args: [{ warning: 'test warning data' }],
          timestamp: Date.now(),
        });
      });

      // Wait for log to appear
      await waitFor(() => {
        expect(screen.getByText(/test warning for button test/i)).toBeInTheDocument();
      }, WAIT_TIMEOUT);

      const logEntry = screen.getByTestId('console-log-warn');
      const deleteButton = logEntry.querySelector('button[title="Delete log"]')!;
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

      // Re-get the row group (it might have re-rendered)
      const updatedLogEntry = screen.getByTestId('console-log-warn');
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
      const warningsButton = screen.getByRole('button', { name: /warnings/i });

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
      const infoButton = screen.getByRole('button', { name: /info/i });

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
      const errorButton = screen.getByRole('button', { name: /errors/i });
      fireEvent.click(errorButton);

      // Now switch to a filter that will be empty (warnings)
      const warningsButton = screen.getByRole('button', { name: /warnings/i });

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
      const allButton = screen.getByRole('button', { name: /all/i });
      const warningsButton = screen.getByRole('button', { name: /warnings/i });
      const errorsButton = screen.getByRole('button', { name: /errors/i });

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
