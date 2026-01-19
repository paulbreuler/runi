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
import { useAnchorColumnWidths, type AnchorColumnDef } from './useAnchorColumnWidths';

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
  if (columnId === 'actions') {
    return 'px-3 py-2'; // Match other columns for consistent spacing
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

  // ============================================================================
  // Anchor-based column width calculation
  // ============================================================================

  // Convert TanStack columns to anchor column definitions
  const anchorColumns = React.useMemo<AnchorColumnDef[]>(() => {
    const allColumns = table.getAllLeafColumns();
    return allColumns.map((col) => {
      const maxSize = col.columnDef.maxSize;
      const minSize = col.columnDef.minSize;
      const columnDefSize = col.columnDef.size;
      const isFixedColumn = maxSize !== undefined && minSize !== undefined && maxSize === minSize;

      if (isFixedColumn && columnDefSize !== undefined) {
        // Fixed column: use exact size
        return {
          id: col.id,
          sizing: 'fixed',
          width: columnDefSize,
        };
      } else {
        // Flexible column: use size as weight, minSize as minimum
        return {
          id: col.id,
          sizing: 'flex',
          width: columnDefSize ?? 1, // Default weight of 1
          minWidth: minSize,
        };
      }
    });
  }, [table]);

  // Use anchor-based width calculation
  const { getColumnStyle, containerWidth, ready, getWidth } = useAnchorColumnWidths(
    scrollContainerRef,
    anchorColumns
  );

  // Default cell renderer
  const renderDefaultCells = (row: Row<TData>): React.ReactNode => {
    const leftColumns = table.getLeftLeafColumns();
    const rightColumns = table.getRightLeafColumns();
    const centerColumns = table.getCenterLeafColumns();

    // Calculate cumulative widths for sticky positioning
    // For fixed columns, use column definition size directly to avoid column sizing state issues
    const leftOffsets = new Map<string, number>();
    const rightOffsets = new Map<string, number>();
    let leftOffset = 0;
    let rightOffset = 0;

    // Pre-calculate offsets for left columns using anchor-based widths
    leftColumns.forEach((column) => {
      leftOffsets.set(column.id, leftOffset);
      leftOffset += getWidth(column.id);
    });

    // Pre-calculate offsets for right columns (in reverse order) using anchor-based widths
    [...rightColumns].reverse().forEach((column) => {
      rightOffsets.set(column.id, rightOffset);
      rightOffset += getWidth(column.id);
    });

    const renderCell = (
      cell: ReturnType<Row<TData>['getVisibleCells']>[0],
      isPinned: boolean,
      pinSide: 'left' | 'right' | null
    ): React.ReactNode => {
      const columnId = cell.column.id;

      // Use anchor-based calculated width
      const columnStyle = getColumnStyle(columnId);
      const cellStyle: React.CSSProperties = {
        ...columnStyle,
      };

      // Add sticky positioning for pinned columns
      if (isPinned && pinSide === 'left') {
        cellStyle.position = 'sticky';
        cellStyle.left = leftOffsets.get(columnId) ?? 0;
        cellStyle.zIndex = 5;
      } else if (isPinned && pinSide === 'right') {
        cellStyle.position = 'sticky';
        cellStyle.right = rightOffsets.get(columnId) ?? 0;
        cellStyle.zIndex = 5;
      }

      const paddingClass = getCellPaddingClass(columnId);
      // Pinned cells need background to cover scrolled content
      // Use row's selected state if selected, otherwise use raised background (shade darker than rows)
      let bgClass = '';
      if (isPinned && (pinSide === 'left' || pinSide === 'right')) {
        bgClass = row.getIsSelected() ? 'bg-accent-blue/10' : 'bg-bg-raised';
      }

      return (
        <td
          key={cell.id}
          className={cn(paddingClass, 'text-sm text-text-primary overflow-hidden', bgClass)}
          style={cellStyle}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      );
    };

    return (
      <>
        {/* Left pinned columns */}
        {leftColumns.map((column) => {
          const cell = row.getVisibleCells().find((c) => c.column.id === column.id);
          return cell !== undefined ? renderCell(cell, true, 'left') : null;
        })}
        {/* Center (unpinned) columns */}
        {centerColumns.map((column) => {
          const cell = row.getVisibleCells().find((c) => c.column.id === column.id);
          return cell !== undefined ? renderCell(cell, false, null) : null;
        })}
        {/* Right pinned columns */}
        {rightColumns.map((column) => {
          const cell = row.getVisibleCells().find((c) => c.column.id === column.id);
          return cell !== undefined ? renderCell(cell, true, 'right') : null;
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
          style={{
            width: ready && containerWidth > 0 ? containerWidth : '100%',
            tableLayout: 'fixed',
          }}
        >
          {ready && (
            <colgroup>
              {table.getAllLeafColumns().map((column) => {
                const style = getColumnStyle(column.id);
                return <col key={column.id} style={style} />;
              })}
            </colgroup>
          )}
          <thead className="sticky top-0 bg-bg-app z-10">
            {renderHeader !== undefined
              ? renderHeader()
              : table.getHeaderGroups().map((headerGroup) => {
                  const leftColumns = table.getLeftLeafColumns();
                  const rightColumns = table.getRightLeafColumns();
                  const centerColumns = table.getCenterLeafColumns();

                  // Calculate cumulative widths for sticky positioning
                  // For fixed columns, use column definition size directly to avoid column sizing state issues
                  const leftOffsets = new Map<string, number>();
                  const rightOffsets = new Map<string, number>();
                  let leftOffset = 0;
                  let rightOffset = 0;

                  // Pre-calculate offsets for left columns using anchor-based widths
                  leftColumns.forEach((column) => {
                    leftOffsets.set(column.id, leftOffset);
                    leftOffset += getWidth(column.id);
                  });

                  // Pre-calculate offsets for right columns (in reverse order) using anchor-based widths
                  [...rightColumns].reverse().forEach((column) => {
                    rightOffsets.set(column.id, rightOffset);
                    rightOffset += getWidth(column.id);
                  });

                  const renderHeaderCell = (
                    header: ReturnType<typeof table.getHeaderGroups>[0]['headers'][0],
                    isPinned: boolean,
                    pinSide: 'left' | 'right' | null
                  ): React.ReactNode => {
                    const paddingClass = getCellPaddingClass(header.column.id);

                    // Use anchor-based calculated width
                    const columnStyle = getColumnStyle(header.column.id);
                    const headerStyle: React.CSSProperties = {
                      ...columnStyle,
                    };

                    // Add sticky positioning for pinned columns
                    if (isPinned && pinSide === 'left') {
                      headerStyle.position = 'sticky';
                      headerStyle.left = leftOffsets.get(header.column.id) ?? 0;
                      headerStyle.zIndex = 15; // Higher than body cells
                    } else if (isPinned && pinSide === 'right') {
                      headerStyle.position = 'sticky';
                      headerStyle.right = rightOffsets.get(header.column.id) ?? 0;
                      headerStyle.zIndex = 15; // Higher than body cells
                    }

                    // Headers all use the same background color (bg-bg-app)
                    const headerBgClass = 'bg-bg-app';

                    return (
                      <th
                        key={header.id}
                        className={cn(
                          paddingClass,
                          'text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border-default overflow-hidden',
                          headerBgClass
                        )}
                        style={headerStyle}
                        role="columnheader"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    );
                  };

                  return (
                    <tr key={headerGroup.id}>
                      {/* Left pinned headers */}
                      {leftColumns.map((column) => {
                        const header = headerGroup.headers.find((h) => h.column.id === column.id);
                        return header !== undefined ? renderHeaderCell(header, true, 'left') : null;
                      })}
                      {/* Center (unpinned) headers */}
                      {centerColumns.map((column) => {
                        const header = headerGroup.headers.find((h) => h.column.id === column.id);
                        return header !== undefined ? renderHeaderCell(header, false, null) : null;
                      })}
                      {/* Right pinned headers */}
                      {rightColumns.map((column) => {
                        const header = headerGroup.headers.find((h) => h.column.id === column.id);
                        return header !== undefined
                          ? renderHeaderCell(header, true, 'right')
                          : null;
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
