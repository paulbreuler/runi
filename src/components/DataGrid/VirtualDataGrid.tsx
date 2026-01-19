/**
 * @file VirtualDataGrid component
 * @description Virtualized data grid combining TanStack Table + TanStack Virtual
 *
 * This component provides a performant data grid for large datasets by only
 * rendering visible rows. It integrates with the useDataGrid hook for table
 * state management.
 */

import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { flexRender, type Row, type ColumnDef } from '@tanstack/react-table';
import { useDataGrid, type UseDataGridOptions } from './useDataGrid';
import { cn } from '@/utils/cn';

/**
 * Gets the appropriate padding class for a column based on its ID.
 * Returns padding classes without any flex/alignment utilities.
 */
function getCellPaddingClass(columnId: string): string {
  if (columnId === 'select') {
    return 'px-2 py-2'; // Match expander column padding for consistent width
  }
  if (columnId === 'expand') {
    return 'px-2 py-2';
  }
  if (columnId === 'method') {
    return 'px-3 py-2';
  }
  return 'px-3 py-2';
}

/**
 * Props for the VirtualDataGrid component
 */
export interface VirtualDataGridProps<TData> extends Omit<UseDataGridOptions<TData>, 'columns'> {
  /** Column definitions for the grid */
  columns: Array<ColumnDef<TData>>;

  /** Height of the scroll container in pixels */
  height?: number;

  /** Estimated height of each row in pixels */
  estimateRowHeight?: number;

  /** Number of rows to render outside the visible area */
  overscan?: number;

  /** Message to display when there is no data */
  emptyMessage?: string;

  /** Custom className for the container */
  className?: string;

  /** Callback when row selection changes */
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;

  /** Callback when sorting changes */
  onSortingChange?: (sorting: Array<{ id: string; desc: boolean }>) => void;

  /** Callback when expanded state changes */
  onExpandedChange?: (expanded: Record<string, boolean>) => void;

  /** Custom row renderer */
  renderRow?: (row: Row<TData>, cells: React.ReactNode) => React.ReactNode;

  /** Custom header renderer */
  renderHeader?: () => React.ReactNode;

  /** Expose setRowSelection for external control (e.g., row clicks) */
  onSetRowSelectionReady?: (setRowSelection: (selection: Record<string, boolean>) => void) => void;

  /** Expose setExpanded for external control (e.g., double-click) */
  onSetExpandedReady?: (setExpanded: (expanded: Record<string, boolean>) => void) => void;
}

/**
 * Virtualized data grid component for large datasets
 *
 * @example
 * ```tsx
 * <VirtualDataGrid
 *   data={historyEntries}
 *   columns={networkColumns}
 *   getRowId={(row) => row.id}
 *   height={600}
 *   enableRowSelection
 *   enableSorting
 * />
 * ```
 */
