/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file useDataGrid hook
 * @description Base hook that wraps TanStack Table with runi defaults
 *
 * This hook provides a type-safe, opinionated wrapper around TanStack Table
 * with built-in support for sorting, filtering, selection, expansion,
 * column resizing, column ordering, and column pinning.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
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
  type ColumnSizingState,
  type ColumnOrderState,
  type ColumnPinningState,
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

  /** Enable multiple rows to be expanded simultaneously (defaults to false) */
  enableMultiExpansion?: boolean;

  /** Custom function to get unique row ID */
  getRowId?: (originalRow: TData, index: number, parent?: unknown) => string;

  /** Custom function to determine if a row can be expanded (defaults to true if enableExpanding) */
  getRowCanExpand?: (row: Row<TData>) => boolean;

  // === Column Features (Phase 8) ===

  /** Enable column resizing */
  enableColumnResizing?: boolean;

  /** Column resize mode: 'onChange' updates on every pixel, 'onEnd' updates when drag ends */
  columnResizeMode?: 'onChange' | 'onEnd';

  /** Initial column sizing state */
  initialColumnSizing?: ColumnSizingState;

  /** Enable column reordering */
  enableColumnOrdering?: boolean;

  /** Initial column order */
  initialColumnOrder?: ColumnOrderState;

  /** Enable column pinning */
  enableColumnPinning?: boolean;

  /** Initial column pinning state */
  initialColumnPinning?: ColumnPinningState;

  /** Persistence key for saving column state to localStorage */
  persistenceKey?: string;
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

  // === Column Features (Phase 8) ===

  /** Current column sizing state */
  columnSizing: ColumnSizingState;

  /** Function to update column sizing */
  setColumnSizing: OnChangeFn<ColumnSizingState>;

  /** Current column order state */
  columnOrder: ColumnOrderState;

  /** Function to update column order */
  setColumnOrder: OnChangeFn<ColumnOrderState>;

  /** Current column pinning state */
  columnPinning: ColumnPinningState;

  /** Function to update column pinning */
  setColumnPinning: OnChangeFn<ColumnPinningState>;

  /** Reset column sizes to defaults */
  resetColumnSizing: () => void;

  /** Reset column order to defaults */
  resetColumnOrder: () => void;
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
  enableMultiExpansion = false,
  getRowId,
  getRowCanExpand,
  // Column features (Phase 8)
  enableColumnResizing = false,
  columnResizeMode = 'onChange',
  initialColumnSizing = {},
  enableColumnOrdering: _enableColumnOrdering = false, // Reserved for future drag-and-drop UI
  initialColumnOrder = [],
  enableColumnPinning = true, // Enable column pinning for frozen columns (e.g., actions)
  initialColumnPinning = {},
  persistenceKey,
}: UseDataGridOptions<TData>): UseDataGridReturn<TData> {
  // === Load persisted state from localStorage ===
  const loadPersistedState = useCallback(
    <T>(key: string, defaultValue: T): T => {
      if (persistenceKey === undefined) {
        return defaultValue;
      }
      try {
        const stored = localStorage.getItem(`${persistenceKey}-${key}`);
        if (stored !== null) {
          return JSON.parse(stored) as T;
        }
      } catch {
        // Ignore parse errors, use default
      }
      return defaultValue;
    },
    [persistenceKey]
  );

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

  // Wrap setExpanded to enforce single expansion if requested
  const handleExpandedChange: OnChangeFn<ExpandedState> = useCallback(
    (updater) => {
      setExpanded((old) => {
        const next = typeof updater === 'function' ? updater(old) : updater;

        // If multi-expansion is disabled, only keep the newest expanded row
        if (!enableMultiExpansion) {
          // ExpandedState can be `true` (expand all) or a record.
          // When single-expansion is enabled, disallow "expand all".
          if (typeof next === 'boolean') {
            // If it's true (expand all), keep the previous record or collapse all.
            return typeof old !== 'boolean' ? old : {};
          }

          const oldRecord = typeof old === 'boolean' ? {} : old;
          const nextRecord = next;

          const oldKeys = Object.keys(oldRecord).filter((key) => oldRecord[key] === true);
          const nextKeys = Object.keys(nextRecord).filter((key) => nextRecord[key] === true);

          // Find if a new row was expanded
          const newlyExpanded = nextKeys.find((key) => !oldKeys.includes(key));

          if (newlyExpanded !== undefined) {
            // Only keep the newly expanded row
            return { [newlyExpanded]: true };
          }

          // If no new row was expanded (e.g., one was collapsed),
          // return next but ensure it has at most one key
          if (nextKeys.length > 1) {
            const lastKey = nextKeys[nextKeys.length - 1];
            if (lastKey !== undefined) {
              return { [lastKey]: true };
            }
          }
        }

        return next;
      });
    },
    [enableMultiExpansion]
  );

  // === Column Features State (Phase 8) ===

  // Column sizing state with persistence
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() =>
    loadPersistedState('columnSizing', initialColumnSizing)
  );

  // Column order state with persistence
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() =>
    loadPersistedState('columnOrder', initialColumnOrder)
  );

  // Column pinning state with persistence
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(() =>
    loadPersistedState('columnPinning', initialColumnPinning)
  );

  // === Persist column state to localStorage ===
  useEffect(() => {
    if (persistenceKey !== undefined && Object.keys(columnSizing).length > 0) {
      localStorage.setItem(`${persistenceKey}-columnSizing`, JSON.stringify(columnSizing));
    }
  }, [persistenceKey, columnSizing]);

  useEffect(() => {
    if (persistenceKey !== undefined && columnOrder.length > 0) {
      localStorage.setItem(`${persistenceKey}-columnOrder`, JSON.stringify(columnOrder));
    }
  }, [persistenceKey, columnOrder]);

  useEffect(() => {
    if (
      persistenceKey !== undefined &&
      (columnPinning.left !== undefined || columnPinning.right !== undefined)
    ) {
      localStorage.setItem(`${persistenceKey}-columnPinning`, JSON.stringify(columnPinning));
    }
  }, [persistenceKey, columnPinning]);

  // === Reset functions ===
  const resetColumnSizing = useCallback((): void => {
    setColumnSizing({});
    if (persistenceKey !== undefined) {
      localStorage.removeItem(`${persistenceKey}-columnSizing`);
    }
  }, [persistenceKey]);

  const resetColumnOrder = useCallback((): void => {
    setColumnOrder([]);
    if (persistenceKey !== undefined) {
      localStorage.removeItem(`${persistenceKey}-columnOrder`);
    }
  }, [persistenceKey]);

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
        // Column features state
        columnSizing,
        columnOrder,
        columnPinning,
      },
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      onGlobalFilterChange: setGlobalFilter,
      onRowSelectionChange: setRowSelection,
      onExpandedChange: handleExpandedChange,
      // Column features handlers
      onColumnSizingChange: setColumnSizing,
      onColumnOrderChange: setColumnOrder,
      onColumnPinningChange: setColumnPinning,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
      getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
      getExpandedRowModel: enableExpanding ? getExpandedRowModel() : undefined,
      enableRowSelection,
      enableExpanding,
      getRowId,
      getRowCanExpand,
      // Column features options
      enableColumnResizing,
      columnResizeMode,
      enableColumnPinning,
    }),
    [
      data,
      columns,
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
      expanded,
      handleExpandedChange,
      columnSizing,
      columnOrder,
      columnPinning,
      enableSorting,
      enableFiltering,
      enableRowSelection,
      enableExpanding,
      getRowId,
      getRowCanExpand,
      enableColumnResizing,
      columnResizeMode,
      enableColumnPinning,
    ]
  );

  const table = useReactTable(tableOptions);

  // Feature #33: Selection Persistence - Maintain selection across filter changes
  // When filters change, deselect rows that no longer match the filter
  useEffect(() => {
    if (!enableFiltering || !enableRowSelection) {
      return;
    }

    // Get all visible row IDs after filtering
    const visibleRowIds = new Set(table.getRowModel().rows.map((row) => row.id));

    // Filter selection to only include rows that are still visible
    const filteredSelection: RowSelectionState = {};
    let hasChanges = false;

    for (const [rowId, isSelected] of Object.entries(rowSelection)) {
      if (isSelected && visibleRowIds.has(rowId)) {
        filteredSelection[rowId] = true;
      } else if (isSelected && !visibleRowIds.has(rowId)) {
        // Row was selected but is no longer visible - deselect it
        hasChanges = true;
      }
    }

    // Only update if there are changes to avoid infinite loops
    if (hasChanges && Object.keys(filteredSelection).length !== Object.keys(rowSelection).length) {
      setRowSelection(filteredSelection);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run when filters change, not when rowSelection changes
  }, [columnFilters, globalFilter, table, enableFiltering, enableRowSelection]);

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
    // Column features
    columnSizing,
    setColumnSizing,
    columnOrder,
    setColumnOrder,
    columnPinning,
    setColumnPinning,
    resetColumnSizing,
    resetColumnOrder,
  };
}
