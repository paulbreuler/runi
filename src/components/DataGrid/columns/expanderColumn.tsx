/**
 * @file Expander column helper
 * @description Creates an expander column for TanStack Table with Motion animation
 *
 * This column helper integrates with TanStack Table's row expansion API and
 * renders animated chevron buttons that rotate 90 degrees when expanded.
 */

import type { ColumnDef, Row, CellContext } from '@tanstack/react-table';
import { motion, useReducedMotion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Options for customizing the expander column
 */
export interface ExpanderColumnOptions<TData> {
  /** Column ID (defaults to 'expand') */
  id?: string;

  /** Function to determine if a row can be expanded */
  canExpand?: (row: TData) => boolean;

  /** Size of the chevron icon (defaults to 14 to match Network panel) */
  iconSize?: number;
}

/**
 * Cell component for the expander column
 */
interface ExpanderCellProps<TData> {
  row: Row<TData>;
  iconSize: number;
}

const ExpanderCell = <TData,>({
  row,
  iconSize,
}: ExpanderCellProps<TData>): React.ReactElement | null => {
  const shouldReduceMotion = useReducedMotion();
  const isExpanded = row.getIsExpanded();
  const canExpand = row.getCanExpand();

  if (!canExpand) {
    return null;
  }

  const handleClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    row.toggleExpanded();
  };

  return (
    <button
      data-testid="expand-button"
      type="button"
      onClick={handleClick}
      className={cn(
        'p-0 rounded transition-colors',
        'hover:bg-bg-raised',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple focus-visible:ring-offset-1'
      )}
      aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
      aria-expanded={isExpanded}
    >
      <motion.span
        className="flex items-center justify-center text-text-secondary"
        animate={{
          rotate: isExpanded ? 90 : 0,
        }}
        transition={
          shouldReduceMotion === true
            ? { duration: 0 }
            : {
                type: 'spring',
                stiffness: 500,
                damping: 30,
              }
        }
      >
        <ChevronRight size={iconSize} />
      </motion.span>
    </button>
  );
};

/**
 * Creates an expander column for TanStack Table
 *
 * @example
 * ```tsx
 * const columns = [
 *   createExpanderColumn<MyRowType>({
 *     canExpand: (row) => row.hasDetails,
 *   }),
 *   // ... other columns
 * ];
 * ```
 */
export function createExpanderColumn<TData>(
  options: ExpanderColumnOptions<TData> = {}
): ColumnDef<TData> {
  const { id = 'expand', iconSize = 14 } = options;

  return {
    id,
    header: undefined, // No header for expander column
    cell: ({ row }: CellContext<TData, unknown>) => <ExpanderCell row={row} iconSize={iconSize} />,
    // Disable sorting for expander column
    enableSorting: false,
    // Disable filtering for expander column
    enableColumnFilter: false,
    // Fixed width for expander column
    size: 24,
    minSize: 24,
    maxSize: 24,
  };
}
