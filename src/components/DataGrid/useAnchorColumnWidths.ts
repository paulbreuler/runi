/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useState, useMemo, type RefObject } from 'react';

// =============================================================================
// useAnchorColumnWidths HOOK
// =============================================================================
//
// Drop-in solution for anchor-based table layout. Calculates explicit pixel
// widths for all columns based on container width, ensuring fixed columns
// STAY FIXED regardless of content in flexible columns.
//
// Usage:
//   1. Define columns with meta: { sizing: 'fixed' | 'flex', width: number }
//   2. Call hook with container ref and column definitions
//   3. Apply returned widths to <col>, <th>, and <td> elements
//   4. Use tableLayout: 'fixed' on the table
//
// Example:
//   const containerRef = useRef<HTMLDivElement>(null);
//   const { columnWidths, ready } = useAnchorColumnWidths(containerRef, [
//     { id: 'select', sizing: 'fixed', width: 32 },
//     { id: 'method', sizing: 'fixed', width: 70 },
//     { id: 'url', sizing: 'flex', width: 2 },  // weight of 2
//     { id: 'status', sizing: 'flex', width: 1 }, // weight of 1
//   ]);
//
//   // columnWidths.get('select') → 32 (always)
//   // columnWidths.get('url') → calculated based on remaining space
// =============================================================================

export type ColumnSizing = 'fixed' | 'flex';

export interface AnchorColumnDef {
  id: string;
  sizing: ColumnSizing;
  width: number; // fixed: pixel width, flex: relative weight
  minWidth?: number; // optional minimum for flex columns
  defaultWidth?: number; // optional default width for flex columns when overflow is needed
}

export interface UseAnchorColumnWidthsResult {
  /** Map of column ID to calculated pixel width */
  columnWidths: Map<string, number>;
  /** Current container width in pixels */
  containerWidth: number;
  /** Whether the initial measurement has completed */
  ready: boolean;
  /** Get width for a specific column */
  getWidth: (columnId: string) => number;
  /** Get style object for <col>, <th>, or <td> */
  getColumnStyle: (columnId: string) => { width: number; minWidth: number; maxWidth: number };
}

export function useAnchorColumnWidths(
  containerRef: RefObject<HTMLElement | null>,
  columns: AnchorColumnDef[],
  gap = 0
): UseAnchorColumnWidthsResult {
  const [containerWidth, setContainerWidth] = useState(0);
  const [ready, setReady] = useState(false);

  // Observe container size changes
  useEffect(() => {
    const el = containerRef.current;
    if (el === null) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry !== undefined) {
        setContainerWidth(entry.contentRect.width);
        setReady(true);
      }
    });

    observer.observe(el);

    // Initial measurement
    const initial = el.clientWidth;
    if (initial > 0) {
      setContainerWidth(initial);
      setReady(true);
    }

    return (): void => {
      observer.disconnect();
    };
  }, [containerRef]);

  // Calculate column widths
  const columnWidths = useMemo(() => {
    const widths = new Map<string, number>();

    if (containerWidth === 0) {
      // Return default widths before measurement
      columns.forEach((col) => {
        widths.set(col.id, col.sizing === 'fixed' ? col.width : 100);
      });
      return widths;
    }

    // 1. Calculate total fixed width
    const fixedColumns = columns.filter((c) => c.sizing === 'fixed');
    const fixedTotalWidth = fixedColumns.reduce((sum, c) => sum + c.width, 0);

    // 2. Calculate available width for flex columns
    const totalGap = gap * Math.max(0, columns.length - 1);
    const availableForFlex = Math.max(0, containerWidth - fixedTotalWidth - totalGap);

    // 3. Calculate total flex weight
    const flexColumns = columns.filter((c) => c.sizing === 'flex');
    const totalFlexWeight = flexColumns.reduce((sum, c) => sum + c.width, 0);

    // 4. First pass: calculate ideal widths and check minimums
    const flexWidths: Array<{ col: AnchorColumnDef; width: number }> = [];

    flexColumns.forEach((col) => {
      const proportion = col.width / totalFlexWeight;
      const idealWidth = Math.floor(availableForFlex * proportion);
      const minWidth = col.minWidth ?? 50;

      if (idealWidth < minWidth) {
        flexWidths.push({ col, width: minWidth });
      } else {
        flexWidths.push({ col, width: idealWidth });
      }
    });

    // 5. Calculate total width with minimums respected
    const totalWithMinimums =
      fixedTotalWidth + flexWidths.reduce((sum, f) => sum + f.width, 0) + totalGap;
    const needsOverflow = totalWithMinimums > containerWidth;

    // 6. Assign all widths
    columns.forEach((col) => {
      if (col.sizing === 'fixed') {
        widths.set(col.id, col.width);
      } else {
        // When overflow is needed, use defaultWidth (original size) instead of compressed width
        if (needsOverflow && col.defaultWidth !== undefined) {
          const finalWidth = Math.max(col.minWidth ?? 50, col.defaultWidth);
          widths.set(col.id, finalWidth);
        } else {
          const flexInfo = flexWidths.find((f) => f.col.id === col.id);
          const assignedWidth = flexInfo?.width ?? 100;
          widths.set(col.id, assignedWidth);
        }
      }
    });

    // 7. Handle rounding errors - only adjust if NOT overflowing
    // When overflowing, we want to preserve minimum widths, not compress further
    if (!needsOverflow) {
      const calculatedTotal = Array.from(widths.values()).reduce((a, b) => a + b, 0);
      const diff = containerWidth - totalGap - calculatedTotal;

      if (diff !== 0 && flexColumns.length > 0) {
        const lastFlex = flexColumns[flexColumns.length - 1];
        if (lastFlex !== undefined) {
          const current = widths.get(lastFlex.id) ?? 0;
          widths.set(lastFlex.id, Math.max(lastFlex.minWidth ?? 50, current + diff));
        }
      }
    }

    return widths;
  }, [containerWidth, columns, gap]);

  // Helper to get width for a column
  const getWidth = (columnId: string): number => {
    return columnWidths.get(columnId) ?? 100;
  };

  // Helper to get style object for elements
  const getColumnStyle = (
    columnId: string
  ): { width: number; minWidth: number; maxWidth: number } => {
    const width = getWidth(columnId);
    return {
      width,
      minWidth: width,
      maxWidth: width,
    };
  };

  return {
    columnWidths,
    containerWidth,
    ready,
    getWidth,
    getColumnStyle,
  };
}

