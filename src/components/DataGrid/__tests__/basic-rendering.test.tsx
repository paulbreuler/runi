/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Basic table rendering tests
 * @description Tests for Feature #1: Basic Table Rendering
 *
 * TDD: RED phase - these tests verify that the table renders correctly
 * with all required columns and handles empty states.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VirtualDataGrid } from '../VirtualDataGrid';
import { createNetworkColumns } from '../columns/networkColumns';
import type { NetworkHistoryEntry } from '@/types/history';

/**
 * Create a mock NetworkHistoryEntry for testing.
 */
function createMockEntry(
  overrides: Partial<{
    id: string;
    method: string;
    url: string;
    status: number;
    totalMs: number;
    timestamp: string;
  }> = {}
): NetworkHistoryEntry {
  const now = new Date();
  return {
    id: overrides.id ?? `hist_${String(Date.now())}`,
    timestamp: overrides.timestamp ?? now.toISOString(),
    request: {
      url: overrides.url ?? 'https://api.example.com/users',
      method: (overrides.method ?? 'GET') as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: null,
      timeout_ms: 30000,
    },
    response: {
      status: overrides.status ?? 200,
      status_text: 'OK',
      headers: { 'Content-Type': 'application/json' },
      body: '[]',
      timing: {
        total_ms: overrides.totalMs ?? 150,
        dns_ms: 10,
        connect_ms: 20,
        tls_ms: 30,
        first_byte_ms: 100,
      },
    },
    intelligence: {
      boundToSpec: false,
      specOperation: null,
      drift: null,
      aiGenerated: false,
      verified: false,
    },
  };
}

