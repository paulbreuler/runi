/**
 * @file useDataGrid hook
 * @description Base hook that wraps TanStack Table with runi defaults
 *
 * This hook provides a type-safe, opinionated wrapper around TanStack Table
 * with built-in support for sorting, filtering, selection, and expansion.
 */

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  type Table,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
  type ExpandedState,
  type OnChangeFn,
  type Row,
} from '@tanstack/react-table';

/**
 * Configuration options for useDataGrid
 */
export interface UseDataGridOptions<TData> {
  /** The data array to display in the grid */
  data: TData[];

  /** Column definitions for the grid */
  columns: Array<ColumnDef<TData>>;

  /** Enable sorting functionality */
  enableSorting?: boolean;

  /** Initial sorting state */
  initialSorting?: SortingState;

  /** Enable filtering functionality (column and global) */
  enableFiltering?: boolean;

  /** Enable row selection functionality */
  enableRowSelection?: boolean;

  /** Initial row selection state */
  initialRowSelection?: RowSelectionState;

  /** Enable row expansion functionality */
  enableExpanding?: boolean;

  /** Initial expansion state */
  initialExpanded?: ExpandedState;

  /** Custom function to get unique row ID */
  getRowId?: (originalRow: TData, index: number, parent?: unknown) => string;

  /** Custom function to determine if a row can be expanded (defaults to true if enableExpanding) */
  getRowCanExpand?: (row: Row<TData>) => boolean;
}

/**
 * Return type for useDataGrid hook
 */
export interface UseDataGridReturn<TData> {
  /** The TanStack Table instance */
  table: Table<TData>;

  /** Current sorting state */
  sorting: SortingState;

  /** Function to update sorting state */
  setSorting: OnChangeFn<SortingState>;

  /** Current column filters state */
  columnFilters: ColumnFiltersState;

  /** Function to update column filters */
  setColumnFilters: OnChangeFn<ColumnFiltersState>;

  /** Current global filter value */
  globalFilter: string;

  /** Function to update global filter */
  setGlobalFilter: (value: string) => void;

  /** Current row selection state */
  rowSelection: RowSelectionState;

  /** Function to update row selection */
  setRowSelection: OnChangeFn<RowSelectionState>;

  /** Current expanded rows state */
  expanded: ExpandedState;

  /** Function to update expanded state */
  setExpanded: OnChangeFn<ExpandedState>;
}

/**
 * Hook that wraps TanStack Table with runi defaults
 *
 * @example
 * ```tsx
 * const { table, sorting, setSorting } = useDataGrid({
 *   data: historyEntries,
 *   columns: networkColumns,
 *   enableSorting: true,
 *   enableRowSelection: true,
 *   getRowId: (row) => row.id,
 * });
 * ```
 */
export function useDataGrid<TData>({
  data,
  columns,
  enableSorting = false,
  initialSorting = [],
  enableFiltering = false,
  enableRowSelection = false,
  initialRowSelection = {},
  enableExpanding = false,
  initialExpanded = {},
  getRowId,
  getRowCanExpand,
}: UseDataGridOptions<TData>): UseDataGridReturn<TData> {
  // Sorting state
  const [sorting, setSorting] = useState<SortingState>(initialSorting);

  // Column filters state
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Global filter state
  const [globalFilter, setGlobalFilter] = useState<string>('');

  // Row selection state
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(initialRowSelection);

  // Expanded rows state
  const [expanded, setExpanded] = useState<ExpandedState>(initialExpanded);

  // Memoize table options to prevent unnecessary re-renders
  const tableOptions = useMemo(
    () => ({
      data,
      columns,
      state: {
        sorting,
        columnFilters,
        globalFilter,
        rowSelection,
        expanded,
      },
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      onGlobalFilterChange: setGlobalFilter,
      onRowSelectionChange: setRowSelection,
      onExpandedChange: setExpanded,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
      getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
      getExpandedRowModel: enableExpanding ? getExpandedRowModel() : undefined,
      enableRowSelection,
      enableExpanding,
      getRowId,
      getRowCanExpand,
    }),
    [
      data,
      columns,
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
      expanded,
      enableSorting,
      enableFiltering,
      enableRowSelection,
      enableExpanding,
      getRowId,
      getRowCanExpand,
    ]
  );

  const table = useReactTable(tableOptions);

  return {
    table,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    globalFilter,
    setGlobalFilter,
    rowSelection,
    setRowSelection,
    expanded,
    setExpanded,
  };
}
