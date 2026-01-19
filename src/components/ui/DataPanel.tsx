import * as React from 'react';
import { DataPanelHeader, type DataPanelColumn } from './DataPanelHeader';
import { cn } from '@/utils/cn';

export interface DataPanelHeaderConfig {
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
}

export interface DataPanelProps<T> {
  /** Items to display */
  items: T[];
  /** Render function for each row */
  renderRow: (item: T, index: number) => React.ReactNode;
  /** Header configuration */
  header?: DataPanelHeaderConfig;
  /** Empty state component */
  emptyState?: React.ReactNode;
  /** Container class name */
  className?: string;
  /** Scroll container ref (for auto-scroll, etc.) */
  scrollRef?: React.RefObject<HTMLDivElement>;
  /** Whether to show header only when items exist (default: false) */
  showHeaderOnlyWhenItemsExist?: boolean;
}

/**
 * DataPanel - A generic, reusable panel component for displaying lists of data.
 *
 * Features:
 * - Generic type parameter for flexible item types
 * - Configurable header with select all functionality
 * - Pluggable row renderer (composition over inheritance)
 * - Empty state support
 * - Scroll container with ref forwarding
 *
 * @example
 * ```tsx
 * <DataPanel
 *   items={logs}
 *   renderRow={(log, index) => (
 *     <LogRow key={log.id} log={log} index={index} />
 *   )}
 *   header={{
 *     columns: [
 *       { label: 'Level', className: 'text-xs' },
 *       { label: 'Message', className: 'flex-1' },
 *     ],
 *     allSelected: allLogsSelected,
 *     onSelectAllChange: handleSelectAll,
 *   }}
 *   emptyState={<EmptyState message="No logs yet" />}
 * />
 * ```
 */
export function DataPanel<T>({
  items,
  renderRow,
  header,
  emptyState,
  className,
  scrollRef,
  showHeaderOnlyWhenItemsExist = false,
}: DataPanelProps<T>): React.ReactElement {
  const hasItems = items.length > 0;

  // Determine if header should be shown
  const shouldShowHeader =
    header !== undefined && header.enabled !== false && (!showHeaderOnlyWhenItemsExist || hasItems);

  return (
    <div className={cn('flex flex-col min-h-0', className)}>
      {shouldShowHeader && (
        <DataPanelHeader
          columns={header.columns}
          showSelectAll={header.showSelectAll}
          allSelected={header.allSelected}
          someSelected={header.someSelected}
          onSelectAllChange={header.onSelectAllChange}
          enabled={true}
        />
      )}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        {hasItems ? items.map((item, index) => renderRow(item, index)) : emptyState}
      </div>
    </div>
  );
}
