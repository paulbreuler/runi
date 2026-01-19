/**
 * @file Expander column Storybook stories
 * @description Visual documentation for the expander column helper
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  type ColumnDef,
  type ExpandedState,
  flexRender,
} from '@tanstack/react-table';
import { createExpanderColumn } from './expanderColumn';
import { cn } from '@/utils/cn';

// Demo data type with details for expansion
interface DemoRow {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  status: number;
  canExpand: boolean;
  details?: {
    headers: Record<string, string>;
    body?: string;
  };
}

// Sample data simulating network requests
const demoData: DemoRow[] = [
  {
    id: '1',
    name: 'Get Users',
    method: 'GET',
    url: '/api/users',
    status: 200,
    canExpand: true,
    details: {
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer xxx' },
      body: '{"users": [...]}',
    },
  },
  {
    id: '2',
    name: 'Create User',
    method: 'POST',
    url: '/api/users',
    status: 201,
    canExpand: true,
    details: {
      headers: { 'Content-Type': 'application/json' },
      body: '{"name": "John", "email": "john@example.com"}',
    },
  },
  {
    id: '3',
    name: 'Health Check',
    method: 'GET',
    url: '/health',
    status: 200,
    canExpand: false, // No details for health check
  },
  {
    id: '4',
    name: 'Update User',
    method: 'PUT',
    url: '/api/users/123',
    status: 200,
    canExpand: true,
    details: {
      headers: { 'Content-Type': 'application/json' },
      body: '{"name": "Jane"}',
    },
  },
  {
    id: '5',
    name: 'Delete User',
    method: 'DELETE',
    url: '/api/users/456',
    status: 404,
    canExpand: true,
    details: {
      headers: {},
      body: '{"error": "User not found"}',
    },
  },
];

// Method color mapping
const methodColors: Record<string, string> = {
  GET: 'text-blue-500',
  POST: 'text-green-500',
  PUT: 'text-amber-500',
  DELETE: 'text-red-500',
};

// Status color mapping
const getStatusColor = (status: number): string => {
  if (status >= 200 && status < 300) {
    return 'text-green-500';
  }
  if (status >= 400) {
    return 'text-red-500';
  }
  return 'text-text-secondary';
};

// Demo table component
interface DemoTableProps {
  initialExpanded?: ExpandedState;
}

const DemoTable = ({ initialExpanded = {} }: DemoTableProps): React.ReactElement => {
  const [expanded, setExpanded] = React.useState<ExpandedState>(initialExpanded);

  const columns: Array<ColumnDef<DemoRow>> = [
    createExpanderColumn<DemoRow>({
      canExpand: (row) => row.canExpand,
    }),
    {
      id: 'method',
      accessorKey: 'method',
      header: 'Method',
      cell: ({ getValue }) => {
        const method = getValue() as string;
        return (
          <span className={cn('font-mono text-xs font-semibold', methodColors[method])}>
            {method}
          </span>
        );
      },
    },
    {
      id: 'url',
      accessorKey: 'url',
      header: 'URL',
      cell: ({ getValue }) => <span className="font-mono text-sm">{String(getValue())}</span>,
    },
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Name',
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue() as number;
        return <span className={cn('font-mono text-sm', getStatusColor(status))}>{status}</span>;
      },
    },
  ];

  const table = useReactTable({
    data: demoData,
    columns,
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowId: (row) => row.id,
    getRowCanExpand: (row) => row.original.canExpand,
  });

  return (
    <div className="space-y-4">
      <div className="text-sm text-text-secondary">
        Click the chevron to expand rows with details. Row 3 (Health Check) has no expandable
        content.
      </div>
      <table className="min-w-full border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border-default">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
                >
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
            <React.Fragment key={row.id}>
              <tr
                className={cn(
                  'border-b border-border-default hover:bg-bg-raised transition-colors cursor-pointer',
                  row.getIsExpanded() && 'bg-bg-raised'
                )}
                onClick={() => {
                  if (row.getCanExpand()) {
                    row.toggleExpanded();
                  }
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2 text-sm text-text-primary">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
              {row.getIsExpanded() && row.original.details !== undefined && (
                <tr className="bg-bg-app">
                  <td colSpan={columns.length} className="px-8 py-3">
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs font-medium text-text-secondary uppercase">
                          Headers
                        </span>
                        <pre className="mt-1 text-xs font-mono bg-bg-raised p-2 rounded overflow-x-auto">
                          {JSON.stringify(row.original.details.headers, null, 2)}
                        </pre>
                      </div>
                      {row.original.details.body !== undefined && (
                        <div>
                          <span className="text-xs font-medium text-text-secondary uppercase">
                            Body
                          </span>
                          <pre className="mt-1 text-xs font-mono bg-bg-raised p-2 rounded overflow-x-auto">
                            {row.original.details.body}
                          </pre>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const meta: Meta<typeof DemoTable> = {
  title: 'DataGrid/Columns/ExpanderColumn',
  component: DemoTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Expander column helper for TanStack Table. Renders animated chevron buttons that rotate 90 degrees when expanded.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-bg-app p-4 rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DemoTable>;

/**
 * Default state with all rows collapsed.
 * Click the chevron or row to expand and see request details.
 */
export const Default: Story = {
  args: {},
};

/**
 * First row is pre-expanded to show the expanded state.
 */
export const WithExpanded: Story = {
  args: {
    initialExpanded: { '1': true },
  },
};

/**
 * Multiple rows are pre-expanded.
 */
export const MultipleExpanded: Story = {
  args: {
    initialExpanded: { '1': true, '2': true, '5': true },
  },
};
