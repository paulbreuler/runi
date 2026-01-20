/**
 * @file Network columns Storybook stories
 * @description Visual documentation for Network History Panel column components
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
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
  title: 'DataGrid/Network Columns',
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
