/**
 * @file Console columns Storybook stories
 * @description Visual documentation for Console Panel column components
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ExpandedState,
  type RowSelectionState,
} from '@tanstack/react-table';
import {
  createConsoleColumns,
  LevelCell,
  MessageCell,
  TimestampCell,
  ConsoleActionsCell,
} from './consoleColumns';
import type { ConsoleLog } from '@/types/console';

// Mock log factory
function createMockLog(overrides: Partial<ConsoleLog> = {}): ConsoleLog {
  return {
    id: `log-${Math.random().toString(36).slice(2, 9)}`,
    level: 'info',
    message: 'Sample log message',
    args: [],
    timestamp: Date.now(),
    ...overrides,
  };
}

// Generate sample logs
const sampleLogs: ConsoleLog[] = [
  createMockLog({
    level: 'info',
    message: 'Application started successfully',
    timestamp: Date.now() - 5000,
  }),
  createMockLog({
    level: 'debug',
    message: 'Fetching user preferences from localStorage',
    timestamp: Date.now() - 4000,
  }),
  createMockLog({
    level: 'info',
    message: 'API request to /users completed',
    args: [{ status: 200, users: 15 }],
    timestamp: Date.now() - 3000,
  }),
  createMockLog({
    level: 'warn',
    message: 'Deprecated API endpoint used: /v1/users',
    timestamp: Date.now() - 2000,
  }),
  createMockLog({
    level: 'error',
    message: 'Failed to connect to database',
    args: [{ code: 'ECONNREFUSED', host: 'localhost', port: 5432 }],
    timestamp: Date.now() - 1000,
  }),
];

// Demo table component
interface DemoTableProps {
  data: ConsoleLog[];
}

const DemoTable = ({ data }: DemoTableProps): React.ReactElement => {
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const columns = React.useMemo(
    () =>
      createConsoleColumns({
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

// Meta
const meta: Meta = {
  title: 'DataGrid/Console Columns',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj;

/**
 * Full console table with all columns.
 */
export const FullTable: Story = {
  render: () => <DemoTable data={sampleLogs} />,
};

/**
 * Log level badges with all levels.
 */
export const LevelBadges: Story = {
  render: () => (
    <div className="flex gap-6 items-center bg-bg-surface p-4 rounded-lg">
      <LevelCell level="debug" />
      <LevelCell level="info" />
      <LevelCell level="warn" />
      <LevelCell level="error" />
    </div>
  ),
};

/**
 * Message cells with different content.
 */
export const MessageCells: Story = {
  render: () => (
    <div className="space-y-3 bg-bg-surface p-4 rounded-lg max-w-xl">
      <MessageCell message="Simple log message" />
      <MessageCell message="This is a very long message that should be truncated when it exceeds the available width of the container..." />
      <MessageCell message="Repeated message" count={5} />
      <MessageCell message="Single occurrence" count={1} />
    </div>
  ),
};

/**
 * Timestamp cells showing time format.
 */
export const TimestampCells: Story = {
  render: () => {
    const now = Date.now();
    return (
      <div className="flex gap-6 items-center bg-bg-surface p-4 rounded-lg">
        <div className="text-center">
          <TimestampCell timestamp={now} />
          <p className="text-xs text-text-muted mt-1">Now</p>
        </div>
        <div className="text-center">
          <TimestampCell timestamp={now - 1000} />
          <p className="text-xs text-text-muted mt-1">1s ago</p>
        </div>
        <div className="text-center">
          <TimestampCell timestamp={now - 60000} />
          <p className="text-xs text-text-muted mt-1">1m ago</p>
        </div>
        <div className="text-center">
          <TimestampCell timestamp={now - 3600000} />
          <p className="text-xs text-text-muted mt-1">1h ago</p>
        </div>
      </div>
    );
  },
};

/**
 * Action buttons for console log operations.
 */
export const ActionButtons: Story = {
  render: () => {
    const log = sampleLogs[0];
    if (log === undefined) {
      return <div>No data</div>;
    }
    return (
      <div className="bg-bg-surface p-4 rounded-lg">
        <div className="group bg-bg-raised p-2 rounded">
          <p className="text-xs text-text-muted mb-2">Hover to see actions:</p>
          <ConsoleActionsCell
            log={log}
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
 * Error logs with visual emphasis.
 */
export const ErrorLogs: Story = {
  render: () => {
    const errorLogs = [
      createMockLog({
        level: 'error',
        message: 'TypeError: Cannot read property "id" of undefined',
        timestamp: Date.now() - 1000,
      }),
      createMockLog({
        level: 'error',
        message: 'NetworkError: Failed to fetch',
        timestamp: Date.now() - 500,
      }),
      createMockLog({
        level: 'error',
        message: 'SyntaxError: Unexpected token in JSON',
        timestamp: Date.now(),
      }),
    ];
    return <DemoTable data={errorLogs} />;
  },
};

/**
 * Mixed log levels showing filtering context.
 */
export const MixedLevels: Story = {
  render: () => <DemoTable data={sampleLogs} />,
};
