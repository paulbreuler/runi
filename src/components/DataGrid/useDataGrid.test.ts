/**
 * @file useDataGrid hook tests
 * @description Tests for the base useDataGrid hook that wraps TanStack Table
 *
 * TDD: RED phase - these tests will fail until the hook is implemented
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useDataGrid } from './useDataGrid';
import type { ColumnDef } from '@tanstack/react-table';

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

describe('useDataGrid', () => {
  describe('table instance', () => {
    it('returns a table instance with data', () => {
      const { result } = renderHook(() =>
        useDataGrid({
          data: testData,
          columns: testColumns,
        })
      );

      expect(result.current.table).toBeDefined();
      expect(result.current.table.getRowModel().rows).toHaveLength(3);
    });

    it('returns table instance with getCoreRowModel', () => {
      const { result } = renderHook(() =>
        useDataGrid({
          data: testData,
          columns: testColumns,
        })
      );

      const coreModel = result.current.table.getCoreRowModel();
      expect(coreModel.rows).toHaveLength(3);
      const firstRow = coreModel.rows[0];
      expect(firstRow).toBeDefined();
      expect(firstRow?.original).toEqual(testData[0]);
    });

    it('handles empty data array', () => {
      const { result } = renderHook(() =>
        useDataGrid({
          data: [],
          columns: testColumns,
        })
      );

      expect(result.current.table.getRowModel().rows).toHaveLength(0);
    });

    it('updates when data changes', () => {
      const { result, rerender } = renderHook(
        ({ data }) =>
          useDataGrid({
            data,
            columns: testColumns,
          }),
        { initialProps: { data: testData } }
      );

      expect(result.current.table.getRowModel().rows).toHaveLength(3);

      const newData = [...testData, { id: '4', name: 'Delta', value: 400 }];
      rerender({ data: newData });

      expect(result.current.table.getRowModel().rows).toHaveLength(4);
    });
  });

  describe('column definitions', () => {
    it('handles column definitions with accessorKey', () => {
      const { result } = renderHook(() =>
        useDataGrid({
          data: testData,
          columns: testColumns,
        })
      );

      const columns = result.current.table.getAllColumns();
      expect(columns).toHaveLength(2);
      const col0 = columns[0];
      const col1 = columns[1];
      expect(col0).toBeDefined();
      expect(col1).toBeDefined();
      expect(col0?.id).toBe('name');
      expect(col1?.id).toBe('value');
    });

    it('handles column definitions with accessorFn', () => {
      const columnsWithFn: Array<ColumnDef<TestRow>> = [
        {
          id: 'combined',
          accessorFn: (row) => `${row.name}: ${String(row.value)}`,
          header: 'Combined',
        },
      ];

      const { result } = renderHook(() =>
        useDataGrid({
          data: testData,
          columns: columnsWithFn,
        })
      );

      const row = result.current.table.getRowModel().rows[0];
      expect(row).toBeDefined();
      expect(row?.getValue('combined')).toBe('Alpha: 100');
    });

    it('updates when columns change', () => {
      const { result, rerender } = renderHook(
        ({ columns }) =>
          useDataGrid({
            data: testData,
            columns,
          }),
        { initialProps: { columns: testColumns } }
      );

      expect(result.current.table.getAllColumns()).toHaveLength(2);

      const newColumns: Array<ColumnDef<TestRow>> = [{ id: 'id', accessorKey: 'id', header: 'ID' }];
      rerender({ columns: newColumns });

      expect(result.current.table.getAllColumns()).toHaveLength(1);
    });
  });

  describe('sorting state', () => {
    it('supports sorting when enabled', () => {
      const { result } = renderHook(() =>
        useDataGrid({
          data: testData,
          columns: testColumns,
          enableSorting: true,
        })
      );

      expect(result.current.sorting).toEqual([]);
      expect(typeof result.current.setSorting).toBe('function');
    });

    it('applies initial sorting state', () => {
      const { result } = renderHook(() =>
        useDataGrid({
          data: testData,
          columns: testColumns,
          enableSorting: true,
          initialSorting: [{ id: 'value', desc: true }],
        })
      );

      expect(result.current.sorting).toEqual([{ id: 'value', desc: true }]);
    });

    it('sorts rows when sorting state changes', () => {
      const { result } = renderHook(() =>
        useDataGrid({
          data: testData,
          columns: testColumns,
          enableSorting: true,
        })
      );

      // Initially unsorted
      const initialRows = result.current.table.getRowModel().rows;
      const firstInitialRow = initialRows[0];
      expect(firstInitialRow).toBeDefined();
      expect(firstInitialRow?.original.name).toBe('Alpha');

      // Apply descending sort on value
      act(() => {
        result.current.setSorting([{ id: 'value', desc: true }]);
      });

      const sortedRows = result.current.table.getRowModel().rows;
      const firstSorted = sortedRows[0];
      const lastSorted = sortedRows[2];
      expect(firstSorted).toBeDefined();
      expect(lastSorted).toBeDefined();
      expect(firstSorted?.original.name).toBe('Gamma'); // Highest value first
      expect(lastSorted?.original.name).toBe('Alpha'); // Lowest value last
    });
  });

  describe('filtering state', () => {
    it('supports column filtering when enabled', () => {
      const { result } = renderHook(() =>
        useDataGrid({
          data: testData,
          columns: testColumns,
          enableFiltering: true,
        })
      );

      expect(result.current.columnFilters).toEqual([]);
      expect(typeof result.current.setColumnFilters).toBe('function');
    });

    it('supports global filtering when enabled', () => {
      const { result } = renderHook(() =>
        useDataGrid({
          data: testData,
          columns: testColumns,
          enableFiltering: true,
        })
      );

      expect(result.current.globalFilter).toBe('');
      expect(typeof result.current.setGlobalFilter).toBe('function');
    });

    it('filters rows when global filter changes', () => {
      const { result } = renderHook(() =>
        useDataGrid({
          data: testData,
          columns: testColumns,
          enableFiltering: true,
        })
      );

      expect(result.current.table.getRowModel().rows).toHaveLength(3);

      act(() => {
        result.current.setGlobalFilter('Beta');
      });

      expect(result.current.table.getRowModel().rows).toHaveLength(1);
      const filteredRow = result.current.table.getRowModel().rows[0];
      expect(filteredRow).toBeDefined();
      expect(filteredRow?.original.name).toBe('Beta');
    });

    it('filters rows when column filter changes', () => {
      const { result } = renderHook(() =>
        useDataGrid({
          data: testData,
          columns: testColumns,
          enableFiltering: true,
        })
      );

      act(() => {
        result.current.setColumnFilters([{ id: 'name', value: 'Alpha' }]);
      });

      expect(result.current.table.getRowModel().rows).toHaveLength(1);
      const filteredRow = result.current.table.getRowModel().rows[0];
      expect(filteredRow).toBeDefined();
      expect(filteredRow?.original.name).toBe('Alpha');
    });
  });

  describe('selection state', () => {
    it('supports row selection when enabled', () => {
      const { result } = renderHook(() =>
        useDataGrid({
          data: testData,
          columns: testColumns,
          enableRowSelection: true,
          getRowId: (row) => row.id,
        })
      );

      expect(result.current.rowSelection).toEqual({});
      expect(typeof result.current.setRowSelection).toBe('function');
    });

    it('applies initial row selection state', () => {
      const { result } = renderHook(() =>
        useDataGrid({
          data: testData,
          columns: testColumns,
          enableRowSelection: true,
          getRowId: (row) => row.id,
          initialRowSelection: { '1': true, '2': true },
        })
      );

      expect(result.current.rowSelection).toEqual({ '1': true, '2': true });
    });

    it('selects row when row selection changes', () => {
      const { result } = renderHook(() =>
        useDataGrid({
          data: testData,
          columns: testColumns,
          enableRowSelection: true,
          getRowId: (row) => row.id,
        })
      );

      act(() => {
        result.current.setRowSelection({ '1': true });
      });

      expect(result.current.rowSelection).toEqual({ '1': true });
      expect(result.current.table.getSelectedRowModel().rows).toHaveLength(1);
      const selectedRow = result.current.table.getSelectedRowModel().rows[0];
      expect(selectedRow).toBeDefined();
      expect(selectedRow?.id).toBe('1');
    });

    it('selects all rows via table API', () => {
      const { result } = renderHook(() =>
        useDataGrid({
          data: testData,
          columns: testColumns,
          enableRowSelection: true,
          getRowId: (row) => row.id,
        })
      );

      act(() => {
        result.current.table.toggleAllRowsSelected(true);
      });

      expect(result.current.table.getSelectedRowModel().rows).toHaveLength(3);
    });

    it('deselects all rows via table API', () => {
      const { result } = renderHook(() =>
        useDataGrid({
          data: testData,
          columns: testColumns,
          enableRowSelection: true,
          getRowId: (row) => row.id,
          initialRowSelection: { '1': true, '2': true, '3': true },
        })
      );

      expect(result.current.table.getSelectedRowModel().rows).toHaveLength(3);

      act(() => {
        result.current.table.toggleAllRowsSelected(false);
      });

      expect(result.current.table.getSelectedRowModel().rows).toHaveLength(0);
    });

    it('reports correct isAllRowsSelected state', () => {
      const { result } = renderHook(() =>
        useDataGrid({
          data: testData,
          columns: testColumns,
          enableRowSelection: true,
          getRowId: (row) => row.id,
        })
      );

      expect(result.current.table.getIsAllRowsSelected()).toBe(false);
      expect(result.current.table.getIsSomeRowsSelected()).toBe(false);

      act(() => {
        result.current.setRowSelection({ '1': true });
      });

      expect(result.current.table.getIsAllRowsSelected()).toBe(false);
      expect(result.current.table.getIsSomeRowsSelected()).toBe(true);

      act(() => {
        result.current.setRowSelection({ '1': true, '2': true, '3': true });
      });

      expect(result.current.table.getIsAllRowsSelected()).toBe(true);
    });
  });

  describe('expansion state', () => {
    it('supports row expansion when enabled', () => {
      const { result } = renderHook(() =>
        useDataGrid({
          data: testData,
          columns: testColumns,
          enableExpanding: true,
          getRowId: (row) => row.id,
        })
      );

      expect(result.current.expanded).toEqual({});
      expect(typeof result.current.setExpanded).toBe('function');
    });

    it('expands row when expansion state changes', () => {
      const { result } = renderHook(() =>
        useDataGrid({
          data: testData,
          columns: testColumns,
          enableExpanding: true,
          getRowId: (row) => row.id,
        })
      );

      act(() => {
        result.current.setExpanded({ '1': true });
      });

      expect(result.current.expanded).toEqual({ '1': true });
      const firstRow = result.current.table.getRowModel().rows[0];
      expect(firstRow).toBeDefined();
      expect(firstRow?.getIsExpanded()).toBe(true);
    });
  });

  describe('getRowId', () => {
    it('uses custom getRowId function', () => {
      const { result } = renderHook(() =>
        useDataGrid({
          data: testData,
          columns: testColumns,
          getRowId: (row) => `custom-${row.id}`,
        })
      );

      const rows = result.current.table.getRowModel().rows;
      const row0 = rows[0];
      const row1 = rows[1];
      const row2 = rows[2];
      expect(row0).toBeDefined();
      expect(row1).toBeDefined();
      expect(row2).toBeDefined();
      expect(row0?.id).toBe('custom-1');
      expect(row1?.id).toBe('custom-2');
      expect(row2?.id).toBe('custom-3');
    });

    it('defaults to array index when getRowId not provided', () => {
      const { result } = renderHook(() =>
        useDataGrid({
          data: testData,
          columns: testColumns,
        })
      );

      const rows = result.current.table.getRowModel().rows;
      const row0 = rows[0];
      const row1 = rows[1];
      const row2 = rows[2];
      expect(row0).toBeDefined();
      expect(row1).toBeDefined();
      expect(row2).toBeDefined();
      expect(row0?.id).toBe('0');
      expect(row1?.id).toBe('1');
      expect(row2?.id).toBe('2');
    });
  });
});
