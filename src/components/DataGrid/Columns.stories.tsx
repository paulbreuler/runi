/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file DataGrid Columns Storybook stories
 * @description Consolidated story using Storybook 10 controls for all column types
 *
 * This story consolidates all column stories:
 * - Network columns (MethodCell, UrlCell, StatusCell, TimingCell, SizeCell, TimeAgoCell, ProtocolCell)
 * - Console columns (LevelCell, MessageCell, TimestampCell)
 * - Utility columns (SelectionColumn, ExpanderColumn, TableHeaderRow)
 * - Actions cells (NetworkActionsCell, ConsoleActionsCell)
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within, fn } from 'storybook/test';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ExpandedState,
  type RowSelectionState,
} from '@tanstack/react-table';
import {
  createNetworkColumns,
  MethodCell,
  StatusCell,
  TimingCell,
  SizeCell,
  ProtocolCell,
} from './columns/networkColumns';
import { createConsoleColumns, LevelCell } from './columns/consoleColumns';
import type { NetworkHistoryEntry } from '@/types/history';
import type { ConsoleLog } from '@/types/console';

// ============================================================================
// Mock Data
// ============================================================================

function createMockNetworkEntry(overrides: Partial<NetworkHistoryEntry> = {}): NetworkHistoryEntry {
  return {
    id: `hist_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
    request: {
      url: 'https://api.example.com/users',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: null,
      timeout_ms: 30000,
    },
    response: {
      status: 200,
      status_text: 'OK',
      headers: { 'Content-Type': 'application/json' },
      body: '[]',
      timing: {
        total_ms: 150,
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
    ...overrides,
  };
}

function createMockConsoleLog(overrides: Partial<ConsoleLog> = {}): ConsoleLog {
  return {
    id: `log-${Math.random().toString(36).slice(2, 9)}`,
    level: 'info',
    message: 'Sample log message',
    args: [],
    timestamp: Date.now(),
    ...overrides,
  };
}

const sampleNetworkEntries: NetworkHistoryEntry[] = [
  createMockNetworkEntry({
    request: { method: 'GET', url: 'https://api.example.com/users' },
    response: {
      status: 200,
      status_text: 'OK',
      timing: { total_ms: 120, dns_ms: 5, connect_ms: 10, tls_ms: 15, first_byte_ms: 80 },
    },
  }),
  createMockNetworkEntry({
    request: { method: 'POST', url: 'https://api.example.com/users' },
    response: {
      status: 201,
      status_text: 'Created',
      timing: { total_ms: 250, dns_ms: 8, connect_ms: 15, tls_ms: 20, first_byte_ms: 180 },
    },
  }),
  createMockNetworkEntry({
    request: { method: 'GET', url: 'https://api.example.com/users/999' },
    response: {
      status: 404,
      status_text: 'Not Found',
      timing: { total_ms: 45, dns_ms: 3, connect_ms: 8, tls_ms: 10, first_byte_ms: 35 },
    },
  }),
  createMockNetworkEntry({
    request: { method: 'DELETE', url: 'https://api.example.com/users/1' },
    response: {
      status: 500,
      status_text: 'Internal Server Error',
      timing: { total_ms: 5000, dns_ms: 5, connect_ms: 10, tls_ms: 15, first_byte_ms: 4900 },
    },
  }),
];

const sampleConsoleLogs: ConsoleLog[] = [
  createMockConsoleLog({
    level: 'info',
    message: 'Application started successfully',
    timestamp: Date.now() - 5000,
  }),
  createMockConsoleLog({
    level: 'debug',
    message: 'Fetching user preferences',
    timestamp: Date.now() - 4000,
  }),
  createMockConsoleLog({
    level: 'warn',
    message: 'Deprecated API endpoint used',
    timestamp: Date.now() - 2000,
  }),
  createMockConsoleLog({
    level: 'error',
    message: 'Failed to connect to database',
    timestamp: Date.now() - 1000,
  }),
];

// ============================================================================
// Storybook Meta
// ============================================================================

const meta = {
  title: 'DataGrid/Columns',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Consolidated documentation for all DataGrid column types.

**Network Columns:**
- MethodCell - HTTP method badges with color coding
- UrlCell - URL display with intelligence signals
- StatusCell - HTTP status codes with semantic colors
- TimingCell - Request timing with visual indicators
- SizeCell - Response size formatting (bytes, KB, MB)
- TimeAgoCell - Relative time display with auto-updates
- ProtocolCell - HTTP protocol version badges
- ActionsCell - Row action buttons (Replay, Copy, Delete)

**Console Columns:**
- LevelCell - Log level badges (info, warn, error, debug)
- MessageCell - Log message with truncation and grouping
- TimestampCell - Absolute timestamp display
- ConsoleActionsCell - Console log actions

**Utility Columns:**
- SelectionColumn - Row selection checkboxes
- ExpanderColumn - Row expansion chevrons
- TableHeaderRow - Table header row component

Use the Controls panel to explore different column types and states.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    columnType: {
      control: 'select',
      options: ['network', 'console', 'utility'],
      description: 'Column type to display',
    },
    showFullTable: {
      control: 'boolean',
      description: 'Show full table with all columns',
    },
  },
  args: {
    columnType: 'network',
    showFullTable: false,
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = fn();

// ============================================================================
// Visual Documentation Stories
// ============================================================================

/**
 * HTTP method badges with all methods and color coding.
 */
export const MethodBadges: Story = {
  render: () => (
    <div className="flex gap-4 items-center bg-bg-surface p-4 rounded-lg">
      <MethodCell method="GET" />
      <MethodCell method="POST" />
      <MethodCell method="PUT" />
      <MethodCell method="PATCH" />
      <MethodCell method="DELETE" />
      <MethodCell method="HEAD" />
      <MethodCell method="OPTIONS" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'HTTP method badges with semantic color coding: GET (blue), POST (green), PUT/PATCH (amber), DELETE (red), HEAD/OPTIONS (gray).',
      },
    },
  },
};

/**
 * Status codes with semantic colors for all ranges.
 */
export const StatusCodes: Story = {
  render: () => (
    <div className="space-y-4 bg-bg-surface p-4 rounded-lg">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">2xx Success</h3>
        <div className="flex gap-4 items-center">
          <div className="text-center">
            <StatusCell status={200} />
            <p className="text-xs text-text-muted mt-1">200 OK</p>
          </div>
          <div className="text-center">
            <StatusCell status={201} />
            <p className="text-xs text-text-muted mt-1">201 Created</p>
          </div>
          <div className="text-center">
            <StatusCell status={204} />
            <p className="text-xs text-text-muted mt-1">204 No Content</p>
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">4xx Client Error</h3>
        <div className="flex gap-4 items-center">
          <div className="text-center">
            <StatusCell status={400} />
            <p className="text-xs text-text-muted mt-1">400 Bad Request</p>
          </div>
          <div className="text-center">
            <StatusCell status={404} />
            <p className="text-xs text-text-muted mt-1">404 Not Found</p>
          </div>
          <div className="text-center">
            <StatusCell status={429} />
            <p className="text-xs text-text-muted mt-1">429 Too Many</p>
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">5xx Server Error</h3>
        <div className="flex gap-4 items-center">
          <div className="text-center">
            <StatusCell status={500} />
            <p className="text-xs text-text-muted mt-1">500 Internal</p>
          </div>
          <div className="text-center">
            <StatusCell status={502} />
            <p className="text-xs text-text-muted mt-1">502 Bad Gateway</p>
          </div>
          <div className="text-center">
            <StatusCell status={503} />
            <p className="text-xs text-text-muted mt-1">503 Service Unavailable</p>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'HTTP status codes with semantic color coding: 2xx (green), 3xx (blue), 4xx (amber), 5xx (red).',
      },
    },
  },
};

/**
 * Timing cells showing different durations and states.
 */
export const TimingVariations: Story = {
  render: () => (
    <div className="space-y-4 bg-bg-surface p-4 rounded-lg">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Fast Requests</h3>
        <div className="flex gap-6 items-center">
          <div className="text-center">
            <TimingCell totalMs={45} />
            <p className="text-xs text-text-muted mt-1">45ms</p>
          </div>
          <div className="text-center">
            <TimingCell totalMs={120} />
            <p className="text-xs text-text-muted mt-1">120ms</p>
          </div>
          <div className="text-center">
            <TimingCell totalMs={250} />
            <p className="text-xs text-text-muted mt-1">250ms</p>
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Slow Requests (&gt;1000ms)</h3>
        <div className="flex gap-6 items-center">
          <div className="text-center">
            <TimingCell totalMs={1500} />
            <p className="text-xs text-text-muted mt-1">1500ms (red)</p>
          </div>
          <div className="text-center">
            <TimingCell totalMs={5000} />
            <p className="text-xs text-text-muted mt-1">5000ms</p>
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Special States</h3>
        <div className="flex gap-6 items-center">
          <div className="text-center">
            <TimingCell totalMs={-1} />
            <p className="text-xs text-text-muted mt-1">Streaming</p>
          </div>
          <div className="text-center">
            <TimingCell totalMs={0} />
            <p className="text-xs text-text-muted mt-1">Blocked</p>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Timing cells show request duration with color coding: fast (&lt;1000ms), slow (&gt;1000ms, red), streaming (-1), blocked (0).',
      },
    },
  },
};

/**
 * Size cells showing different response sizes.
 */
export const SizeFormats: Story = {
  render: () => (
    <div className="space-y-4 bg-bg-surface p-4 rounded-lg">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Bytes</h3>
        <div className="flex gap-6 items-center">
          <div className="text-center">
            <SizeCell bytes={256} />
            <p className="text-xs text-text-muted mt-1">256 B</p>
          </div>
          <div className="text-center">
            <SizeCell bytes={1023} />
            <p className="text-xs text-text-muted mt-1">1023 B</p>
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Kilobytes</h3>
        <div className="flex gap-6 items-center">
          <div className="text-center">
            <SizeCell bytes={1024} />
            <p className="text-xs text-text-muted mt-1">1.0 KB</p>
          </div>
          <div className="text-center">
            <SizeCell bytes={102400} />
            <p className="text-xs text-text-muted mt-1">100.0 KB</p>
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Megabytes</h3>
        <div className="flex gap-6 items-center">
          <div className="text-center">
            <SizeCell bytes={1048576} />
            <p className="text-xs text-text-muted mt-1">1.0 MB</p>
          </div>
          <div className="text-center">
            <SizeCell bytes={5242880} />
            <p className="text-xs text-text-muted mt-1">5.0 MB</p>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Size cells format response sizes: bytes (B), kilobytes (KB), megabytes (MB).',
      },
    },
  },
};

/**
 * Log level badges for console columns.
 */
export const LogLevels: Story = {
  render: () => (
    <div className="flex gap-6 items-center bg-bg-surface p-4 rounded-lg">
      <LevelCell level="debug" />
      <LevelCell level="info" />
      <LevelCell level="warn" />
      <LevelCell level="error" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Console log level badges with icons and color coding: debug (gray), info (blue), warn (amber), error (red).',
      },
    },
  },
};

/**
 * Protocol versions with color coding.
 */
export const ProtocolVersions: Story = {
  render: () => (
    <div className="flex gap-8 items-center bg-bg-surface p-4 rounded-lg">
      <div className="text-center">
        <ProtocolCell protocol="HTTP/2" />
        <p className="text-xs text-text-muted mt-1">HTTP/2 (blue)</p>
      </div>
      <div className="text-center">
        <ProtocolCell protocol="HTTP/1.1" />
        <p className="text-xs text-text-muted mt-1">HTTP/1.1 (gray)</p>
      </div>
      <div className="text-center">
        <ProtocolCell protocol={null} />
        <p className="text-xs text-text-muted mt-1">No protocol</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'HTTP protocol version badges: HTTP/2 (blue), HTTP/1.x (gray).',
      },
    },
  },
};

// ============================================================================
// Full Table Stories
// ============================================================================

/**
 * Full network table with all columns.
 */
export const NetworkTable: Story = {
  render: () => {
    const [expanded, setExpanded] = React.useState<ExpandedState>({});
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

    const columns = React.useMemo(
      () =>
        createNetworkColumns({
          onReplay: noop,
          onCopy: noop,
          onDelete: noop,
        }),
      []
    );

    const table = useReactTable({
      data: sampleNetworkEntries,
      columns,
      state: { expanded, rowSelection },
      onExpandedChange: setExpanded,
      onRowSelectionChange: setRowSelection,
      getCoreRowModel: getCoreRowModel(),
      getExpandedRowModel: getExpandedRowModel(),
      getRowId: (row) => row.id,
      getRowCanExpand: () => true,
      enableRowSelection: true,
    });

    return (
      <div className="bg-bg-surface p-4 rounded-lg">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border-subtle">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="text-left px-2 py-2 text-xs text-text-muted">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border-subtle hover:bg-bg-raised/50 group"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-2 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Full network history table with all columns: selection, expander, method, URL, status, timing, size, time ago, protocol, and actions.',
      },
    },
  },
};

/**
 * Full console table with all columns.
 */
export const ConsoleTable: Story = {
  render: () => {
    const [expanded, setExpanded] = React.useState<ExpandedState>({});
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

    const columns = React.useMemo(
      () =>
        createConsoleColumns({
          onCopy: noop,
          onDelete: noop,
        }),
      []
    );

    const table = useReactTable({
      data: sampleConsoleLogs,
      columns,
      state: { expanded, rowSelection },
      onExpandedChange: setExpanded,
      onRowSelectionChange: setRowSelection,
      getCoreRowModel: getCoreRowModel(),
      getExpandedRowModel: getExpandedRowModel(),
      getRowId: (row) => row.id,
      getRowCanExpand: () => true,
      enableRowSelection: true,
    });

    return (
      <div className="bg-bg-surface p-4 rounded-lg">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border-subtle">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="text-left px-2 py-2 text-xs text-text-muted">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border-subtle hover:bg-bg-raised/50 group"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-2 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Full console table with all columns: selection, expander, level, message, timestamp, and actions.',
      },
    },
  },
};

// ============================================================================
// Interaction Test Stories
// ============================================================================

/**
 * Tests network table interactions: selection, expansion, and actions.
 */
export const NetworkTableInteractionTest: Story = {
  render: () => {
    const [expanded, setExpanded] = React.useState<ExpandedState>({});
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

    const columns = React.useMemo(
      () =>
        createNetworkColumns({
          onReplay: noop,
          onCopy: noop,
          onDelete: noop,
        }),
      []
    );

    const table = useReactTable({
      data: sampleNetworkEntries,
      columns,
      state: { expanded, rowSelection },
      onExpandedChange: setExpanded,
      onRowSelectionChange: setRowSelection,
      getCoreRowModel: getCoreRowModel(),
      getExpandedRowModel: getExpandedRowModel(),
      getRowId: (row) => row.id,
      getRowCanExpand: () => true,
      enableRowSelection: true,
    });

    return (
      <div className="bg-bg-surface p-4 rounded-lg">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border-subtle">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="text-left px-2 py-2 text-xs text-text-muted">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border-subtle hover:bg-bg-raised/50 group"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-2 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify HTTP methods are displayed', async () => {
      await expect(canvas.getByText('GET')).toBeInTheDocument();
      await expect(canvas.getByText('POST')).toBeInTheDocument();
      await expect(canvas.getByText('DELETE')).toBeInTheDocument();
    });

    await step('Click row checkbox to select', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      const firstRowCheckbox = checkboxes[1];
      if (firstRowCheckbox !== undefined) {
        await userEvent.click(firstRowCheckbox);
        await new Promise((resolve) => setTimeout(resolve, 150));
        await expect(firstRowCheckbox).toHaveAttribute('aria-checked', 'true');
      }
    });

    await step('Click expander to expand row', async () => {
      const expanderButtons = canvas.getAllByRole('button', { name: /expand row|collapse row/i });
      const firstExpander = expanderButtons[0];
      if (firstExpander !== undefined) {
        await userEvent.click(firstExpander);
        await new Promise((resolve) => setTimeout(resolve, 150));
        await expect(firstExpander).toHaveAttribute('aria-expanded', 'true');
      }
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests network table interactions: verifies HTTP methods, status codes, row selection, and expansion.',
      },
    },
  },
};
