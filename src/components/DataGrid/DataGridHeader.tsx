/**
 * @file DataGridHeader component
 * @description Maps TanStack Table headers to DataPanelHeader for consistent UI
 *
 * This component bridges TanStack Table's header API with the existing
 * DataPanelHeader component, maintaining visual consistency across the app.
 */

import * as React from 'react';
import type { Table } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import { DataPanelHeader, type DataPanelColumn } from '@/components/ui/DataPanelHeader';

/**
 * Props for the DataGridHeader component
 */
export interface DataGridHeaderProps<TData> {
  /** The TanStack Table instance */
  table: Table<TData>;

  /** Show the select all checkbox */
  showSelectAll?: boolean;

  /** Callback when select all checkbox changes */
  onSelectAllChange?: (checked: boolean) => void;

  /** Custom className for the header */
  className?: string;

  /** Additional children to render after columns */
  children?: React.ReactNode;
}

/**
 * Maps TanStack Table headers to DataPanelHeader
 *
 * @example
 * ```tsx
 * <DataGridHeader
 *   table={table}
 *   showSelectAll
 *   onSelectAllChange={(checked) => table.toggleAllRowsSelected(checked)}
 * />
 * ```
 */
export function DataGridHeader<TData>({
  table,
  showSelectAll = false,
  onSelectAllChange,
  className,
  children,
}: DataGridHeaderProps<TData>): React.ReactElement {
  // Get selection state from table
  const isAllSelected = table.getIsAllRowsSelected();
  const isSomeSelected = table.getIsSomeRowsSelected();

  // Map TanStack headers to DataPanelColumn format
  const columns: DataPanelColumn[] = React.useMemo(() => {
    const headerGroups = table.getHeaderGroups();
    if (headerGroups.length === 0) {
      return [];
    }

    const firstHeaderGroup = headerGroups[0];
    if (firstHeaderGroup === undefined) {
      return [];
    }

    return firstHeaderGroup.headers
      .filter((header) => {
        // Skip the selection column - it's handled by showSelectAll
        return header.id !== 'select';
      })
      .map((header) => ({
        label: header.isPlaceholder
          ? ''
          : flexRender(header.column.columnDef.header, header.getContext()),
        width: `w-[${String(header.getSize())}px]`,
      }));
  }, [table]);

  // Handle select all change
  const handleSelectAllChange = (checked: boolean): void => {
    if (onSelectAllChange !== undefined) {
      onSelectAllChange(checked);
    } else {
      table.toggleAllRowsSelected(checked);
    }
  };

  return (
    <DataPanelHeader
      columns={columns}
      showSelectAll={showSelectAll}
      allSelected={isAllSelected}
      someSelected={isSomeSelected}
      onSelectAllChange={handleSelectAllChange}
      className={className}
    >
      {children}
    </DataPanelHeader>
  );
}
