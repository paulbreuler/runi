import { Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ActionBarGroup,
  ActionBarCompositeButton,
  useOptionalActionBarContext,
} from '@/components/ActionBar';

interface FilterBarActionsProps {
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
 * FilterBarActions - Action buttons for the filter bar.
 *
 * Now built on ActionBar primitives for consistent responsive behavior.
 *
 * Uses ActionBarCompositeButton for Save actions:
 * - Primary button: "Save Selected" (most common action)
 * - Dropdown arrow: Shows "Save All" option
 */
export const FilterBarActions = ({
  onSaveAll,
  onSaveSelection,
  onClearAll,
  isSaveSelectionDisabled,
}: FilterBarActionsProps): React.JSX.Element => {
  const context = useOptionalActionBarContext();
  const isIconMode = context?.variant === 'icon';

  if (isIconMode) {
    // Icon-only mode - use simple buttons
    return (
      <ActionBarGroup align="end" aria-label="Actions">
        <Button
          type="button"
          onClick={onSaveSelection}
          disabled={isSaveSelectionDisabled}
          variant="ghost"
          size="icon-xs"
          title="Save selected entries"
          aria-label="Save selected entries"
        >
          <Download size={14} />
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

  // Full/compact mode - use composite button for Save actions
  return (
    <ActionBarGroup align="end" aria-label="Actions">
      <ActionBarCompositeButton
        primary={{
          label: 'Save Selected',
          icon: <Download size={12} />,
          onClick: onSaveSelection,
          disabled: isSaveSelectionDisabled,
        }}
        options={[
          {
            label: 'Save Selected',
            icon: <Download size={12} />,
            onClick: onSaveSelection,
            disabled: isSaveSelectionDisabled,
          },
          {
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
      >
        <Trash2 size={12} />
        <span>Delete All</span>
      </Button>
    </ActionBarGroup>
  );
};
