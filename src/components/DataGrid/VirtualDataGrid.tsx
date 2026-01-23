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
import { SortIndicator, type SortDirection } from './columns/SortIndicator';
// Keyboard navigation is handled at the interactive element level (checkboxes, buttons)
// Rows and cells are NOT focusable to prevent page scrolling

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
  const { table, rowSelection, sorting, expanded, setRowSelection, setExpanded, setSorting } =
    useDataGrid({
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

  // Set up virtualizer with dynamic height measurement
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => {
      // Provide better estimates for expanded rows
      const row = rows[index];
      if (row?.getIsExpanded() === true) {
        // Estimate expanded row height (base + expanded content)
        return estimateRowHeight * 3; // Rough estimate for expanded content
      }
      return estimateRowHeight;
    },
    overscan,
    // Measure actual row heights including expanded content
    measureElement: (element) => {
      // The element passed here is the element with data-index attribute
      // We need to find the actual row <tr> element
      const rowElement = element as HTMLTableRowElement;

      // Get row index from data-index (set by virtualizer)
      const rowIndexAttr = rowElement.getAttribute('data-index');
      if (rowIndexAttr === null) {
        return estimateRowHeight;
      }

      const rowIndex = Number.parseInt(rowIndexAttr, 10);
      if (Number.isNaN(rowIndex) || rowIndex < 0 || rowIndex >= rows.length) {
        return estimateRowHeight;
      }

      // Get the row from TanStack Table
      const row = rows[rowIndex];
      if (row === undefined) {
        return estimateRowHeight;
      }

      // Check if this row is expanded
      const isExpanded = row.getIsExpanded();

      if (!isExpanded) {
        // Simple case: just measure the row itself
        return rowElement.offsetHeight;
      }

      // Expanded case: need to measure main row + expanded row
      // The expanded row is the next sibling <tr> after this one
      // It can be identified by: no data-index attribute (not a virtual row), has td with colSpan
      let totalHeight = rowElement.offsetHeight;
      const nextSibling = rowElement.nextElementSibling;

      if (nextSibling !== null && nextSibling.tagName === 'TR') {
        const nextRow = nextSibling as HTMLTableRowElement;
        // Check if it's the expanded row:
        // 1. No data-index (not a virtualized row)
        // 2. Has a td with colSpan (expanded content spans all columns)
        // 3. Has expanded-section testid (more reliable check)
        const hasDataIndex = nextRow.hasAttribute('data-index');
        const expandedTd = nextRow.querySelector('td[colspan]');
        const expandedSection = nextRow.querySelector('[data-testid="expanded-section"]');

        if (!hasDataIndex && expandedTd !== null && expandedSection !== null) {
          totalHeight += nextRow.offsetHeight;
        }
      }

      return totalHeight;
    },
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

  // Trigger remeasurement when expanded state changes
  // This ensures the virtualizer recalculates row heights after expansion/collapse
  React.useEffect(() => {
    // Small delay to allow DOM to update after expansion animation completes
    const timeoutId = setTimeout((): void => {
      // Force remeasurement of all items to update cached heights
      virtualizer.measure();
    }, 250); // Slightly longer than animation duration (200ms) to ensure measurement after animation

    return (): void => {
      clearTimeout(timeoutId);
    };
  }, [expanded, virtualizer]);

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
        // Flexible column: use size as weight, minSize as minimum, size as defaultWidth for overflow
        return {
          id: col.id,
          sizing: 'flex',
          width: columnDefSize ?? 1, // Default weight of 1
          minWidth: minSize,
          defaultWidth: columnDefSize, // Use size as default width when overflow is needed
        };
      }
    });
  }, [table]);

  // Use anchor-based width calculation
  const { getColumnStyle, containerWidth, ready, getWidth } = useAnchorColumnWidths(
    scrollContainerRef,
    anchorColumns
  );

  // Calculate total table width and detect horizontal overflow
  const totalTableWidth = React.useMemo(() => {
    return table.getAllLeafColumns().reduce((sum, col) => {
      return sum + getWidth(col.id);
    }, 0);
  }, [table, getWidth]);

  const hasHorizontalOverflow = ready && totalTableWidth > containerWidth;

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
      // Left-pinned columns are always sticky
      if (isPinned && pinSide === 'left') {
        cellStyle.position = 'sticky';
        cellStyle.left = leftOffsets.get(columnId) ?? 0;
        cellStyle.zIndex = 5;
      } else if (isPinned && pinSide === 'right' && hasHorizontalOverflow) {
        // Right-pinned (actions) only sticky when table overflows horizontally
        cellStyle.position = 'sticky';
        cellStyle.right = rightOffsets.get(columnId) ?? 0;
        cellStyle.zIndex = 10; // Higher z-index to appear above scrolling content
      }

      const paddingClass = getCellPaddingClass(columnId);
      // Pinned cells need background to cover scrolled content
      // Match row's background state exactly to avoid visual mismatch
      let bgClass = '';
      let bgStyle: React.CSSProperties | undefined;
      const isSelected = row.getIsSelected();

      if (isPinned && (pinSide === 'left' || (pinSide === 'right' && hasHorizontalOverflow))) {
        // Sticky columns must match row background exactly
        // When selected: use fully opaque background that matches row's visual appearance
        // The row uses bg-bg-raised/30 (semi-transparent), but sticky columns need to be
        // fully opaque to prevent text from showing through from scrolling content behind
        if (isSelected) {
          // Calculate fully opaque color that matches bg-bg-raised/30 over bg-bg-app
          // bg-bg-raised: #1e1e1e (RGB: 30, 30, 30), bg-app: #0a0a0a (RGB: 10, 10, 10)
          // Alpha blend: (30 * 0.3) + (10 * 0.7) = 9 + 7 = 16
          // Result: #101010 (fully opaque, matches visual appearance of bg-bg-raised/30)
          bgStyle = { backgroundColor: '#101010' };
        } else {
          // When not selected, rows are transparent
          // Sticky columns need background only to cover scrolling content underneath
          // Use bg-bg-app to match the container background that shows through transparent rows
          bgClass = 'bg-bg-app';
        }
      }

      // Cells are NOT focusable - only interactive elements inside (checkboxes, buttons) are focusable
      // This prevents page scrolling when Space is pressed on non-interactive elements

      return (
        <td
          key={cell.id}
          role="cell"
          className={cn(paddingClass, 'text-sm text-text-primary overflow-hidden', bgClass)}
          style={{ ...cellStyle, ...bgStyle }}
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

  // Row component - rows are NOT focusable, only interactive elements inside are
  interface DataGridRowProps {
    row: Row<TData>;
    cells: React.ReactNode;
  }

  const DataGridRow = ({ row, cells }: DataGridRowProps): React.ReactElement => {
    // Handle row click for single row selection (Feature #13)
    const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>): void => {
      // Don't toggle if clicking on interactive elements
      const target = e.target as HTMLElement;
      if (
        target.closest('button') !== null ||
        target.closest('[role="checkbox"]') !== null ||
        target.closest('input') !== null ||
        target.closest('a') !== null
      ) {
        return;
      }

      // Single row selection: select this row and deselect all others
      if (hookOptions.enableRowSelection === true) {
        const newSelection: Record<string, boolean> = {};
        if (!row.getIsSelected()) {
          newSelection[row.id] = true;
        }
        setRowSelection(newSelection);
      }
    };

    // Handle row double-click for expansion (Feature #14)
    const handleRowDoubleClick = (e: React.MouseEvent<HTMLTableRowElement>): void => {
      // Don't expand if clicking on interactive elements
      const target = e.target as HTMLElement;
      if (
        target.closest('button') !== null ||
        target.closest('[role="checkbox"]') !== null ||
        target.closest('input') !== null ||
        target.closest('a') !== null
      ) {
        return;
      }

      // Toggle expansion on double-click
      if (hookOptions.enableExpanding === true && row.getCanExpand()) {
        row.toggleExpanded();
      }
    };

    return (
      <tr
        role="row"
        className={cn(
          'group border-b border-border-default hover:bg-bg-raised transition-colors',
          row.getIsSelected() && 'bg-bg-raised/30',
          (hookOptions.enableRowSelection === true ||
            (hookOptions.enableExpanding === true && row.getCanExpand())) &&
            'cursor-pointer'
        )}
        data-row-id={row.id}
        onClick={hookOptions.enableRowSelection === true ? handleRowClick : undefined}
        onDoubleClick={hookOptions.enableExpanding === true ? handleRowDoubleClick : undefined}
      >
        {cells}
      </tr>
    );
  };

  // Default row renderer
  const renderDefaultRow = (row: Row<TData>, cells: React.ReactNode): React.ReactNode => (
    <DataGridRow key={row.id} row={row} cells={cells} />
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
      return (
        <>
          {rows.map((row) => (
            <React.Fragment key={row.id}>{renderSingleRow(row)}</React.Fragment>
          ))}
        </>
      );
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

          // Render the row - we need to attach data-index and ref to the first <tr>
          // so the virtualizer can measure it (including expanded content if present)
          const rowContent = renderSingleRow(row);

          // If the row content is a fragment (main row + expanded row),
          // we need to attach data-index and ref to the first <tr>
          if (React.isValidElement(rowContent) && rowContent.type === React.Fragment) {
            const fragmentProps = rowContent.props as { children?: React.ReactNode };
            const children = React.Children.toArray(fragmentProps.children);
            if (children.length > 0 && React.isValidElement(children[0])) {
              // Clone the first child (main row) and add data-index and ref for virtualizer measurement
              const mainRow = React.cloneElement(
                children[0] as React.ReactElement<{
                  'data-index'?: number;
                  ref?: React.Ref<HTMLTableRowElement>;
                }>,
                {
                  'data-index': virtualRow.index,
                  ref: virtualizer.measureElement,
                }
              );

              // Ensure remaining children have keys (preserve existing keys if present)
              const remainingChildren = children.slice(1).map((child, index) => {
                if (React.isValidElement(child)) {
                  // Preserve existing key, only add one if missing
                  // eslint-disable-next-line eqeqeq -- Check for both null and undefined
                  if (child.key == null) {
                    return React.cloneElement(child, {
                      key: `${String(virtualRow.key)}-child-${String(index)}`,
                    });
                  }
                }
                return child;
              });

              // Return fragment with updated main row
              return (
                <React.Fragment key={virtualRow.key}>
                  {mainRow}
                  {remainingChildren}
                </React.Fragment>
              );
            }
          }

          // For single row elements, attach data-index and measure ref
          if (React.isValidElement(rowContent)) {
            return React.cloneElement(
              rowContent as React.ReactElement<{
                'data-index'?: number;
                ref?: React.Ref<HTMLTableRowElement>;
              }>,
              {
                key: virtualRow.key,
                'data-index': virtualRow.index,
                ref: virtualizer.measureElement,
              }
            );
          }

          return rowContent;
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
            width: ready && containerWidth > 0 ? Math.max(containerWidth, totalTableWidth) : '100%',
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
                    const canSort =
                      hookOptions.enableSorting === true && header.column.getCanSort();

                    // Get sort direction for this column
                    const sortDirection: SortDirection = ((): SortDirection => {
                      if (!canSort) {
                        return null;
                      }
                      const sortInfo = sorting.find((s) => s.id === header.column.id);
                      if (sortInfo === undefined) {
                        return null;
                      }
                      return sortInfo.desc ? 'desc' : 'asc';
                    })();

                    // Get aria-sort value for accessibility
                    const getAriaSort = (): 'ascending' | 'descending' | 'none' => {
                      if (sortDirection === 'asc') {
                        return 'ascending';
                      }
                      if (sortDirection === 'desc') {
                        return 'descending';
                      }
                      return 'none';
                    };

                    // Handle header click for sorting (Feature #34)
                    const handleHeaderClick = (): void => {
                      if (!canSort) {
                        return;
                      }

                      const currentSort = sorting.find((s) => s.id === header.column.id);
                      let newSorting: Array<{ id: string; desc: boolean }>;

                      if (currentSort === undefined) {
                        // First click: sort ascending
                        newSorting = [{ id: header.column.id, desc: false }];
                      } else if (!currentSort.desc) {
                        // Second click: sort descending
                        newSorting = [{ id: header.column.id, desc: true }];
                      } else {
                        // Third click: clear sort
                        newSorting = [];
                      }

                      setSorting(newSorting);
                    };

                    // Use anchor-based calculated width
                    const columnStyle = getColumnStyle(header.column.id);
                    const headerStyle: React.CSSProperties = {
                      ...columnStyle,
                    };

                    // Add sticky positioning for pinned columns
                    // Left-pinned columns are always sticky
                    if (isPinned && pinSide === 'left') {
                      headerStyle.position = 'sticky';
                      headerStyle.left = leftOffsets.get(header.column.id) ?? 0;
                      headerStyle.zIndex = 15; // Higher than body cells
                    } else if (isPinned && pinSide === 'right' && hasHorizontalOverflow) {
                      // Right-pinned (actions) only sticky when table overflows horizontally
                      headerStyle.position = 'sticky';
                      headerStyle.right = rightOffsets.get(header.column.id) ?? 0;
                      headerStyle.zIndex = 20; // Higher than everything to appear above scrolling content
                    }

                    // Headers all use the same background color (bg-bg-app)
                    const headerBgClass = 'bg-bg-app';

                    return (
                      <th
                        key={header.id}
                        className={cn(
                          paddingClass,
                          'text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border-default overflow-hidden',
                          headerBgClass,
                          canSort && 'cursor-pointer hover:bg-bg-raised transition-colors'
                        )}
                        style={headerStyle}
                        role="columnheader"
                        onClick={canSort ? handleHeaderClick : undefined}
                        aria-sort={getAriaSort()}
                      >
                        {header.isPlaceholder ? null : (
                          <div className="flex items-center gap-2">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {canSort && <SortIndicator direction={sortDirection} />}
                          </div>
                        )}
                      </th>
                    );
                  };

                  return (
                    <tr key={headerGroup.id} role="row">
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
