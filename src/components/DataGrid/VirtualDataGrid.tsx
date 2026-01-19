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

  // Notify parent of selection changes
  React.useEffect(() => {
    onRowSelectionChange?.(rowSelection);
  }, [rowSelection, onRowSelectionChange]);

  // Notify parent of sorting changes
  React.useEffect(() => {
    onSortingChange?.(sorting);
  }, [sorting, onSortingChange]);

  // Notify parent of expanded changes
  React.useEffect(() => {
    onExpandedChange?.(expanded as Record<string, boolean>);
  }, [expanded, onExpandedChange]);

  // Calculate padding for virtual rows
  const paddingTop = virtualRows.length > 0 ? (virtualRows[0]?.start ?? 0) : 0;
  const paddingBottom =
    virtualRows.length > 0 ? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0) : 0;

  // Default cell renderer
  const renderDefaultCells = (row: Row<TData>): React.ReactNode => (
    <>
      {row.getVisibleCells().map((cell) => (
        <td
          key={cell.id}
          className="px-3 py-2 text-sm text-text-primary"
          style={{ width: cell.column.getSize() }}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </>
  );

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
        <tr>
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
          <tr>
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
          <tr>
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
        <table className="min-w-full border-collapse" role="table">
          <thead className="sticky top-0 bg-bg-app z-10">
            {renderHeader !== undefined
              ? renderHeader()
              : table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border-default"
                        style={{ width: header.getSize() }}
                        role="columnheader"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
          </thead>
          <tbody>{renderTableBody()}</tbody>
        </table>
      </div>
    </div>
  );
}