describe('Feature #1: Basic Table Rendering', () => {
  const mockOnReplay = vi.fn();
  const mockOnCopy = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    mockOnReplay.mockClear();
    mockOnCopy.mockClear();
    mockOnDelete.mockClear();
  });

  describe('renders table with network entries', () => {
    it('renders table with network entries', () => {
      const entries: NetworkHistoryEntry[] = [
        createMockEntry({ id: '1', method: 'GET', url: 'https://api.example.com/users' }),
        createMockEntry({ id: '2', method: 'POST', url: 'https://api.example.com/users' }),
      ];

      const columns = createNetworkColumns({
        onReplay: mockOnReplay,
        onCopy: mockOnCopy,
        onDelete: mockOnDelete,
      });

      render(
        <VirtualDataGrid
          data={entries}
          columns={columns}
          getRowId={(row) => row.id}
          enableRowSelection
          enableExpanding
        />
      );

      // Should render the table
      expect(screen.getByRole('table')).toBeInTheDocument();

      // Should render rows for each entry
      const rows = screen.getAllByRole('row');
      // Header row + 2 data rows
      expect(rows.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('displays all required columns', () => {
    it('displays all required column headers', () => {
      const entries: NetworkHistoryEntry[] = [createMockEntry()];
      const columns = createNetworkColumns({
        onReplay: mockOnReplay,
        onCopy: mockOnCopy,
        onDelete: mockOnDelete,
      });

      render(
        <VirtualDataGrid
          data={entries}
          columns={columns}
          getRowId={(row) => row.id}
          enableRowSelection
          enableExpanding
        />
      );

      // Required columns according to Feature #1:
      // Method, URL, Status, Time, Size, When, Actions
      // (Selection and Expand are also present but not in the requirement list)
      expect(screen.getByRole('columnheader', { name: /method/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /^url$/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /^time$/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /size/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /when/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
    });

    it('displays data in all required columns', () => {
      // Create a body string with specific length for size testing
      const bodyString = '[]'; // Length 2, will show as "2 B"
      const entries: NetworkHistoryEntry[] = [
        {
          ...createMockEntry({
            id: '1',
            method: 'GET',
            url: 'https://api.example.com/users',
            status: 200,
            totalMs: 150,
          }),
          response: {
            ...createMockEntry().response,
            body: bodyString,
            status: 200,
            timing: { total_ms: 150, dns_ms: 10, connect_ms: 20, tls_ms: 30, first_byte_ms: 100 },
          },
        },
      ];

      const columns = createNetworkColumns({
        onReplay: mockOnReplay,
        onCopy: mockOnCopy,
        onDelete: mockOnDelete,
      });

      render(
        <VirtualDataGrid
          data={entries}
          columns={columns}
          getRowId={(row) => row.id}
          enableRowSelection
          enableExpanding
        />
      );

      // Verify method is displayed (GET should be visible)
      expect(screen.getByText('GET')).toBeInTheDocument();

      // Verify URL is displayed
      expect(screen.getByText(/api\.example\.com\/users/i)).toBeInTheDocument();

      // Verify status is displayed
      expect(screen.getByText('200')).toBeInTheDocument();

      // Verify timing is displayed (should show milliseconds)
      // The TimingCell component formats this, so we check for a number
      const timingCell = screen.getByText(/150/i);
      expect(timingCell).toBeInTheDocument();

      // Verify size is displayed (SizeCell formats bytes based on body.length)
      // bodyString.length = 2, so it should show "2 B"
      expect(screen.getByText('2 B')).toBeInTheDocument();
    });
  });

  describe('renders empty state when no entries', () => {
    it('renders empty state when no entries', () => {
      const columns = createNetworkColumns({
        onReplay: mockOnReplay,
        onCopy: mockOnCopy,
        onDelete: mockOnDelete,
      });

      render(
        <VirtualDataGrid
          data={[]}
          columns={columns}
          getRowId={(row) => row.id}
          emptyMessage="No network requests"
        />
      );

      // Should show empty message
      expect(screen.getByText('No network requests')).toBeInTheDocument();

      // Should still render the table structure
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('uses default empty message when not provided', () => {
      const columns = createNetworkColumns({
        onReplay: mockOnReplay,
        onCopy: mockOnCopy,
        onDelete: mockOnDelete,
      });

      render(<VirtualDataGrid data={[]} columns={columns} getRowId={(row) => row.id} />);

      // Should show default empty message
      expect(screen.getByText('No data')).toBeInTheDocument();
    });
  });

  describe('displays column headers correctly', () => {
    it('displays column headers with proper labels', () => {
      const entries: NetworkHistoryEntry[] = [createMockEntry()];
      const columns = createNetworkColumns({
        onReplay: mockOnReplay,
        onCopy: mockOnCopy,
        onDelete: mockOnDelete,
      });

      render(
        <VirtualDataGrid
          data={entries}
          columns={columns}
          getRowId={(row) => row.id}
          enableRowSelection
          enableExpanding
        />
      );

      // Verify headers are uppercase or properly formatted
      const methodHeader = screen.getByRole('columnheader', { name: /method/i });
      expect(methodHeader).toBeInTheDocument();

      const urlHeader = screen.getByRole('columnheader', { name: /^url$/i });
      expect(urlHeader).toBeInTheDocument();

      const statusHeader = screen.getByRole('columnheader', { name: /status/i });
      expect(statusHeader).toBeInTheDocument();
    });

    it('renders header row with all columns', () => {
      const entries: NetworkHistoryEntry[] = [createMockEntry()];
      const columns = createNetworkColumns({
        onReplay: mockOnReplay,
        onCopy: mockOnCopy,
        onDelete: mockOnDelete,
      });

      render(
        <VirtualDataGrid
          data={entries}
          columns={columns}
          getRowId={(row) => row.id}
          enableRowSelection
          enableExpanding
        />
      );

      // Count column headers - should have at least the required ones
      const headers = screen.getAllByRole('columnheader');
      // Selection, Expand, Method, URL, Status, Time, Size, When, Actions = 9 columns
      expect(headers.length).toBeGreaterThanOrEqual(9);
    });
  });
});
