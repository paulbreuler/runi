/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file ConsolePanel migration tests
 * @description RED phase: Tests for ConsolePanel migrated to use VirtualDataGrid
 *
 * These tests verify that the migrated component maintains all existing functionality
 * while using TanStack Table + VirtualDataGrid instead of custom rendering.
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

const WAIT_TIMEOUT = { timeout: 2000 };

describe('ConsolePanel (Migrated to VirtualDataGrid)', () => {
  beforeEach(() => {
    const service = getConsoleService();
    service.clear();
    service.setMinLogLevel('debug');
    mockSave.mockReset();
    mockWriteTextFile.mockReset();
  });

  it('renders VirtualDataGrid with console columns', async () => {
    render(<ConsolePanel />);
    // After migration, should render VirtualDataGrid
    expect(screen.getByTestId('virtual-datagrid')).toBeInTheDocument();
  });

  it('displays logs in the grid', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    await act(async () => {
      service.addLog({
        level: 'info',
        message: 'Test info message',
        args: [],
        timestamp: Date.now(),
        id: 'log_1',
      });
      service.addLog({
        level: 'error',
        message: 'Test error message',
        args: [],
        timestamp: Date.now(),
        id: 'log_2',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/test info message/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);
    expect(screen.getByText(/test error message/i)).toBeInTheDocument();
  });

  it('renders column headers from createConsoleColumns', async () => {
    render(<ConsolePanel />);
    // Headers should be rendered by VirtualDataGrid
    expect(screen.getByText('Level')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
  });

  it('supports row selection via TanStack Table', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    await act(async () => {
      service.addLog({
        level: 'info',
        message: 'Test message',
        args: [],
        timestamp: Date.now(),
        id: 'log_1',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/test message/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Find selection checkbox in first row
    const checkboxes = screen.getAllByRole('checkbox');
    const rowCheckbox = checkboxes.find((cb) =>
      cb.getAttribute('aria-label')?.includes('Select row')
    );
    expect(rowCheckbox).toBeInTheDocument();

    // Click to select
    if (rowCheckbox) {
      fireEvent.click(rowCheckbox);
      await waitFor(() => {
        expect(rowCheckbox).toHaveAttribute('aria-checked', 'true');
      }, WAIT_TIMEOUT);
    }
  });

  it('supports row expansion via TanStack Table', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    await act(async () => {
      service.addLog({
        level: 'info',
        message: 'Test message',
        args: [{ key: 'value' }],
        timestamp: Date.now(),
        id: 'log_1',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/test message/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Find expander button
    const expandButtons = screen.getAllByTestId('expand-button');
    expect(expandButtons.length).toBeGreaterThan(0);

    // Click to expand
    fireEvent.click(expandButtons[0]!);
    // Expanded content should appear
    await waitFor(() => {
      expect(screen.getByTestId('expanded-section')).toBeInTheDocument();
    });
  });

  it('maintains filtering by level', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    await act(async () => {
      service.addLog({
        level: 'info',
        message: 'Info message',
        args: [],
        timestamp: Date.now(),
        id: 'log_1',
      });
      service.addLog({
        level: 'error',
        message: 'Error message',
        args: [],
        timestamp: Date.now(),
        id: 'log_2',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/info message/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Filter by error level
    const errorFilter = screen.getByRole('button', { name: /error/i });
    fireEvent.click(errorFilter);

    // Should only show error logs
    expect(screen.queryByText(/info message/i)).not.toBeInTheDocument();
    expect(screen.getByText(/error message/i)).toBeInTheDocument();
  });

  it('maintains search filtering', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    await act(async () => {
      service.addLog({
        level: 'info',
        message: 'First message',
        args: [],
        timestamp: Date.now(),
        id: 'log_1',
      });
      service.addLog({
        level: 'info',
        message: 'Second message',
        args: [],
        timestamp: Date.now(),
        id: 'log_2',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/first message/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);

    // Search for "second"
    const searchInput = screen.getByPlaceholderText(/search logs/i);
    fireEvent.change(searchInput, { target: { value: 'second' } });

    // Should only show second message
    expect(screen.queryByText(/first message/i)).not.toBeInTheDocument();
    expect(screen.getByText(/second message/i)).toBeInTheDocument();
  });

  it('maintains log grouping for identical logs', async () => {
    render(<ConsolePanel />);
    const service = getConsoleService();

    await act(async () => {
      // Add 3 identical logs
      const timestamp = Date.now();
      service.addLog({
        level: 'error',
        message: 'Duplicate error',
        args: [],
        timestamp,
        id: 'log_1',
      });
      service.addLog({
        level: 'error',
        message: 'Duplicate error',
        args: [],
        timestamp: timestamp + 1,
        id: 'log_2',
      });
      service.addLog({
        level: 'error',
        message: 'Duplicate error',
        args: [],
        timestamp: timestamp + 2,
        id: 'log_3',
      });
    });

    await waitFor(() => {
      // Should show grouped log with count
      expect(screen.getByText(/duplicate error/i)).toBeInTheDocument();
      expect(screen.getByText(/×3/i)).toBeInTheDocument();
    }, WAIT_TIMEOUT);
  });

  it('shows empty state when no logs', () => {
    render(<ConsolePanel />);
    expect(screen.getByText(/no logs/i)).toBeInTheDocument();
  });
});
