/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file TableHeaderRow Storybook stories
 * @description Visual documentation for table header row component
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useReactTable, getCoreRowModel, type ColumnDef } from '@tanstack/react-table';
import { TableHeaderRow } from './tableHeaderRow';
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

// Demo table component
interface DemoTableProps {
  data: NetworkHistoryEntry[];
  columns: Array<ColumnDef<NetworkHistoryEntry>>;
  sticky?: boolean;
}

const DemoTable = ({ data, columns, sticky = false }: DemoTableProps): React.ReactElement => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <div className="bg-bg-surface p-4 rounded-lg">
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableHeaderRow
              key={headerGroup.id}
              headerGroup={headerGroup}
              getHeaderStyle={
                sticky
                  ? () => ({
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                    })
                  : undefined
              }
            />
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-border-subtle">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2">
                  {String(cell.getValue())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const meta: Meta = {
  title: 'DataGrid/Columns/TableHeaderRow',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj;

/**
 * Header row with all network columns.
 */
export const Headers: Story = {
  render: () => {
    const data = [createMockEntry()];
    const columns: Array<ColumnDef<NetworkHistoryEntry>> = [
      { id: 'method', header: 'Method', accessorFn: (row) => row.request.method },
      { id: 'url', header: 'URL', accessorFn: (row) => row.request.url },
      { id: 'status', header: 'Status', accessorFn: (row) => row.response.status },
      {
        id: 'time',
        header: 'Time',
        accessorFn: (row) => `${String(row.response.timing.total_ms)}ms`,
      },
      { id: 'size', header: 'Size', accessorFn: (row) => row.response.body.length },
      { id: 'when', header: 'When', accessorFn: (row) => row.timestamp },
    ];

    return <DemoTable data={data} columns={columns} />;
  },
};

/**
 * Headers with sticky positioning remain visible on scroll.
 * Scroll the table to see headers stay at the top.
 */
export const StickyHeaders: Story = {
  render: () => {
    const data = Array.from({ length: 20 }, () => createMockEntry());
    const columns: Array<ColumnDef<NetworkHistoryEntry>> = [
      { id: 'method', header: 'Method', accessorFn: (row) => row.request.method },
      { id: 'url', header: 'URL', accessorFn: (row) => row.request.url },
      { id: 'status', header: 'Status', accessorFn: (row) => row.response.status },
      {
        id: 'time',
        header: 'Time',
        accessorFn: (row) => `${String(row.response.timing.total_ms)}ms`,
      },
    ];

    return (
      <div className="h-96 overflow-auto border border-border-subtle rounded">
        <DemoTable data={data} columns={columns} sticky />
      </div>
    );
  },
};

/**
 * Headers with all network history columns.
 */
export const AllColumns: Story = {
  render: () => {
    const data = [createMockEntry()];
    const columns: Array<ColumnDef<NetworkHistoryEntry>> = [
      { id: 'select', header: '', accessorFn: () => '' },
      { id: 'expand', header: '', accessorFn: () => '' },
      { id: 'method', header: 'Method', accessorFn: (row) => row.request.method },
      { id: 'url', header: 'URL', accessorFn: (row) => row.request.url },
      { id: 'status', header: 'Status', accessorFn: (row) => row.response.status },
      {
        id: 'time',
        header: 'Time',
        accessorFn: (row) => `${String(row.response.timing.total_ms)}ms`,
      },
      { id: 'size', header: 'Size', accessorFn: (row) => row.response.body.length },
      { id: 'when', header: 'When', accessorFn: (row) => row.timestamp },
      { id: 'actions', header: 'Actions', accessorFn: () => '' },
    ];

    return <DemoTable data={data} columns={columns} />;
  },
};
