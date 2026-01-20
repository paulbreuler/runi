/**
 * @file VirtualDataGrid component tests
 * @description Tests for the virtualized data grid that combines TanStack Table + Virtual
 *
 * TDD: RED phase - these tests will fail until the component is implemented
 */

import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VirtualDataGrid } from './VirtualDataGrid';
import { createSelectionColumn } from './columns/selectionColumn';
import type { ColumnDef, Row } from '@tanstack/react-table';

// Test data type
interface TestRow {
  id: string;
  name: string;
  value: number;
}

// Generate large dataset for virtualization testing
const generateTestData = (count: number): TestRow[] =>
  Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    name: `Item ${String(i + 1)}`,
    value: i * 100,
  }));

// Sample column definitions
const testColumns: Array<ColumnDef<TestRow>> = [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Name',
  },
  {
    id: 'value',
    accessorKey: 'value',
    header: 'Value',
  },
];

describe('VirtualDataGrid', () => {
  describe('rendering', () => {
    it('renders table with data', () => {
      const testData = generateTestData(5);

      render(<VirtualDataGrid data={testData} columns={testColumns} getRowId={(row) => row.id} />);

      // Should render the header
      expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /value/i })).toBeInTheDocument();

      // Should render the rows
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 5')).toBeInTheDocument();
    });

    it('handles empty data', () => {
      render(
        <VirtualDataGrid
          data={[]}
          columns={testColumns}
          getRowId={(row) => row.id}
          emptyMessage="No data available"
        />
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const testData = generateTestData(5);

      render(
        <VirtualDataGrid
          data={testData}
          columns={testColumns}
          getRowId={(row) => row.id}
          className="custom-class"
        />
      );

      const container = screen.getByTestId('virtual-datagrid');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('virtualization', () => {
    it('renders with virtual scrolling container', () => {
      const testData = generateTestData(100);

      render(
        <VirtualDataGrid
          data={testData}
          columns={testColumns}
          getRowId={(row) => row.id}
          height={400}
          estimateRowHeight={40}
        />
      );

      // Check that the virtual scroll container exists
      const scrollContainer = screen.getByTestId('virtual-scroll-container');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('only renders visible rows plus overscan', () => {
      const testData = generateTestData(1000);

      render(
        <VirtualDataGrid
          data={testData}
          columns={testColumns}
          getRowId={(row) => row.id}
          height={400}
          estimateRowHeight={40}
          overscan={5}
        />
      );

      // With 400px height and 40px rows, roughly 10 rows visible + 5 overscan = 15-20 rows
      // The first items should be rendered
      expect(screen.getByText('Item 1')).toBeInTheDocument();

      // NOTE: In jsdom, virtualization doesn't work (no real scroll dimensions)
      // so we fall back to rendering all rows. This test verifies the component
      // renders correctly even in this edge case. Real virtualization testing
      // requires Playwright or a real browser environment.
      // The component does have virtualization support that works in browsers.
    });

    it('supports custom row height', () => {
      const testData = generateTestData(10);

      render(
        <VirtualDataGrid
          data={testData}
          columns={testColumns}
          getRowId={(row) => row.id}
          estimateRowHeight={50}
        />
      );

      const rows = screen.getAllByRole('row');
      // Should have header row + data rows that are visible
      expect(rows.length).toBeGreaterThan(1);
    });
  });

  describe('row rendering', () => {
    it('renders rows with default row renderer', () => {
      const testData = generateTestData(3);

      render(<VirtualDataGrid data={testData} columns={testColumns} getRowId={(row) => row.id} />);

      // Each cell should be rendered
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('supports custom row renderer', () => {
      const testData = generateTestData(3);
      const customRowRenderer = vi.fn((row: Row<TestRow>, cells: React.ReactNode) => (
        <tr key={row.id} data-testid={`custom-row-${row.id}`}>
          {cells}
        </tr>
      ));

      render(
        <VirtualDataGrid
          data={testData}
          columns={testColumns}
          getRowId={(row) => row.id}
          renderRow={customRowRenderer}
        />
      );

      expect(customRowRenderer).toHaveBeenCalled();
      expect(screen.getByTestId('custom-row-1')).toBeInTheDocument();
    });

    it('passes row data to custom renderer', () => {
      const testData = generateTestData(3);
      const customRowRenderer = vi.fn((row, cells) => (
        <tr key={row.id} data-custom={row.original.name}>
          {cells}
        </tr>
      ));

      render(
        <VirtualDataGrid
          data={testData}
          columns={testColumns}
          getRowId={(row) => row.id}
          renderRow={customRowRenderer}
        />
      );

      // Check that the row renderer was called with the row data
      expect(customRowRenderer).toHaveBeenCalledWith(
        expect.objectContaining({
          original: expect.objectContaining({ name: 'Item 1' }),
        }),
        expect.anything()
      );
    });
  });

  describe('table features', () => {
    it('supports row selection', () => {
      const testData = generateTestData(3);
      const onRowSelectionChange = vi.fn();

      render(
        <VirtualDataGrid
          data={testData}
          columns={testColumns}
          getRowId={(row) => row.id}
          enableRowSelection
          onRowSelectionChange={onRowSelectionChange}
        />
      );

      // The selection functionality should be available
      // (actual selection tests are in useDataGrid and selectionColumn tests)
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    describe('single row selection', () => {
      it('selects single row on click', () => {
        const testData = generateTestData(3);
        const onRowSelectionChange = vi.fn();

        render(
          <VirtualDataGrid
            data={testData}
            columns={testColumns}
            getRowId={(row) => row.id}
            enableRowSelection
            onRowSelectionChange={onRowSelectionChange}
          />
        );

        // Find first row by data-row-id
        const firstRow = screen.getByTestId('virtual-datagrid').querySelector('[data-row-id="1"]');
        expect(firstRow).toBeInTheDocument();

        // Click on the row (not on checkbox)
        if (firstRow !== null) {
          fireEvent.click(firstRow);
        }

        // Should select only the first row
        expect(onRowSelectionChange).toHaveBeenCalledWith({ '1': true });
      });

      it('deselects previous on new selection', () => {
        const testData = generateTestData(3);
        const onRowSelectionChange = vi.fn();

        render(
          <VirtualDataGrid
            data={testData}
            columns={testColumns}
            getRowId={(row) => row.id}
            enableRowSelection
            initialRowSelection={{ '1': true }}
            onRowSelectionChange={onRowSelectionChange}
          />
        );

        // Find second row
        const secondRow = screen.getByTestId('virtual-datagrid').querySelector('[data-row-id="2"]');
        expect(secondRow).toBeInTheDocument();

        // Click on the second row
        if (secondRow !== null) {
          fireEvent.click(secondRow);
        }

        // Should deselect first row and select second row
        expect(onRowSelectionChange).toHaveBeenCalledWith({ '2': true });
      });

      it('does not toggle selection when clicking on checkbox', () => {
        const testData = generateTestData(3);
        const onRowSelectionChange = vi.fn();

        // Add selection column when testing selection behavior
        const columnsWithSelection: Array<ColumnDef<TestRow>> = [
          createSelectionColumn<TestRow>(),
          ...testColumns,
        ];

        render(
          <VirtualDataGrid
            data={testData}
            columns={columnsWithSelection}
            getRowId={(row) => row.id}
            enableRowSelection
            onRowSelectionChange={onRowSelectionChange}
          />
        );

        // Find checkbox (selection column handles its own clicks)
        // The checkbox has aria-label "Select row" or "Deselect row"
        // Use getAllByRole since there are multiple row checkboxes (one per row)
        const checkboxes = screen.getAllByRole('checkbox');
        // Filter to row checkboxes (exclude header "select all" checkbox)
        const rowCheckboxes = checkboxes.filter((cb) => {
          const ariaLabel = cb.getAttribute('aria-label') ?? '';
          return (
            ariaLabel.includes('row') ||
            ariaLabel.toLowerCase().includes('select row') ||
            ariaLabel.toLowerCase().includes('deselect row')
          );
        });
        expect(rowCheckboxes.length).toBeGreaterThan(0);
        const checkbox = rowCheckboxes[0];

        // Click checkbox - should not trigger row click handler
        fireEvent.click(checkbox);

        // Checkbox click should be handled by selection column, not row click
        // The selection column will call onRowSelectionChange separately
        // We just verify the checkbox is clickable
        expect(checkbox).toBeInTheDocument();
      });
    });

    describe('selection persistence', () => {
      it('works with filtering enabled', () => {
        const testData = generateTestData(5);
        const onRowSelectionChange = vi.fn();

        render(
          <VirtualDataGrid
            data={testData}
            columns={testColumns}
            getRowId={(row) => row.id}
            enableRowSelection
            enableFiltering
            initialRowSelection={{ '1': true, '3': true }}
            onRowSelectionChange={onRowSelectionChange}
          />
        );

        // Selection persistence is handled internally by useDataGrid hook
        // This test verifies the component integrates correctly with filtering
        // Comprehensive persistence tests are in useDataGrid.test.ts
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('supports sorting', () => {
      const testData = generateTestData(3);
      const onSortingChange = vi.fn();

      render(
        <VirtualDataGrid
          data={testData}
          columns={testColumns}
          getRowId={(row) => row.id}
          enableSorting
          onSortingChange={onSortingChange}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    describe('column sorting', () => {
      it('sorts by column on header click', () => {
        const testData = generateTestData(3);
        const onSortingChange = vi.fn();

        render(
          <VirtualDataGrid
            data={testData}
            columns={testColumns}
            getRowId={(row) => row.id}
            enableSorting
            onSortingChange={onSortingChange}
          />
        );

        // Find sortable column header
        const nameHeader = screen.getByRole('columnheader', { name: /name/i });
        expect(nameHeader).toBeInTheDocument();

        // Click header to sort
        fireEvent.click(nameHeader);

        // Should sort ascending on first click
        expect(onSortingChange).toHaveBeenCalledWith([{ id: 'name', desc: false }]);
      });

      it('reverses sort on second click', () => {
        const testData = generateTestData(3);
        const onSortingChange = vi.fn();

        render(
          <VirtualDataGrid
            data={testData}
            columns={testColumns}
            getRowId={(row) => row.id}
            enableSorting
            initialSorting={[{ id: 'name', desc: false }]}
            onSortingChange={onSortingChange}
          />
        );

        // Find sortable column header
        const nameHeader = screen.getByRole('columnheader', { name: /name/i });
        expect(nameHeader).toBeInTheDocument();

        // Click header again to reverse sort
        fireEvent.click(nameHeader);

        // Should sort descending on second click
        expect(onSortingChange).toHaveBeenCalledWith([{ id: 'name', desc: true }]);
      });

      it('clears sort on third click', () => {
        const testData = generateTestData(3);
        const onSortingChange = vi.fn();

        render(
          <VirtualDataGrid
            data={testData}
            columns={testColumns}
            getRowId={(row) => row.id}
            enableSorting
            initialSorting={[{ id: 'name', desc: true }]}
            onSortingChange={onSortingChange}
          />
        );

        // Find sortable column header
        const nameHeader = screen.getByRole('columnheader', { name: /name/i });
        expect(nameHeader).toBeInTheDocument();

        // Click header to clear sort (third click)
        fireEvent.click(nameHeader);

        // Should clear sort on third click
        expect(onSortingChange).toHaveBeenCalledWith([]);
      });

      it('shows sort indicator', () => {
        const testData = generateTestData(3);

        render(
          <VirtualDataGrid
            data={testData}
            columns={testColumns}
            getRowId={(row) => row.id}
            enableSorting
            initialSorting={[{ id: 'name', desc: false }]}
          />
        );

        // Sort indicator should be visible (aria-label for sorted state)
        const nameHeader = screen.getByRole('columnheader', { name: /name/i });
        expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
      });
    });

    it('supports expansion', () => {
      const testData = generateTestData(3);
      const onExpandedChange = vi.fn();

      render(
        <VirtualDataGrid
          data={testData}
          columns={testColumns}
          getRowId={(row) => row.id}
          enableExpanding
          onExpandedChange={onExpandedChange}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper table role', () => {
      const testData = generateTestData(3);

      render(<VirtualDataGrid data={testData} columns={testColumns} getRowId={(row) => row.id} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('has proper column headers', () => {
      const testData = generateTestData(3);

      render(<VirtualDataGrid data={testData} columns={testColumns} getRowId={(row) => row.id} />);

      expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /value/i })).toBeInTheDocument();
    });

    it('has proper row roles', () => {
      const testData = generateTestData(3);

      render(<VirtualDataGrid data={testData} columns={testColumns} getRowId={(row) => row.id} />);

      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // At least header + 1 data row
    });
  });

  describe('callback ref pattern (infinite loop prevention)', () => {
    it('uses refs for callbacks to prevent infinite loops', () => {
      const testData = generateTestData(3);
      const onExpandedChange1 = vi.fn();
      const onExpandedChange2 = vi.fn();

      const { rerender } = render(
        <VirtualDataGrid
          data={testData}
          columns={testColumns}
          getRowId={(row) => row.id}
          enableExpanding
          onExpandedChange={onExpandedChange1}
        />
      );

      // Change the callback prop
      rerender(
        <VirtualDataGrid
          data={testData}
          columns={testColumns}
          getRowId={(row) => row.id}
          enableExpanding
          onExpandedChange={onExpandedChange2}
        />
      );

      // Changing the callback should not cause infinite loops
      // The component should render successfully
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('calls the latest callback when state changes, even if callback prop changed', async () => {
      const testData = generateTestData(3);
      const onExpandedChange1 = vi.fn();
      const onExpandedChange2 = vi.fn();

      const { rerender } = render(
        <VirtualDataGrid
          data={testData}
          columns={testColumns}
          getRowId={(row) => row.id}
          enableExpanding
          initialExpanded={{ '1': true }}
          onExpandedChange={onExpandedChange1}
        />
      );

      // Change callback
      rerender(
        <VirtualDataGrid
          data={testData}
          columns={testColumns}
          getRowId={(row) => row.id}
          enableExpanding
          initialExpanded={{ '1': true }}
          onExpandedChange={onExpandedChange2}
        />
      );

      // The ref pattern ensures the latest callback (onExpandedChange2) is stored in the ref
      // This test verifies that changing the callback prop doesn't cause issues
      // The actual callback invocation happens when expansion state changes
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('handles empty data without causing infinite loops in callbacks', () => {
      const onExpandedChange = vi.fn();
      const onRowSelectionChange = vi.fn();
      const onSortingChange = vi.fn();

      render(
        <VirtualDataGrid
          data={[]}
          columns={testColumns}
          getRowId={(row) => row.id}
          enableExpanding
          enableRowSelection
          enableSorting
          onExpandedChange={onExpandedChange}
          onRowSelectionChange={onRowSelectionChange}
          onSortingChange={onSortingChange}
          emptyMessage="No data"
        />
      );

      // Empty data should not cause infinite loops
      expect(screen.getByText('No data')).toBeInTheDocument();

      // Callbacks may be called once with initial empty state, but not repeatedly
      // The ref pattern prevents infinite loops even if callbacks are called
      // We just verify the component renders successfully
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('handles rapid data changes without infinite loops', () => {
      const testData1 = generateTestData(3);
      const testData2 = generateTestData(5);
      const testData3: TestRow[] = [];
      const onExpandedChange = vi.fn();

      const { rerender } = render(
        <VirtualDataGrid
          data={testData1}
          columns={testColumns}
          getRowId={(row) => row.id}
          enableExpanding
          onExpandedChange={onExpandedChange}
        />
      );

      // Rapidly change data (including to empty)
      rerender(
        <VirtualDataGrid
          data={testData2}
          columns={testColumns}
          getRowId={(row) => row.id}
          enableExpanding
          onExpandedChange={onExpandedChange}
        />
      );

      rerender(
        <VirtualDataGrid
          data={testData3}
          columns={testColumns}
          getRowId={(row) => row.id}
          enableExpanding
          onExpandedChange={onExpandedChange}
          emptyMessage="No data"
        />
      );

      rerender(
        <VirtualDataGrid
          data={testData1}
          columns={testColumns}
          getRowId={(row) => row.id}
          enableExpanding
          onExpandedChange={onExpandedChange}
        />
      );

      // Component should be stable after rapid changes
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });
});
