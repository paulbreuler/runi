/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SplitButton } from '@/components/ui/SplitButton';
import { ActionBarGroup, useOptionalActionBarContext } from '@/components/ActionBar';

interface FilterBarActionsProps {
  /** Callback to save all entries */
  onSaveAll: () => void;
  /** Callback to save selected entries */
  onSaveSelection: () => void;
  /** Callback to clear all history */
  onClearAll: () => Promise<void>;
  /** Whether save selection is disabled (no items selected) */
  isSaveSelectionDisabled: boolean;
}

/**
 * FilterBarActions - Action buttons for the filter bar.
 *
 * Now built on ActionBar primitives for consistent responsive behavior.
 *
 * Uses SplitButton for Save actions:
 * - When items selected: Primary button is "Save" (saves selection)
 * - When no selection: Primary button is "Save" (saves all)
 * - Dropdown: "Save Selection" and "Save All" options
 */
export const FilterBarActions = ({
  onSaveAll,
  onSaveSelection,
  onClearAll,
  isSaveSelectionDisabled,
}: FilterBarActionsProps): React.JSX.Element => {
  const context = useOptionalActionBarContext();
  const isIconMode = context?.variant === 'icon';

  // Determine primary action based on selection state
  const hasSelection = !isSaveSelectionDisabled;

  if (isIconMode) {
    // Icon-only mode - use SplitButton
    return (
      <ActionBarGroup align="end" aria-label="Actions">
        <SplitButton
          label="Save"
          icon={<Download size={12} />}
          onClick={hasSelection ? onSaveSelection : onSaveAll}
          variant="ghost"
          size="xs"
          dropdownAriaLabel="More save options"
          data-test-id="history-save"
          items={[
            {
              id: 'save-selection',
              label: 'Save Selection',
              icon: <Download size={12} />,
              onClick: onSaveSelection,
              disabled: isSaveSelectionDisabled,
            },
            {
              id: 'save-all',
              label: 'Save All',
              icon: <Download size={12} />,
              onClick: onSaveAll,
            },
          ]}
        />
        <Button
          type="button"
          onClick={onClearAll}
          variant="destructive-outline"
          size="icon-xs"
          title="Delete all network history entries (cannot be undone)"
          aria-label="Delete all network history entries"
          data-test-id="history-delete-all"
        >
          <Trash2 size={14} />
        </Button>
      </ActionBarGroup>
    );
  }

  // Full/compact mode - use SplitButton for Save actions
  return (
    <ActionBarGroup align="end" aria-label="Actions">
      <SplitButton
        label="Save"
        icon={<Download size={12} />}
        onClick={hasSelection ? onSaveSelection : onSaveAll}
        variant="ghost"
        size="xs"
        dropdownAriaLabel="More save options"
        data-test-id="history-save"
        items={[
          {
            id: 'save-selection',
            label: 'Save Selection',
            icon: <Download size={12} />,
            onClick: onSaveSelection,
            disabled: isSaveSelectionDisabled,
          },
          {
            id: 'save-all',
            label: 'Save All',
            icon: <Download size={12} />,
            onClick: onSaveAll,
          },
        ]}
      />
      <Button
        type="button"
        onClick={onClearAll}
        variant="destructive-outline"
        size="xs"
        title="Delete all network history entries (cannot be undone)"
        aria-label="Delete all network history entries"
        data-test-id="history-delete-all"
      >
        <Trash2 size={12} />
        <span>Delete All</span>
      </Button>
    </ActionBarGroup>
  );
};