// =============================================================================
// Helper: Convert TanStack Table columns to AnchorColumnDef
// =============================================================================

interface TanStackColumnMeta {
  sizing?: ColumnSizing;
  width?: number;
  minWidth?: number;
}

/**
 * Extract anchor column definitions from TanStack Table column definitions.
 *
 * Expects columns to have meta: { sizing: 'fixed' | 'flex', width: number }
 * Defaults to flex with weight 1 if not specified.
 */
export function extractAnchorColumns(
  tanstackColumns: Array<{ id?: string; meta?: TanStackColumnMeta }>
): AnchorColumnDef[] {
  return tanstackColumns.map((col, index) => {
    const meta = col.meta;
    const id = col.id ?? `col_${String(index)}`;

    return {
      id,
      sizing: meta?.sizing ?? 'flex',
      width: meta?.width ?? (meta?.sizing === 'fixed' ? 100 : 1),
      minWidth: meta?.minWidth,
    };
  });
}

// =============================================================================
// Helper: Sticky position calculator for pinned columns
// =============================================================================

export interface PinnedColumn {
  id: string;
  pinned: 'left' | 'right' | false;
}

/**
 * Calculate sticky position styles for pinned columns.
 *
 * @param columnId - The ID of the column to style
 * @param allColumns - All columns with their pinning state
 * @param getWidth - Function to get column width by ID
 * @returns CSS properties for sticky positioning
 */
export function getStickyColumnStyle(
  columnId: string,
  allColumns: PinnedColumn[],
  getWidth: (id: string) => number
): React.CSSProperties {
  const colIndex = allColumns.findIndex((c) => c.id === columnId);
  const col = allColumns[colIndex];

  if (col === undefined || col.pinned === false) {
    return {};
  }

  if (col.pinned === 'left') {
    // Sum widths of all columns before this one that are also left-pinned
    let leftOffset = 0;
    for (let i = 0; i < colIndex; i++) {
      const c = allColumns[i];
      if (c?.pinned === 'left') {
        leftOffset += getWidth(c.id);
      }
    }
    return {
      position: 'sticky',
      left: leftOffset,
      zIndex: 1,
    };
  }

  // col.pinned must be 'right' at this point
  // Sum widths of all columns after this one that are also right-pinned
  let rightOffset = 0;
  for (let i = colIndex + 1; i < allColumns.length; i++) {
    const c = allColumns[i];
    if (c?.pinned === 'right') {
      rightOffset += getWidth(c.id);
    }
  }
  return {
    position: 'sticky',
    right: rightOffset,
    zIndex: 1,
  };
}
