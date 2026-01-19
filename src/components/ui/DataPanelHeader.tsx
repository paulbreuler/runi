import * as React from 'react';
import { Checkbox } from './checkbox';
import { cn } from '@/utils/cn';

export interface DataPanelColumn {
  /** Column label text */
  label: string;
  /** Optional className for the column */
  className?: string;
  /** Optional width class (e.g., 'w-24', 'w-32') */
  width?: string;
}

export interface DataPanelHeaderProps {
  /** Column definitions for header labels */
  columns: DataPanelColumn[];
  /** Whether select all checkbox is shown (default: true) */
  showSelectAll?: boolean;
  /** Whether all items are selected */
  allSelected: boolean;
  /** Whether some (but not all) items are selected (indeterminate) */
  someSelected?: boolean;
  /** Callback when select all is toggled */
  onSelectAllChange?: (checked: boolean) => void;
  /** Whether header is enabled/visible (default: true) */
  enabled?: boolean;
  /** Additional header content (e.g., extra buttons) */
  children?: React.ReactNode;
  /** Additional className for the header container */
  className?: string;
}

/**
 * DataPanelHeader - A reusable header component for data panels.
 *
 * Features:
 * - Optional select all checkbox with indeterminate state
 * - Configurable column labels with custom widths and styles
 * - Can be enabled/disabled
 * - Supports additional children content
 *
 * @example
 * ```tsx
 * <DataPanelHeader
 *   columns={[
 *     { label: 'Level', className: 'text-xs' },
 *     { label: 'Message', className: 'flex-1 text-xs' },
 *     { label: 'Time', className: 'w-24 text-right text-xs' },
 *   ]}
 *   showSelectAll={true}
 *   allSelected={allItemsSelected}
 *   someSelected={someItemsSelected}
 *   onSelectAllChange={(checked) => {
 *     if (checked) selectAll();
 *     else deselectAll();
 *   }}
 * />
 * ```
 */
export const DataPanelHeader: React.FC<DataPanelHeaderProps> = ({
  columns,
  showSelectAll = true,
  allSelected,
  someSelected = false,
  onSelectAllChange,
  enabled = true,
  children,
  className,
}) => {
  // Don't render if disabled
  if (!enabled) {
    return null;
  }

  // Determine checkbox state
  const getCheckboxState = (): boolean | 'indeterminate' => {
    if (allSelected) {
      return true;
    }
    if (someSelected) {
      return 'indeterminate';
    }
    return false;
  };
  const checkboxState = getCheckboxState();

  const handleCheckedChange = (checked: boolean | 'indeterminate'): void => {
    if (checked === 'indeterminate') {
      // When clicking indeterminate, select all
      onSelectAllChange?.(true);
    } else {
      onSelectAllChange?.(checked);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-2 py-1.5',
        'border-b border-border-subtle',
        'bg-bg-raised/50',
        'text-xs font-medium text-text-muted',
        'shrink-0',
        className
      )}
    >
      {showSelectAll && (
        <Checkbox
          checked={checkboxState}
          onCheckedChange={handleCheckedChange}
          aria-label={allSelected ? 'Deselect all' : 'Select all'}
        />
      )}
      {columns.map((column, index) => (
        <span key={index} className={cn(column.width, column.className)}>
          {column.label}
        </span>
      ))}
      {children}
    </div>
  );
};
