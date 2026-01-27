/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import {
  AlertCircle,
  AlertTriangle,
  Info,
  Terminal,
  Trash2,
  Download,
  Copy as CopyIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SplitButton } from '@/components/ui/SplitButton';
import {
  ActionBar,
  ActionBarGroup,
  ActionBarSegment,
  ActionBarSearch,
  useOptionalActionBarContext,
} from '@/components/ActionBar';
import type { LogLevel } from '@/types/console';

interface ConsoleToolbarProps {
  /** Current filter level */
  filter: LogLevel | 'all';
  /** Callback when filter changes */
  onFilterChange: (level: LogLevel | 'all') => void;
  /** Current full-text search filter */
  searchFilter: string;
  /** Callback when search filter changes */
  onSearchFilterChange: (value: string) => void;
  /** Clear all logs */
  onClear: () => void;
  /** Save all logs */
  onSaveAll: () => void;
  /** Save selected logs */
  onSaveSelection: () => void;
  /** Copy selected logs */
  onCopySelection: () => void;
  /** Number of selected logs */
  selectedCount: number;
  /** Log counts by level */
  counts: Record<LogLevel, number>;
  /** Total log count */
  totalCount: number;
}

/**
 * Inner component that uses the ActionBar context
 */
const ConsoleToolbarActions = ({
  onClear,
  onSaveAll,
  onSaveSelection,
  onCopySelection,
  selectedCount,
}: Pick<
  ConsoleToolbarProps,
  'onClear' | 'onSaveAll' | 'onSaveSelection' | 'onCopySelection' | 'selectedCount'
>): React.JSX.Element => {
  const context = useOptionalActionBarContext();
  const isIconMode = context?.variant === 'icon';

  if (isIconMode) {
    return (
      <ActionBarGroup align="end" aria-label="Actions">
        <SplitButton
          label="Save"
          icon={<Download size={12} />}
          onClick={selectedCount > 0 ? onSaveSelection : onSaveAll}
          variant="ghost"
          size="xs"
          dropdownAriaLabel="More save options"
          items={[
            {
              id: 'save-selection',
              label: 'Save Selection',
              icon: <Download size={12} />,
              onClick: onSaveSelection,
              disabled: selectedCount === 0,
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
          onClick={onCopySelection}
          disabled={selectedCount === 0}
          variant="ghost"
          size="icon-xs"
          title="Copy selected logs"
          aria-label="Copy selected logs"
        >
          <CopyIcon size={14} />
        </Button>
        <Button
          type="button"
          onClick={onClear}
          variant="destructive-outline"
          size="icon-xs"
          title="Clear console"
          aria-label="Clear console"
        >
          <Trash2 size={14} />
        </Button>
      </ActionBarGroup>
    );
  }

  // Full/compact mode with labels
  return (
    <ActionBarGroup align="end" aria-label="Actions">
      <SplitButton
        label="Save"
        icon={<Download size={12} />}
        onClick={selectedCount > 0 ? onSaveSelection : onSaveAll}
        variant="ghost"
        size="xs"
        dropdownAriaLabel="More save options"
        items={[
          {
            id: 'save-selection',
            label: 'Save Selection',
            icon: <Download size={12} />,
            onClick: onSaveSelection,
            disabled: selectedCount === 0,
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
        onClick={onCopySelection}
        disabled={selectedCount === 0}
        variant="ghost"
        size="xs"
        title="Copy selected logs"
      >
        <CopyIcon size={12} />
        <span>Copy</span>
      </Button>
      <Button
        type="button"
        onClick={onClear}
        variant="destructive-outline"
        size="xs"
        title="Clear console"
      >
        <Trash2 size={12} />
        <span>Clear</span>
      </Button>
    </ActionBarGroup>
  );
};

/**
 * ConsoleToolbar - Toolbar for the Console Panel.
 *
 * Built on the ActionBar component system for consistency across panels.
 * Includes log level filters, full-text search, and action buttons.
 */
export const ConsoleToolbar = ({
  filter,
  onFilterChange,
  searchFilter,
  onSearchFilterChange,
  onClear,
  onSaveAll,
  onSaveSelection,
  onCopySelection,
  selectedCount,
  counts,
  totalCount,
}: ConsoleToolbarProps): React.JSX.Element => {
  return (
    <ActionBar breakpoints={[700, 500]} aria-label="Console toolbar">
      <ActionBarGroup aria-label="Log filters">
        <ActionBarSegment
          value={filter}
          onValueChange={onFilterChange}
          options={[
            { value: 'all', label: `All (${String(totalCount)})` },
            {
              value: 'error',
              label: 'Errors',
              icon: <AlertCircle size={12} className="text-signal-error" />,
              badge: counts.error,
            },
            {
              value: 'warn',
              label: 'Warnings',
              icon: <AlertTriangle size={12} className="text-signal-warning" />,
              badge: counts.warn,
            },
            {
              value: 'info',
              label: 'Info',
              icon: <Info size={12} className="text-accent-blue" />,
              badge: counts.info,
            },
            {
              value: 'debug',
              label: 'Debug',
              icon: <Terminal size={12} className="text-text-muted" />,
              badge: counts.debug,
            },
          ]}
          aria-label="Filter by log level"
        />
        <ActionBarSearch
          value={searchFilter}
          onChange={onSearchFilterChange}
          placeholder="Search logs..."
          aria-label="Search logs"
        />
      </ActionBarGroup>

      <ConsoleToolbarActions
        onClear={onClear}
        onSaveAll={onSaveAll}
        onSaveSelection={onSaveSelection}
        onCopySelection={onCopySelection}
        selectedCount={selectedCount}
      />
    </ActionBar>
  );
};
