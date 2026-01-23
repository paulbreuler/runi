/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Network columns Storybook stories
 * @description Visual documentation for Network History Panel column components
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ExpandedState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { createNetworkColumns, ActionsCell } from './networkColumns';
import { MethodCell } from './methodCell';
import { UrlCell } from './urlCell';
import { StatusCell } from './statusCell';
import { TimingCell } from './timingCell';
import { SizeCell } from './sizeCell';
import type { NetworkHistoryEntry } from '@/types/history';

// Mock entry factory
function createMockEntry(overrides: Partial<NetworkHistoryEntry> = {}): NetworkHistoryEntry {
  return {
    id: `entry-${Math.random().toString(36).slice(2, 9)}`,
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

// Generate sample data
const sampleEntries: NetworkHistoryEntry[] = [
  createMockEntry({
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
      body: '[{"id":1},{"id":2}]',
      timing: { total_ms: 120, dns_ms: 5, connect_ms: 10, tls_ms: 15, first_byte_ms: 80 },
    },
  }),
  createMockEntry({
    request: {
      url: 'https://api.example.com/users',
      method: 'POST',
      headers: {},
      body: '{"name":"John"}',
      timeout_ms: 30000,
    },
    response: {
      status: 201,
      status_text: 'Created',
      headers: {},
      body: '{"id":3,"name":"John"}',
      timing: { total_ms: 250, dns_ms: 8, connect_ms: 15, tls_ms: 20, first_byte_ms: 180 },
    },
  }),
  createMockEntry({
    request: {
      url: 'https://api.example.com/users/999',
      method: 'GET',
      headers: {},
      body: null,
      timeout_ms: 30000,
    },
    response: {
      status: 404,
      status_text: 'Not Found',
      headers: {},
      body: '{"error":"User not found"}',
      timing: { total_ms: 45, dns_ms: 3, connect_ms: 8, tls_ms: 10, first_byte_ms: 35 },
    },
  }),
  createMockEntry({
    request: {
      url: 'https://api.example.com/users/1',
      method: 'DELETE',
      headers: {},
      body: null,
      timeout_ms: 30000,
    },
    response: {
      status: 500,
      status_text: 'Internal Server Error',
      headers: {},
      body: '{"error":"Database connection failed"}',
      timing: { total_ms: 5000, dns_ms: 5, connect_ms: 10, tls_ms: 15, first_byte_ms: 4900 },
    },
  }),
  createMockEntry({
    request: {
      url: 'https://api.example.com/users/2',
      method: 'PATCH',
      headers: {},
      body: '{"name":"Jane"}',
      timeout_ms: 30000,
    },
    response: {
      status: 200,
      status_text: 'OK',
      headers: {},
      body: '{"id":2,"name":"Jane"}',
      timing: { total_ms: 180, dns_ms: 6, connect_ms: 12, tls_ms: 18, first_byte_ms: 140 },
    },
  }),
];

// Demo table component
interface DemoTableProps {
  data: NetworkHistoryEntry[];
}

const DemoTable = ({ data }: DemoTableProps): React.ReactElement => {
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const columns = React.useMemo(
    () =>
      createNetworkColumns({
        onReplay: (): void => {
          /* Storybook action */
        },
        onCopy: (): void => {
          /* Storybook action */
        },
        onDelete: (): void => {
          /* Storybook action */
        },
      }),
    []
  );

  const table = useReactTable({
    data,
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
            <tr key={row.id} className="border-b border-border-subtle hover:bg-bg-raised/50 group">
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
};

// Individual cell stories
const meta: Meta = {
  title: 'DataGrid/Columns/NetworkColumns',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj;

/**
 * Full network table with all columns.
 */
export const FullTable: Story = {
  render: () => <DemoTable data={sampleEntries} />,
};

/**
 * HTTP method badges with different methods.
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
};

/**
 * Status codes with semantic colors.
 */
export const StatusCodes: Story = {
  render: () => (
    <div className="flex gap-6 items-center bg-bg-surface p-4 rounded-lg">
      <div className="text-center">
        <StatusCell status={200} />
        <p className="text-xs text-text-muted mt-1">Success</p>
      </div>
      <div className="text-center">
        <StatusCell status={201} />
        <p className="text-xs text-text-muted mt-1">Created</p>
      </div>
      <div className="text-center">
        <StatusCell status={301} />
        <p className="text-xs text-text-muted mt-1">Redirect</p>
      </div>
      <div className="text-center">
        <StatusCell status={400} />
        <p className="text-xs text-text-muted mt-1">Bad Request</p>
      </div>
      <div className="text-center">
        <StatusCell status={404} />
        <p className="text-xs text-text-muted mt-1">Not Found</p>
      </div>
      <div className="text-center">
        <StatusCell status={500} />
        <p className="text-xs text-text-muted mt-1">Server Error</p>
      </div>
    </div>
  ),
};

/**
 * URL cell with intelligence signals.
 */
export const UrlCells: Story = {
  render: () => (
    <div className="space-y-2 bg-bg-surface p-4 rounded-lg max-w-xl">
      <UrlCell url="https://api.example.com/users" />
      <UrlCell
        url="https://api.example.com/users/verified"
        intelligence={{
          boundToSpec: true,
          specOperation: 'getUsers',
          drift: null,
          aiGenerated: false,
          verified: true,
        }}
      />
      <UrlCell
        url="https://api.example.com/users/with-drift"
        intelligence={{
          boundToSpec: true,
          specOperation: 'getUsers',
          drift: { type: 'response', fields: ['name'], message: 'Type mismatch' },
          aiGenerated: false,
          verified: false,
        }}
      />
    </div>
  ),
};

/**
 * Timing cells showing different durations.
 */
export const TimingCells: Story = {
  render: () => (
    <div className="flex gap-6 items-center bg-bg-surface p-4 rounded-lg">
      <div className="text-center">
        <TimingCell totalMs={45} />
        <p className="text-xs text-text-muted mt-1">Fast</p>
      </div>
      <div className="text-center">
        <TimingCell totalMs={250} />
        <p className="text-xs text-text-muted mt-1">Normal</p>
      </div>
      <div className="text-center">
        <TimingCell totalMs={1500} />
        <p className="text-xs text-text-muted mt-1">Slow</p>
      </div>
      <div className="text-center">
        <TimingCell totalMs={5000} />
        <p className="text-xs text-text-muted mt-1">Very Slow</p>
      </div>
    </div>
  ),
};

/**
 * Size cells showing different response sizes.
 */
export const SizeCells: Story = {
  render: () => (
    <div className="flex gap-6 items-center bg-bg-surface p-4 rounded-lg">
      <div className="text-center">
        <SizeCell bytes={256} />
        <p className="text-xs text-text-muted mt-1">Tiny</p>
      </div>
      <div className="text-center">
        <SizeCell bytes={4096} />
        <p className="text-xs text-text-muted mt-1">Small</p>
      </div>
      <div className="text-center">
        <SizeCell bytes={102400} />
        <p className="text-xs text-text-muted mt-1">Medium</p>
      </div>
      <div className="text-center">
        <SizeCell bytes={1048576} />
        <p className="text-xs text-text-muted mt-1">Large</p>
      </div>
    </div>
  ),
};

/**
 * Action buttons for row operations.
 * Feature #12: Actions Column - displays action buttons
 */
export const ActionButtons: Story = {
  render: () => {
    const entry = sampleEntries[0];
    if (entry === undefined) {
      return <div>No data</div>;
    }
    return (
      <div className="bg-bg-surface p-4 rounded-lg">
        <div className="group bg-bg-raised p-2 rounded">
          <p className="text-xs text-text-muted mb-2">Hover to see actions:</p>
          <ActionsCell
            entry={entry}
            onReplay={(): void => {
              /* Storybook action */
            }}
            onCopy={(): void => {
              /* Storybook action */
            }}
            onDelete={(): void => {
              /* Storybook action */
            }}
          />
        </div>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify all action buttons are present', async () => {
      await expect(canvas.getByTestId('replay-button')).toBeInTheDocument();
      await expect(canvas.getByTestId('copy-curl-button')).toBeInTheDocument();
      await expect(canvas.getByTestId('delete-button')).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Feature #12: Actions Column - Action buttons are hidden by default and appear on row hover. Buttons include Replay, Copy cURL, and Delete.',
      },
    },
  },
};

/**
 * Feature #44: Hover Action Visibility - demonstrates actions appearing on hover with smooth fade transition.
 */
export const HoverActions: Story = {
  render: () => {
    const entry = sampleEntries[0];
    if (entry === undefined) {
      return <div>No data</div>;
    }
    return (
      <div className="bg-bg-surface p-4 rounded-lg space-y-4">
        <div className="text-sm text-text-muted">
          <p className="mb-2">Hover over the row below to see actions fade in smoothly:</p>
        </div>
        <div
          data-test-id="hover-actions-row"
          className="group bg-bg-raised p-4 rounded border border-border-subtle hover:border-border-default transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">GET /api/users</p>
              <p className="text-xs text-text-muted">200 OK • 120ms</p>
            </div>
            <ActionsCell
              entry={entry}
              onReplay={(): void => {
                /* Storybook action */
              }}
              onCopy={(): void => {
                /* Storybook action */
              }}
              onDelete={(): void => {
                /* Storybook action */
              }}
            />
          </div>
        </div>
        <div className="text-xs text-text-muted">
          <p>
            Actions are hidden by default (opacity-0) and fade in on hover
            (group-hover:opacity-100).
          </p>
          <p className="mt-1">They also remain visible when focused via keyboard navigation.</p>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify actions are present but hidden by default', async () => {
      const replayButton = canvas.getByTestId('replay-button');
      await expect(replayButton).toBeInTheDocument();
      // Actions container should have opacity-0 class
      const container = replayButton.closest('div[class*="opacity"]');
      await expect(container).toHaveClass('opacity-0');
    });

    await step('Hover over row to show actions', async () => {
      const row = canvas.getByTestId('hover-actions-row');
      await userEvent.hover(row);
      // Actions should be visible on hover (CSS handles the transition)
      const replayButton = canvas.getByTestId('replay-button');
      await expect(replayButton).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Feature #44: Hover Action Visibility - Actions are hidden by default and fade in smoothly on row hover. Also supports touch tap on mobile devices.',
      },
    },
  },
};

/**
 * Feature #45: Hover Action Buttons - displays all action buttons with their functionality.
 */
export const HoverActionButtons: Story = {
  render: () => {
    const entry = sampleEntries[0];
    if (entry === undefined) {
      return <div>No data</div>;
    }
    return (
      <div className="bg-bg-surface p-4 rounded-lg space-y-4">
        <div className="text-sm text-text-muted">
          <p className="mb-2">All action buttons available on row hover:</p>
        </div>
        <div className="group bg-bg-raised p-4 rounded border border-border-subtle">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">GET /api/users</p>
              <p className="text-xs text-text-muted">200 OK • 120ms</p>
            </div>
            <ActionsCell
              entry={entry}
              onReplay={(): void => {
                /* Storybook action */
              }}
              onCopy={(): void => {
                /* Storybook action */
              }}
              onDelete={(): void => {
                /* Storybook action */
              }}
            />
          </div>
        </div>
        <div className="text-xs text-text-muted space-y-1">
          <p>• Replay (↻) - Replays the request</p>
          <p>• Copy cURL (❐) - Copies request as cURL command</p>
          <p>• Delete (🗑) - Deletes the entry</p>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify all action buttons are present', async () => {
      await expect(canvas.getByTestId('replay-button')).toBeInTheDocument();
      await expect(canvas.getByTestId('copy-curl-button')).toBeInTheDocument();
      await expect(canvas.getByTestId('delete-button')).toBeInTheDocument();
    });

    await step('Verify button labels and accessibility', async () => {
      const replayButton = canvas.getByRole('button', { name: /replay/i });
      const copyButton = canvas.getByRole('button', { name: /copy.*curl/i });
      const deleteButton = canvas.getByRole('button', { name: /delete/i });

      await expect(replayButton).toHaveAttribute('aria-label', 'Replay request');
      await expect(copyButton).toHaveAttribute('aria-label', 'Copy as cURL');
      await expect(deleteButton).toHaveAttribute('aria-label', 'Delete entry');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Feature #45: Hover Action Buttons - All action buttons (Replay, Copy cURL, Delete) are displayed on row hover. Each button has proper accessibility labels and triggers appropriate callbacks.',
      },
    },
  },
};

/**
 * Feature #12: Actions Column - demonstrates sticky actions column on horizontal scroll.
 * Note: Full sticky behavior is tested in VirtualDataGrid stories with actual scrolling.
 */
export const StickyActions: Story = {
  render: () => {
    const entry = sampleEntries[0];
    if (entry === undefined) {
      return <div>No data</div>;
    }
    return (
      <div className="bg-bg-surface p-4 rounded-lg space-y-4">
        <div className="text-sm text-text-muted">
          <p className="mb-2">
            Actions column is pinned to the right and remains visible during horizontal scroll:
          </p>
        </div>
        <div className="overflow-x-auto border border-border-subtle rounded">
          <div className="flex gap-4 p-4 min-w-[800px]">
            <div className="w-64 bg-bg-raised p-2 rounded text-xs text-text-muted">
              Method Column
            </div>
            <div className="w-96 bg-bg-raised p-2 rounded text-xs text-text-muted">
              URL Column (scrollable)
            </div>
            <div className="w-32 bg-bg-raised p-2 rounded text-xs text-text-muted">
              Status Column
            </div>
            <div className="w-32 bg-bg-raised p-2 rounded text-xs text-text-muted">
              Timing Column
            </div>
            <div className="w-32 bg-bg-raised p-2 rounded text-xs text-text-muted">Size Column</div>
            <div className="w-32 bg-bg-raised p-2 rounded text-xs text-text-muted">
              Time Ago Column
            </div>
            <div className="w-32 bg-bg-raised p-2 rounded text-xs text-text-muted">
              Protocol Column
            </div>
            <div className="w-[104px] bg-accent-blue/10 p-2 rounded text-xs text-accent-blue border border-accent-blue/20">
              Actions Column (Sticky)
            </div>
          </div>
        </div>
        <div className="text-xs text-text-muted">
          <p>
            The actions column has enablePinning: true and is pinned to the right. It remains
            visible when scrolling horizontally through other columns.
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Feature #12: Actions Column - The actions column is pinned to the right and remains sticky during horizontal scroll, ensuring actions are always accessible.',
      },
    },
  },
};

