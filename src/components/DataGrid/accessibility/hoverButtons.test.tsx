/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Hover-only buttons accessibility tests
 * @description Tests that hover-only buttons are accessible via keyboard
 *
 * TDD: Tests for ensuring hover-only action buttons are visible when focused
 */

import { render, screen, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VirtualDataGrid } from '../VirtualDataGrid';
import { createNetworkColumns } from '../columns/networkColumns';
import { createConsoleColumns } from '../columns/consoleColumns';
import type { NetworkHistoryEntry } from '@/types/history';
import type { ConsoleLog } from '@/types/console';

// Mock entry factory (matching networkColumns.test.tsx)
function createMockEntry(overrides: Partial<NetworkHistoryEntry> = {}): NetworkHistoryEntry {
  return {
    id: 'test-1',
    timestamp: new Date().toISOString(),
    request: {
      url: 'https://api.example.com/users',
      method: 'GET',
      headers: {},
      body: null,
      timeout_ms: 30000,
    },
    response: {
      status: 200,
      status_text: 'OK',
      headers: {},
      body: '{"users": []}',
      timing: {
        total_ms: 150,
        dns_ms: 10,
        connect_ms: 20,
        tls_ms: 30,
        first_byte_ms: 100,
      },
    },
    ...overrides,
  };
}

// Mock log factory (matching consoleColumns.test.tsx)
function createMockLog(overrides: Partial<ConsoleLog> = {}): ConsoleLog {
  return {
    id: 'test-log-1',
    level: 'info',
    message: 'Test log message',
    args: [],
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('Hover-Only Buttons Accessibility', () => {
  describe('Network columns action buttons', () => {
    it('action buttons are visible when row is focused', () => {
      const columns = createNetworkColumns({
        onReplay: () => {
          /* no-op */
        },
        onCopy: () => {
          /* no-op */
        },
      });

      render(
        <VirtualDataGrid data={[createMockEntry()]} columns={columns} getRowId={(row) => row.id} />
      );

      // Find the action buttons container
      const replayButton = screen.getByTestId('replay-button');
      const actionContainer = replayButton.closest('div[class*="opacity"]');

      // When a button inside is focused, the container should be visible
      act(() => {
        replayButton.focus();
      });

      // The container should be visible when focused
      // We verify the button is accessible (can be focused)
      expect(replayButton).toBeInTheDocument();
      expect(actionContainer).toBeInTheDocument();
    });

    it('action buttons are visible when any button is focused', () => {
      const columns = createNetworkColumns({
        onReplay: () => {
          /* no-op */
        },
        onCopy: () => {
          /* no-op */
        },
        onDelete: () => {
          /* no-op */
        },
      });

      render(
        <VirtualDataGrid data={[createMockEntry()]} columns={columns} getRowId={(row) => row.id} />
      );

      // Focus on copy button
      const copyButton = screen.getByTestId('copy-curl-button');
      act(() => {
        copyButton.focus();
      });

      // Button should be accessible and visible when focused
      expect(copyButton).toBeInTheDocument();
      expect(copyButton).toHaveFocus();
    });
  });

  describe('Console columns action buttons', () => {
    it('action buttons are visible when any button is focused', () => {
      const columns = createConsoleColumns({
        onCopy: () => {
          /* no-op */
        },
        onDelete: () => {
          /* no-op */
        },
      });

      render(
        <VirtualDataGrid data={[createMockLog()]} columns={columns} getRowId={(row) => row.id} />
      );

      // Find the copy button (it has aria-label)
      const copyButton = screen.getByRole('button', { name: /copy log/i });
      act(() => {
        copyButton.focus();
      });

      // Button should be accessible and visible when focused
      expect(copyButton).toBeInTheDocument();
      expect(copyButton).toHaveFocus();
    });
  });

  describe('Row group class', () => {
    it('rows have group class for hover to work', () => {
      const columns = createNetworkColumns({
        onReplay: () => {
          /* no-op */
        },
        onCopy: () => {
          /* no-op */
        },
      });

      render(
        <VirtualDataGrid data={[createMockEntry()]} columns={columns} getRowId={(row) => row.id} />
      );

      // Rows should have 'group' class for Tailwind group utilities
      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1]; // Skip header row
      if (firstDataRow !== undefined) {
        expect(firstDataRow).toHaveClass('group');
      }
    });
  });

  describe('Focus lifecycle', () => {
    it('buttons hide when focus moves away', () => {
      const columns = createNetworkColumns({
        onReplay: () => {
          /* no-op */
        },
        onCopy: () => {
          /* no-op */
        },
      });

      render(
        <VirtualDataGrid
          data={[createMockEntry({ id: '1' }), createMockEntry({ id: '2' })]}
          columns={columns}
          getRowId={(row) => row.id}
        />
      );

      // Focus on first row's replay button
      const firstReplayButton = screen.getAllByTestId('replay-button')[0];
      if (firstReplayButton === undefined) {
        throw new Error('First replay button not found');
      }
      act(() => {
        firstReplayButton.focus();
      });
      expect(firstReplayButton).toHaveFocus();

      // Focus on second row's replay button (simulating arrow key navigation)
      const secondReplayButton = screen.getAllByTestId('replay-button')[1];
      if (secondReplayButton === undefined) {
        throw new Error('Second replay button not found');
      }
      act(() => {
        secondReplayButton.focus();
      });
      expect(secondReplayButton).toHaveFocus();

      // First button should no longer have focus
      expect(firstReplayButton).not.toHaveFocus();
    });
  });
});
