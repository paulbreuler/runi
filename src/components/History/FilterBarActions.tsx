/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { Download, Trash2, ArrowDownToLine } from 'lucide-react';
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
  /** Whether auto-scroll is enabled */
  autoScroll: boolean;
  /** Toggle auto-scroll behavior */
  onAutoScrollToggle: () => void;
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
  autoScroll,
  onAutoScrollToggle,
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
        {/* Auto-scroll toggle: filled = ON, outline = OFF */}
        <Button
          type="button"
          onClick={onAutoScrollToggle}
          variant={autoScroll ? 'default' : 'outline'}
          size="icon-xs"
          title={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
          aria-label={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
          aria-pressed={autoScroll}
        >
          <ArrowDownToLine size={14} />
        </Button>
        <Button
          type="button"
          onClick={onClearAll}
          variant="destructive-outline"
          size="icon-xs"
          title="Delete all network history entries (cannot be undone)"
          aria-label="Delete all network history entries"
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
      {/* Auto-scroll toggle: filled = ON, outline = OFF */}
      <Button
        type="button"
        onClick={onAutoScrollToggle}
        variant={autoScroll ? 'default' : 'outline'}
        size="xs"
        title={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
        aria-pressed={autoScroll}
      >
        <ArrowDownToLine size={12} />
        <span>Auto</span>
      </Button>
      <Button
        type="button"
        onClick={onClearAll}
        variant="destructive-outline"
        size="xs"
        title="Delete all network history entries (cannot be undone)"
        aria-label="Delete all network history entries"
      >
        <Trash2 size={12} />
        <span>Delete All</span>
      </Button>
    </ActionBarGroup>
  );
};