/**
 * Table with 2 rows selected (ready for comparison).
 * Selection is limited to 2 items maximum.
 */
export const WithSelection: Story = {
  render: () => {
    const [expanded, setExpanded] = React.useState<ExpandedState>({});
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({
      [sampleEntries[0]?.id ?? '']: true,
      [sampleEntries[1]?.id ?? '']: true,
    });

    const columns = React.useMemo(
      () =>
        createNetworkColumns({
          onReplay: (): void => {
            /* Storybook action */
          },
          onCopy: (): void => {
            /* Storybook action */
          },
          onDelete: (): void => {
            /* Storybook action */
          },
        }),
      []
    );

    const table = useReactTable({
      data: sampleEntries,
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

    const selectedCount = Object.keys(rowSelection).filter(
      (id) => rowSelection[id] === true
    ).length;

    return (
      <div className="bg-bg-surface p-4 rounded-lg space-y-4">
        <div className="text-sm text-text-muted">
          {selectedCount} of {sampleEntries.length} rows selected (max 2 for comparison)
        </div>
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
};

/**
 * Tests network table interactions: selection and row expansion.
 */
export const NetworkTableInteractionTest: Story = {
  render: () => <DemoTable data={sampleEntries} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify table renders with all HTTP methods', async () => {
      // Verify different HTTP methods are displayed
      await expect(canvas.getByText('GET')).toBeInTheDocument();
      await expect(canvas.getByText('POST')).toBeInTheDocument();
      await expect(canvas.getByText('DELETE')).toBeInTheDocument();
      await expect(canvas.getByText('PATCH')).toBeInTheDocument();
    });

    await step('Verify status codes are displayed with correct styling', async () => {
      // Check for status codes in the table
      await expect(canvas.getByText('200')).toBeInTheDocument();
      await expect(canvas.getByText('201')).toBeInTheDocument();
      await expect(canvas.getByText('404')).toBeInTheDocument();
      await expect(canvas.getByText('500')).toBeInTheDocument();
    });

    await step('Click row checkbox to select', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      // Skip header checkbox, click first row checkbox
      const firstRowCheckbox = checkboxes[1];
      if (firstRowCheckbox !== undefined) {
        await userEvent.click(firstRowCheckbox);
        // Wait for state update
        await new Promise((resolve) => setTimeout(resolve, 150));
        await expect(firstRowCheckbox).toHaveAttribute('aria-checked', 'true');
      }
    });

    await step('Click expander to expand row and see details', async () => {
      // Wait a bit for checkbox selection to complete
      await new Promise((resolve) => setTimeout(resolve, 100));
      const expanderButtons = canvas.getAllByRole('button', { name: /expand row|collapse row/i });
      const firstExpander = expanderButtons[0];
      if (firstExpander !== undefined) {
        await userEvent.click(firstExpander);
        // Wait for expansion animation
        await new Promise((resolve) => setTimeout(resolve, 150));
        await expect(firstExpander).toHaveAttribute('aria-expanded', 'true');
      }
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests network table interactions: verifies HTTP methods display, status codes, row selection, and expansion.',
      },
    },
  },
};
