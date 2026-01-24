/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { HistoryFilters } from '@/types/history';
import { ActionBar, type ActionBarVariant } from '@/components/ActionBar';
import { NetworkHistoryFilters } from './NetworkHistoryFilters';
import { FilterBarActions } from './FilterBarActions';

// Re-export for backward compatibility
export type FilterBarVariant = ActionBarVariant;

export interface FilterBarProps {
  /** Current filter state */
  filters: HistoryFilters;
  /** Update a filter value */
  onFilterChange: (key: keyof HistoryFilters, value: string) => void;
  /** Number of selected entries */
  selectedCount: number;
  /** Callback when user clicks Compare Selected button */
  onCompareResponses?: () => void;
  /** Callback to save all entries */
  onSaveAll: () => void;
  /** Callback to save selected entries */
  onSaveSelection: () => void;
  /** Callback to clear all history */
  onClearAll: () => Promise<void>;
  /** Whether save selection is disabled */
  isSaveSelectionDisabled: boolean;
}

/**
 * FilterBar - Responsive filter bar with horizontal scroll and collapsing.
 *
 * Now built on the ActionBar component system for consistency across panels.
 *
 * Features:
 * - Responsive breakpoints: full (>800px), compact (600-800px), icon (<600px)
 * - Horizontal scroll when content overflows
 * - Touch/swipe gesture support
 * - Scroll gradient cues
 */
export const FilterBar = ({
  filters,
  onFilterChange,
  selectedCount,
  onCompareResponses,
  onSaveAll,
  onSaveSelection,
  onClearAll,
  isSaveSelectionDisabled,
}: FilterBarProps): React.JSX.Element => {
  return (
    <ActionBar breakpoints={[800, 600]} aria-label="Network history filter bar">
      <NetworkHistoryFilters
        filters={filters}
        onFilterChange={onFilterChange}
        selectedCount={selectedCount}
        onCompareResponses={onCompareResponses}
      />
      <FilterBarActions
        onSaveAll={onSaveAll}
        onSaveSelection={onSaveSelection}
        onClearAll={onClearAll}
        isSaveSelectionDisabled={isSaveSelectionDisabled}
      />
    </ActionBar>
  );
};