export function VirtualDataGrid<TData>({
  data,
  columns,
  height = 400,
  estimateRowHeight = 40,
  overscan = 5,
  emptyMessage = 'No data',
  className,
  onRowSelectionChange,
  onSortingChange,
  onExpandedChange,
  onSetRowSelectionReady,
  onSetExpandedReady,
  renderRow,
  renderHeader,
  ...hookOptions
}: VirtualDataGridProps<TData>): React.ReactElement {
  // Scroll container ref
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Use the base data grid hook
  const { table, rowSelection, sorting, expanded, setRowSelection, setExpanded } = useDataGrid({
    data,
    columns,
    ...hookOptions,
  });

  // Expose setRowSelection to parent if requested
  React.useEffect(() => {
    if (onSetRowSelectionReady !== undefined) {
      onSetRowSelectionReady((selection: Record<string, boolean>) => {
        setRowSelection(selection);
      });
    }
  }, [onSetRowSelectionReady, setRowSelection]);

  // Expose setExpanded to parent if requested
  React.useEffect(() => {
    if (onSetExpandedReady !== undefined) {
      onSetExpandedReady((expandedState: Record<string, boolean>) => {
        setExpanded(expandedState);
      });
    }
  }, [onSetExpandedReady, setExpanded]);

  // Get rows from table
  const { rows } = table.getRowModel();

  // Calculate total table width from column sizes to prevent browser stretching with table-layout: fixed
  const totalTableWidth = React.useMemo(() => {
    const visibleColumns = table.getVisibleLeafColumns();
    return visibleColumns.reduce((sum, col) => sum + col.getSize(), 0);
  }, [table]);

  // Set up virtualizer
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => estimateRowHeight,
    overscan,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  // Fallback for test environments where virtualization doesn't work
  // (jsdom doesn't have real scroll dimensions)
  const shouldRenderAllRows = virtualRows.length === 0 && rows.length > 0;

  // Store callbacks in refs to avoid dependency issues that can cause infinite loops
  const onRowSelectionChangeRef = React.useRef(onRowSelectionChange);
  const onSortingChangeRef = React.useRef(onSortingChange);
  const onExpandedChangeRef = React.useRef(onExpandedChange);

  // Update refs when callbacks change
  React.useEffect(() => {
    onRowSelectionChangeRef.current = onRowSelectionChange;
  }, [onRowSelectionChange]);

  React.useEffect(() => {
    onSortingChangeRef.current = onSortingChange;
  }, [onSortingChange]);

  React.useEffect(() => {
    onExpandedChangeRef.current = onExpandedChange;
  }, [onExpandedChange]);

  // Notify parent of selection changes
  React.useEffect(() => {
    onRowSelectionChangeRef.current?.(rowSelection);
  }, [rowSelection]);

  // Notify parent of sorting changes
  React.useEffect(() => {
    onSortingChangeRef.current?.(sorting);
  }, [sorting]);

  // Notify parent of expanded changes
  React.useEffect(() => {
    onExpandedChangeRef.current?.(expanded as Record<string, boolean>);
  }, [expanded]);

  // Calculate padding for virtual rows
  const paddingTop = virtualRows.length > 0 ? (virtualRows[0]?.start ?? 0) : 0;
  const paddingBottom =
    virtualRows.length > 0 ? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0) : 0;

  // Default cell renderer
  const renderDefaultCells = (row: Row<TData>): React.ReactNode => {
    return (
      <>
        {row.getVisibleCells().map((cell) => {
          const columnSize = cell.column.getSize();
          const maxSize = cell.column.columnDef.maxSize;
          const minSize = cell.column.columnDef.minSize;
          const columnId = cell.column.id;

          // For fixed-size columns (minSize === maxSize), use fixed width
          // For flexible columns, use width as initial size but allow growth
          const isFixedColumn =
            maxSize !== undefined && minSize !== undefined && maxSize === minSize;
          let cellStyle: React.CSSProperties;
          if (isFixedColumn) {
            cellStyle = { width: columnSize, minWidth: columnSize, maxWidth: columnSize };
          } else if (minSize !== undefined) {
            cellStyle = { minWidth: minSize, width: columnSize };
          } else {
            cellStyle = { width: columnSize };
          }

          const paddingClass = getCellPaddingClass(columnId);

          return (
            <td
              key={cell.id}
              className={cn(paddingClass, 'text-sm text-text-primary overflow-hidden')}
              style={cellStyle}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          );
        })}
      </>
    );
  };

  // Default row renderer
  const renderDefaultRow = (row: Row<TData>, cells: React.ReactNode): React.ReactNode => (
    <tr
      key={row.id}
      className={cn(
        'border-b border-border-default hover:bg-bg-raised transition-colors',
        row.getIsSelected() && 'bg-accent-blue/10'
      )}
      data-row-id={row.id}
    >
      {cells}
    </tr>
  );

  // Render a single row with proper cell handling
  const renderSingleRow = (row: Row<TData>): React.ReactNode => {
    const cells = renderDefaultCells(row);
    return renderRow !== undefined ? renderRow(row, cells) : renderDefaultRow(row, cells);
  };

  // Render the tbody content based on state
  const renderTableBody = (): React.ReactNode => {
    // Empty state
    if (rows.length === 0) {
      return (
        <tr key="empty-state">
          <td colSpan={columns.length} className="px-3 py-8 text-center text-text-secondary">
            {emptyMessage}
          </td>
        </tr>
      );
    }

    // Fallback: render all rows when virtualization doesn't work (e.g., jsdom)
    if (shouldRenderAllRows) {
      return <>{rows.map(renderSingleRow)}</>;
    }

    // Virtualized rendering
    return (
      <>
        {paddingTop > 0 && (
          <tr key="padding-top">
            <td style={{ height: paddingTop }} />
          </tr>
        )}
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index];
          if (row === undefined) {
            return null;
          }
          return renderSingleRow(row);
        })}
        {paddingBottom > 0 && (
          <tr key="padding-bottom">
            <td style={{ height: paddingBottom }} />
          </tr>
        )}
      </>
    );
  };

  return (
    <div className={cn('flex flex-col min-h-0', className)} data-testid="virtual-datagrid">
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto"
        style={{ height }}
        data-testid="virtual-scroll-container"
      >
        <table
          className="border-collapse"
          role="table"
          style={{ tableLayout: 'fixed', width: totalTableWidth }}
        >
          <thead className="sticky top-0 bg-bg-app z-10">
            {renderHeader !== undefined
              ? renderHeader()
              : table.getHeaderGroups().map((headerGroup) => {
                  return (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const paddingClass = getCellPaddingClass(header.column.id);
                        const headerSize = header.getSize();
                        const maxSize = header.column.columnDef.maxSize;
                        const minSize = header.column.columnDef.minSize;
                        const isFixedColumn =
                          maxSize !== undefined && minSize !== undefined && maxSize === minSize;

                        // Apply same width constraints as cells for consistency
                        let headerStyle: React.CSSProperties;
                        if (isFixedColumn) {
                          headerStyle = {
                            width: headerSize,
                            minWidth: headerSize,
                            maxWidth: headerSize,
                          };
                        } else if (minSize !== undefined) {
                          headerStyle = { minWidth: minSize, width: headerSize };
                        } else {
                          headerStyle = { width: headerSize };
                        }

                        return (
                          <th
                            key={header.id}
                            className={cn(
                              paddingClass,
                              'text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border-default overflow-hidden'
                            )}
                            style={headerStyle}
                            role="columnheader"
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        );
                      })}
                    </tr>
                  );
                })}
          </thead>
          <tbody>{renderTableBody()}</tbody>
        </table>
      </div>
    </div>
  );
}
