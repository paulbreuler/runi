/**
 * @file Selection column helper
 * @description Creates a selection column for TanStack Table using the existing Checkbox component
 *
 * This column helper integrates with TanStack Table's row selection API and
 * renders checkboxes in both header (select all) and cells (select row).
 */

import type { ColumnDef, Table, Row, HeaderContext, CellContext } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { COLUMN_WIDTHS } from '@/components/DataGrid/constants';

/**
 * Options for customizing the selection column
 */
export interface SelectionColumnOptions {
  /** Column ID (defaults to 'select') */
  id?: string;

  /** Enable select all functionality in header */
  enableSelectAll?: boolean;

  /** Size of the checkbox (sm, default, lg) */
  size?: 'sm' | 'default' | 'lg';
}

/**
 * Header component for the selection column
 */
interface SelectionHeaderProps<TData> {
  table: Table<TData>;
  size?: 'sm' | 'default' | 'lg';
}

const SelectionHeader = <TData,>({
  table,
  size,
}: SelectionHeaderProps<TData>): React.ReactElement => {
  const isAllSelected = table.getIsAllRowsSelected();
  const isSomeSelected = table.getIsSomeRowsSelected();

  // Determine checked state for header checkbox
  const getCheckedState = (): CheckedState => {
    if (isAllSelected) {
      return true;
    }
    if (isSomeSelected) {
      return 'indeterminate';
    }
    return false;
  };

  const handleCheckedChange = (): void => {
    table.toggleAllRowsSelected(!isAllSelected);
  };

  return (
    <Checkbox
      checked={getCheckedState()}
      onCheckedChange={handleCheckedChange}
      aria-label={isAllSelected ? 'Deselect all rows' : 'Select all rows'}
      size={size}
    />
  );
};

/**
 * Cell component for the selection column
 */
interface SelectionCellProps<TData> {
  row: Row<TData>;
  size?: 'sm' | 'default' | 'lg';
}

const SelectionCell = <TData,>({ row, size }: SelectionCellProps<TData>): React.ReactElement => {
  const isSelected = row.getIsSelected();

  const handleCheckedChange = (): void => {
    row.toggleSelected(!isSelected);
  };

  return (
    <Checkbox
      checked={isSelected}
      onCheckedChange={handleCheckedChange}
      aria-label={isSelected ? 'Deselect row' : 'Select row'}
      size={size}
    />
  );
};

/**
 * Creates a selection column for TanStack Table
 *
 * @example
 * ```tsx
 * const columns = [
 *   createSelectionColumn<MyRowType>(),
 *   // ... other columns
 * ];
 * ```
 */
export function createSelectionColumn<TData>(
  options: SelectionColumnOptions = {}
): ColumnDef<TData> {
  const { id = 'select', enableSelectAll = true, size } = options;

  return {
    id,
    header: enableSelectAll
      ? ({ table }: HeaderContext<TData, unknown>): React.ReactElement => (
          <SelectionHeader table={table} size={size} />
        )
      : undefined,
    cell: ({ row }: CellContext<TData, unknown>) => <SelectionCell row={row} size={size} />,
    // Disable sorting for selection column
    enableSorting: false,
    // Disable filtering for selection column
    enableColumnFilter: false,
    // Disable resizing for selection column (fixed width)
    enableResizing: false,
    // Fixed width for selection column (32px)
    size: COLUMN_WIDTHS.SELECTION,
    minSize: COLUMN_WIDTHS.SELECTION,
    maxSize: COLUMN_WIDTHS.SELECTION,
  };
}
