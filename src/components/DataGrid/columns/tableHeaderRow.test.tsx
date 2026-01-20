/**
 * @file TableHeaderRow component tests
 * @description Tests for table header row rendering
 *
 * TDD: RED phase - these tests define the expected behavior of table headers
 */

import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import { TableHeaderRow, TableHeaderCell } from './tableHeaderRow';
import type { NetworkHistoryEntry } from '@/types/history';

// Mock entry factory
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

// Test table component
interface TestTableProps {
  data?: NetworkHistoryEntry[];
  columns?: Array<ColumnDef<NetworkHistoryEntry>>;
}

const TestTable = ({
  data = [createMockEntry()],
  columns = [
    { id: 'method', header: 'Method', accessorFn: (row) => row.request.method },
    { id: 'url', header: 'URL', accessorFn: (row) => row.request.url },
    { id: 'status', header: 'Status', accessorFn: (row) => row.response.status },
  ],
}: TestTableProps): React.ReactElement => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableHeaderRow key={headerGroup.id} headerGroup={headerGroup} />
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

describe('TableHeaderRow', () => {
  it('renders all column headers', () => {
    render(<TestTable />);

    const methodHeader = screen.getByRole('columnheader', { name: /method/i });
    expect(methodHeader).toBeInTheDocument();

    const urlHeader = screen.getByRole('columnheader', { name: /^url$/i });
    expect(urlHeader).toBeInTheDocument();

    const statusHeader = screen.getByRole('columnheader', { name: /status/i });
    expect(statusHeader).toBeInTheDocument();
  });

  it('renders headers with uppercase styling', () => {
    render(<TestTable />);

    const headers = screen.getAllByRole('columnheader');
    headers.forEach((header) => {
      expect(header).toHaveClass('uppercase');
    });
  });

  it('renders headers with proper spacing classes', () => {
    render(<TestTable />);

    const methodHeader = screen.getByRole('columnheader', { name: /method/i });
    expect(methodHeader).toHaveClass('px-3', 'py-2');
  });

  it('applies sticky positioning when getHeaderStyle is provided', () => {
    const TestTableWithSticky = (): React.ReactElement => {
      const data = [createMockEntry()];
      const columns: Array<ColumnDef<NetworkHistoryEntry>> = [
        { id: 'method', header: 'Method', accessorFn: (row) => row.request.method },
      ];

      const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row) => row.id,
      });

      return (
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableHeaderRow
                key={headerGroup.id}
                headerGroup={headerGroup}
                getHeaderStyle={() => ({
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                })}
              />
            ))}
          </thead>
        </table>
      );
    };

    render(<TestTableWithSticky />);

    const header = screen.getByRole('columnheader', { name: /method/i });
    expect(header).toHaveStyle({ position: 'sticky', top: '0px', zIndex: '10' });
  });

  it('renders headers with correct text styling', () => {
    render(<TestTable />);

    const headers = screen.getAllByRole('columnheader');
    headers.forEach((header) => {
      expect(header).toHaveClass('text-xs', 'font-medium', 'text-text-secondary');
    });
  });

  it('renders headers with border', () => {
    render(<TestTable />);

    const headers = screen.getAllByRole('columnheader');
    headers.forEach((header) => {
      expect(header).toHaveClass('border-b', 'border-border-default');
    });
  });
});

describe('TableHeaderCell', () => {
  it('renders header cell with placeholder handling', () => {
    const TestCell = (): React.ReactElement => {
      const data = [createMockEntry()];
      const columns: Array<ColumnDef<NetworkHistoryEntry>> = [
        { id: 'method', header: 'Method', accessorFn: (row) => row.request.method },
      ];

      const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row) => row.id,
      });

      const headerGroup = table.getHeaderGroups()[0];
      if (headerGroup === undefined) {
        return <div>No headers</div>;
      }

      const header = headerGroup.headers[0];
      if (header === undefined) {
        return <div>No header</div>;
      }

      return (
        <table>
          <thead>
            <tr>
              <TableHeaderCell<NetworkHistoryEntry> header={header} paddingClass="px-3 py-2" />
            </tr>
          </thead>
        </table>
      );
    };

    render(<TestCell />);

    const header = screen.getByRole('columnheader', { name: /method/i });
    expect(header).toBeInTheDocument();
  });
});
