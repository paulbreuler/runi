/**
 * @file TableHeaderRow component
 * @description Renders table header row with column headers
 */

import * as React from 'react';
import { flexRender, type HeaderGroup } from '@tanstack/react-table';
import { cn } from '@/utils/cn';

/**
 * Gets the appropriate padding class for a column based on its ID.
 */
function getCellPaddingClass(columnId: string): string {
  if (columnId === 'select') {
    return 'px-2 py-2';
  }
  if (columnId === 'expand') {
    return 'px-2 py-2';
  }
  if (columnId === 'method') {
    return 'px-3 py-2';
  }
  if (columnId === 'actions') {
    return 'px-3 py-2';
  }
  return 'px-3 py-2';
}

interface TableHeaderCellProps<TData> {
  header: HeaderGroup<TData>['headers'][0];
  paddingClass: string;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Renders a single header cell.
 */
export function TableHeaderCell<TData>({
  header,
  paddingClass,
  style,
  className,
}: TableHeaderCellProps<TData>): React.ReactElement {
  return (
    <th
      key={header.id}
      className={cn(
        paddingClass,
        'text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border-default overflow-hidden',
        'bg-bg-app',
        className
      )}
      style={style}
      role="columnheader"
    >
      {header.isPlaceholder
        ? null
        : flexRender(header.column.columnDef.header, header.getContext())}
    </th>
  );
}

interface TableHeaderRowProps<TData> {
  /** The header group from TanStack Table */
  headerGroup: HeaderGroup<TData>;
  /** Optional style for sticky positioning */
  getHeaderStyle?: (header: HeaderGroup<TData>['headers'][0]) => React.CSSProperties | undefined;
  /** Optional className for the row */
  className?: string;
}

/**
 * Renders a table header row with all column headers.
 * Headers are uppercase with proper spacing and can be sticky when scrolling.
 *
 * @example
 * ```tsx
 * <TableHeaderRow
 *   headerGroup={table.getHeaderGroups()[0]}
 *   getHeaderStyle={(header) => ({
 *     position: 'sticky',
 *     top: 0,
 *     zIndex: 10,
 *   })}
 * />
 * ```
 */
export function TableHeaderRow<TData>({
  headerGroup,
  getHeaderStyle,
  className,
}: TableHeaderRowProps<TData>): React.ReactElement {
  return (
    <tr key={headerGroup.id} className={className}>
      {headerGroup.headers.map((header) => {
        const paddingClass = getCellPaddingClass(header.column.id);
        const style = getHeaderStyle?.(header);

        return (
          <TableHeaderCell
            key={header.id}
            header={header}
            paddingClass={paddingClass}
            style={style}
          />
        );
      })}
    </tr>
  );
}
