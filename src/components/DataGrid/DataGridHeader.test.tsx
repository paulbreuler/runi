/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file DataGridHeader integration tests
 * @description Tests for mapping TanStack Table headers to DataPanelHeader
 *
 * TDD: RED phase - these tests will fail until the integration is implemented
 */

import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useReactTable, getCoreRowModel, type ColumnDef } from '@tanstack/react-table';
import { DataGridHeader } from './DataGridHeader';

// Test data type
interface TestRow {
  id: string;
  name: string;
  value: number;
}

// Sample test data
const testData: TestRow[] = [
  { id: '1', name: 'Alpha', value: 100 },
  { id: '2', name: 'Beta', value: 200 },
  { id: '3', name: 'Gamma', value: 300 },
];

// Sample column definitions
const testColumns: Array<ColumnDef<TestRow>> = [
  { id: 'name', accessorKey: 'name', header: 'Name' },
  { id: 'value', accessorKey: 'value', header: 'Value' },
];

// Test wrapper that creates a table and passes it to DataGridHeader
interface TestWrapperProps {
  showSelectAll?: boolean;
  enableRowSelection?: boolean;
  initialSelection?: Record<string, boolean>;
  onSelectAllChange?: (checked: boolean) => void;
}

const TestWrapper = ({
  showSelectAll = false,
  enableRowSelection = false,
  initialSelection = {},
  onSelectAllChange,
}: TestWrapperProps): React.ReactElement => {
  const [rowSelection, setRowSelection] = React.useState(initialSelection);

  const table = useReactTable({
    data: testData,
    columns: testColumns,
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection,
    getRowId: (row) => row.id,
  });

  return (
    <DataGridHeader
      table={table}
      showSelectAll={showSelectAll}
      onSelectAllChange={onSelectAllChange}
    />
  );
};

describe('DataGridHeader', () => {
  describe('column header rendering', () => {
    it('renders column headers from table', () => {
      render(<TestWrapper />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
    });

    it('applies proper styling to headers', () => {
      render(<TestWrapper />);

      const header = screen.getByText('Name');
      expect(header.closest('div')).toHaveClass('flex');
    });
  });

  describe('select all integration', () => {
    it('shows select all checkbox when enabled', () => {
      render(<TestWrapper showSelectAll enableRowSelection />);

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('hides select all checkbox when disabled', () => {
      render(<TestWrapper showSelectAll={false} />);

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('checkbox is unchecked when no rows selected', () => {
      render(<TestWrapper showSelectAll enableRowSelection />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    });

    it('checkbox is checked when all rows selected', () => {
      render(
        <TestWrapper
          showSelectAll
          enableRowSelection
          initialSelection={{ '1': true, '2': true, '3': true }}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('data-state', 'checked');
    });

    it('checkbox is indeterminate when some rows selected', () => {
      render(<TestWrapper showSelectAll enableRowSelection initialSelection={{ '1': true }} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
    });

    it('calls onSelectAllChange when checkbox clicked', () => {
      const onSelectAllChange = vi.fn();

      render(
        <TestWrapper showSelectAll enableRowSelection onSelectAllChange={onSelectAllChange} />
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(onSelectAllChange).toHaveBeenCalledWith(true);
    });
  });

  describe('accessibility', () => {
    it('has proper aria-label for select all checkbox', () => {
      render(<TestWrapper showSelectAll enableRowSelection />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-label');
    });
  });
});
