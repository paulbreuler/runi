import { useState, useRef, useEffect } from 'react';
import { Download, Trash2, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { FilterBarVariant } from './FilterBar';

interface FilterBarActionsProps {
  /** Display variant */
  variant: FilterBarVariant;
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
 * FilterBarActions - Action buttons for the filter bar with responsive variants.
 *
 * Uses a composite/split button pattern for Save actions:
 * - Primary button: "Save Selected" (most common action)
 * - Dropdown arrow: Shows "Save All" option
 *
 * Variants:
 * - full: All buttons with labels
 * - compact: All buttons with labels (same as full for actions)
 * - icon: Icon-only buttons with tooltips
 */
export const FilterBarActions = ({
  variant,
  onSaveAll,
  onSaveSelection,
  onClearAll,
  isSaveSelectionDisabled,
}: FilterBarActionsProps): React.JSX.Element => {
  const isIconMode = variant === 'icon';
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const dropdown = dropdownRef.current;
      if (dropdown !== null && !dropdown.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return (): void => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isDropdownOpen]);

  const handleSaveSelected = (): void => {
    if (!isSaveSelectionDisabled) {
      onSaveSelection();
      setIsDropdownOpen(false);
    }
  };

  const handleSaveAll = (): void => {
    onSaveAll();
    setIsDropdownOpen(false);
  };

  if (isIconMode) {
    // Icon-only mode - use simple button with tooltip (Save Selected only)
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onSaveSelection}
          disabled={isSaveSelectionDisabled}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded transition-colors',
            isSaveSelectionDisabled
              ? 'text-text-muted/50 cursor-not-allowed'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-raised/50'
          )}
          title="Save selected entries"
          aria-label="Save selected entries"
        >
          <Download size={14} />
        </button>
        <button
          type="button"
          onClick={onClearAll}
          className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:text-signal-error hover:bg-signal-error/10 transition-colors border border-transparent hover:border-signal-error/20"
          title="Delete all network history entries (cannot be undone)"
          aria-label="Delete all network history entries"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  }

  // Full/compact mode - use composite button for Save actions
  return (
    <div className="flex items-center gap-1">
      {/* Composite Save button */}
      <div ref={dropdownRef} className="relative inline-flex">
        {/* Primary button - Save Selected */}
        <button
          type="button"
          onClick={handleSaveSelected}
          disabled={isSaveSelectionDisabled}
          className={cn(
            'px-2 py-1 text-xs rounded-l rounded-r-none transition-colors flex items-center gap-1',
            isSaveSelectionDisabled
              ? 'text-text-muted/50 cursor-not-allowed bg-bg-surface border border-border-subtle border-r-0'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-raised/50 bg-bg-surface border border-border-subtle border-r-0'
          )}
          title="Save selected entries"
        >
          <Download size={12} />
          <span>Save Selected</span>
        </button>

        {/* Dropdown trigger */}
        <button
          type="button"
          onClick={() => {
            setIsDropdownOpen(!isDropdownOpen);
          }}
          className="px-1 py-1 text-xs rounded-r rounded-l-none text-text-muted hover:text-text-primary hover:bg-bg-raised/50 transition-colors bg-bg-surface border border-border-subtle border-l-0 flex items-center"
          aria-label="Save options"
          aria-expanded={isDropdownOpen}
        >
          <ChevronDown
            size={12}
            className={cn('transition-transform', isDropdownOpen && 'rotate-180')}
          />
        </button>

        {/* Dropdown menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] bg-bg-surface border border-border-default rounded shadow-lg overflow-hidden">
            <button
              type="button"
              onClick={handleSaveSelected}
              disabled={isSaveSelectionDisabled}
              className={cn(
                'w-full px-3 py-1.5 text-xs text-left flex items-center gap-2 transition-colors',
                isSaveSelectionDisabled
                  ? 'text-text-muted/50 cursor-not-allowed'
                  : 'text-text-secondary hover:bg-bg-raised hover:text-text-primary'
              )}
            >
              <Download size={12} />
              <span>Save Selected</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="w-full px-3 py-1.5 text-xs text-left flex items-center gap-2 text-text-secondary hover:bg-bg-raised hover:text-text-primary transition-colors"
            >
              <Download size={12} />
              <span>Save All</span>
            </button>
          </div>
        )}
      </div>

      {/* Clear button */}
      <button
        type="button"
        onClick={onClearAll}
        className="px-2 py-1 text-xs rounded text-text-muted hover:text-signal-error hover:bg-signal-error/10 transition-colors flex items-center gap-1 border border-transparent hover:border-signal-error/20"
        title="Delete all network history entries (cannot be undone)"
        aria-label="Delete all network history entries"
      >
        <Trash2 size={12} />
        <span>Delete All</span>
      </button>
    </div>
  );
};
