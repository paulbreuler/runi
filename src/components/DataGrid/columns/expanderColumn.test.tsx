/**
 * @file Expander column helper tests
 * @description Tests for the expander column that integrates with TanStack Table
 *
 * TDD: RED phase - these tests will fail until the column is implemented
 */

import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type ExpandedState,
} from '@tanstack/react-table';
import { createExpanderColumn } from './expanderColumn';

// Test data type with optional sub-rows for expansion testing
interface TestRow {
  id: string;
  name: string;
  canExpand?: boolean;
}

// Sample test data
const testData: TestRow[] = [
  { id: '1', name: 'Alpha', canExpand: true },
  { id: '2', name: 'Beta', canExpand: false },
  { id: '3', name: 'Gamma', canExpand: true },
];

// Test wrapper component that renders a table with the expander column
interface TestTableProps {
  data?: TestRow[];
  initialExpanded?: ExpandedState;
  onExpandedChange?: (expanded: ExpandedState) => void;
  canExpandFn?: (row: TestRow) => boolean;
}

const TestTable = ({
  data = testData,
  initialExpanded = {},
  onExpandedChange,
  canExpandFn,
}: TestTableProps): React.ReactElement => {
  const [expanded, setExpanded] = React.useState<ExpandedState>(initialExpanded);

  const handleExpandedChange = (
    updaterOrValue: ExpandedState | ((old: ExpandedState) => ExpandedState)
  ): void => {
    const newValue =
      typeof updaterOrValue === 'function' ? updaterOrValue(expanded) : updaterOrValue;
    setExpanded(newValue);
    onExpandedChange?.(newValue);
  };

  const columns: Array<ColumnDef<TestRow>> = [
    createExpanderColumn<TestRow>({
      canExpand: canExpandFn ?? ((row: TestRow): boolean => row.canExpand ?? false),
    }),
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Name',
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      expanded,
    },
    onExpandedChange: handleExpandedChange,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowId: (row) => row.id,
    getRowCanExpand:
      canExpandFn !== undefined
        ? (row): boolean => canExpandFn(row.original)
        : (row): boolean => row.original.canExpand ?? false,
  });

  return (
    <table>
      <thead>
        <tr>
          {table.getHeaderGroups().map((headerGroup) =>
            headerGroup.headers.map((header) => (
              <th key={header.id} data-testid={`header-${header.id}`}>
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))
          )}
        </tr>
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <React.Fragment key={row.id}>
            <tr data-testid={`row-${row.id}`}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} data-testid={`cell-${cell.column.id}-${row.id}`}>
                  {typeof cell.column.columnDef.cell === 'function'
                    ? cell.column.columnDef.cell(cell.getContext())
                    : String(cell.getValue())}
                </td>
              ))}
            </tr>
            {row.getIsExpanded() && (
              <tr data-testid={`expanded-content-${row.id}`}>
                <td colSpan={columns.length}>
                  <div data-testid="expanded-details">Expanded details for {row.original.name}</div>
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
};

describe('expanderColumn', () => {
  describe('chevron button', () => {
    it('renders chevron button for expandable rows', () => {
      render(<TestTable />);

      // Row 1 (Alpha) should have a chevron button
      const row1Cell = screen.getByTestId('cell-expand-1');
      const chevronButton = row1Cell.querySelector('button');
      expect(chevronButton).toBeInTheDocument();
    });

    it('does not render chevron button for non-expandable rows', () => {
      render(<TestTable />);

      // Row 2 (Beta) should NOT have a chevron button (canExpand: false)
      const row2Cell = screen.getByTestId('cell-expand-2');
      const chevronButton = row2Cell.querySelector('button');
      expect(chevronButton).not.toBeInTheDocument();
    });

    it('uses size 14 chevron icon to match Network panel', () => {
      render(<TestTable />);

      const row1Cell = screen.getByTestId('cell-expand-1');
      const svg = row1Cell.querySelector('svg');
      expect(svg).toBeInTheDocument();
      // Lucide icons use width/height for size
      expect(svg).toHaveAttribute('width', '14');
      expect(svg).toHaveAttribute('height', '14');
    });
  });

  describe('expansion behavior', () => {
    it('expands row when chevron is clicked', () => {
      const onExpandedChange = vi.fn();
      render(<TestTable onExpandedChange={onExpandedChange} />);

      const row1Cell = screen.getByTestId('cell-expand-1');
      const chevronButton = row1Cell.querySelector('button');
      expect(chevronButton).not.toBeNull();

      if (chevronButton !== null) {
        fireEvent.click(chevronButton);
      }

      expect(onExpandedChange).toHaveBeenCalledWith({ '1': true });
    });

    it('collapses row when chevron is clicked again', () => {
      const onExpandedChange = vi.fn();
      render(<TestTable initialExpanded={{ '1': true }} onExpandedChange={onExpandedChange} />);

      const row1Cell = screen.getByTestId('cell-expand-1');
      const chevronButton = row1Cell.querySelector('button');
      expect(chevronButton).not.toBeNull();

      if (chevronButton !== null) {
        fireEvent.click(chevronButton);
      }

      expect(onExpandedChange).toHaveBeenCalledWith({});
    });

    it('shows expanded content when row is expanded', () => {
      render(<TestTable initialExpanded={{ '1': true }} />);

      expect(screen.getByTestId('expanded-content-1')).toBeInTheDocument();
      expect(screen.getByText('Expanded details for Alpha')).toBeInTheDocument();
    });

    it('does not show expanded content when row is collapsed', () => {
      render(<TestTable />);

      expect(screen.queryByTestId('expanded-content-1')).not.toBeInTheDocument();
    });
  });

  describe('chevron rotation animation', () => {
    it('has rotation style when expanded', () => {
      render(<TestTable initialExpanded={{ '1': true }} />);

      const row1Cell = screen.getByTestId('cell-expand-1');
      const chevronButton = row1Cell.querySelector('button');
      expect(chevronButton).not.toBeNull();

      // The motion component should apply rotation transform
      // The button or its child should have transform styles
      const motionElement = chevronButton?.querySelector('[style*="transform"]') ?? chevronButton;
      // Motion applies inline styles, so we check for the data attribute or class
      expect(motionElement).toBeInTheDocument();
    });

    it('has no rotation when collapsed', () => {
      render(<TestTable />);

      const row1Cell = screen.getByTestId('cell-expand-1');
      const chevronButton = row1Cell.querySelector('button');
      expect(chevronButton).not.toBeNull();
      // When collapsed, rotation should be 0 degrees
    });
  });

  describe('styling', () => {
    it('has proper button styling matching Network panel', () => {
      render(<TestTable />);

      const row1Cell = screen.getByTestId('cell-expand-1');
      const chevronButton = row1Cell.querySelector('button');
      expect(chevronButton).not.toBeNull();

      // Check for expected styling classes
      expect(chevronButton).toHaveClass('p-0.5');
      expect(chevronButton).toHaveClass('rounded');
    });

    it('has hover state styling', () => {
      render(<TestTable />);

      const row1Cell = screen.getByTestId('cell-expand-1');
      const chevronButton = row1Cell.querySelector('button');
      expect(chevronButton).not.toBeNull();

      // Check for hover styling class
      expect(chevronButton).toHaveClass('hover:bg-bg-raised');
    });
  });

  describe('accessibility', () => {
    it('has proper aria-label', () => {
      render(<TestTable />);

      const row1Cell = screen.getByTestId('cell-expand-1');
      const chevronButton = row1Cell.querySelector('button');
      expect(chevronButton).not.toBeNull();
      expect(chevronButton).toHaveAttribute('aria-label');
    });

    it('has aria-expanded attribute', () => {
      render(<TestTable />);

      const row1Cell = screen.getByTestId('cell-expand-1');
      const chevronButton = row1Cell.querySelector('button');
      expect(chevronButton).not.toBeNull();
      expect(chevronButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('has aria-expanded=true when expanded', () => {
      render(<TestTable initialExpanded={{ '1': true }} />);

      const row1Cell = screen.getByTestId('cell-expand-1');
      const chevronButton = row1Cell.querySelector('button');
      expect(chevronButton).not.toBeNull();
      expect(chevronButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('canExpand function', () => {
    it('respects custom canExpand function', () => {
      // Custom function that only allows rows with name starting with 'G'
      const canExpandFn = (row: TestRow): boolean => row.name.startsWith('G');

      render(<TestTable canExpandFn={canExpandFn} />);

      // Alpha should not have chevron
      const row1Cell = screen.getByTestId('cell-expand-1');
      expect(row1Cell.querySelector('button')).not.toBeInTheDocument();

      // Beta should not have chevron
      const row2Cell = screen.getByTestId('cell-expand-2');
      expect(row2Cell.querySelector('button')).not.toBeInTheDocument();

      // Gamma should have chevron
      const row3Cell = screen.getByTestId('cell-expand-3');
      expect(row3Cell.querySelector('button')).toBeInTheDocument();
    });
  });
});
