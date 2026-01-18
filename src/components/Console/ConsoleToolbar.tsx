import {
  AlertCircle,
  AlertTriangle,
  Info,
  Terminal,
  Trash2,
  Download,
  Copy as CopyIcon,
  ArrowDownToLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  /** Current correlation ID filter */
  correlationIdFilter: string;
  /** Callback when correlation ID filter changes */
  onCorrelationIdFilterChange: (value: string) => void;
  /** Whether auto-scroll is enabled */
  autoScroll: boolean;
  /** Toggle auto-scroll */
  onAutoScrollToggle: () => void;
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
  autoScroll,
  onAutoScrollToggle,
  onClear,
  onSaveAll,
  onSaveSelection,
  onCopySelection,
  selectedCount,
}: Pick<
  ConsoleToolbarProps,
  | 'autoScroll'
  | 'onAutoScrollToggle'
  | 'onClear'
  | 'onSaveAll'
  | 'onSaveSelection'
  | 'onCopySelection'
  | 'selectedCount'
>): React.JSX.Element => {
  const context = useOptionalActionBarContext();
  const isIconMode = context?.variant === 'icon';

  if (isIconMode) {
    return (
      <ActionBarGroup align="end" aria-label="Actions">
        <Button
          type="button"
          onClick={onSaveAll}
          variant="ghost"
          size="icon-xs"
          title="Save all logs"
          aria-label="Save all logs"
        >
          <Download size={14} />
        </Button>
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
          onClick={onAutoScrollToggle}
          variant={autoScroll ? 'default' : 'outline'}
          size="icon-xs"
          title="Auto-scroll"
          aria-label="Auto-scroll"
          aria-pressed={autoScroll}
        >
          <ArrowDownToLine size={14} />
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
      <Button type="button" onClick={onSaveAll} variant="ghost" size="xs" title="Save all logs">
        <Download size={12} />
        <span>Save All</span>
      </Button>
      <Button
        type="button"
        onClick={onSaveSelection}
        disabled={selectedCount === 0}
        variant="ghost"
        size="xs"
        title="Save selected logs"
      >
        <Download size={12} />
        <span>Save Selection</span>
      </Button>
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
        onClick={onAutoScrollToggle}
        variant={autoScroll ? 'default' : 'outline'}
        size="xs"
        title="Auto-scroll"
        aria-pressed={autoScroll}
      >
        <ArrowDownToLine size={12} />
        <span>Auto</span>
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
 * Includes log level filters, correlation ID search, and action buttons.
 */
export const ConsoleToolbar = ({
  filter,
  onFilterChange,
  correlationIdFilter,
  onCorrelationIdFilterChange,
  autoScroll,
  onAutoScrollToggle,
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
            },
            {
              value: 'debug',
              label: 'Debug',
              icon: <Terminal size={12} className="text-text-muted" />,
            },
          ]}
          aria-label="Filter by log level"
        />
        <ActionBarSearch
          value={correlationIdFilter}
          onChange={onCorrelationIdFilterChange}
          placeholder="Correlation ID..."
          aria-label="Filter by correlation ID"
        />
      </ActionBarGroup>

      <ConsoleToolbarActions
        autoScroll={autoScroll}
        onAutoScrollToggle={onAutoScrollToggle}
        onClear={onClear}
        onSaveAll={onSaveAll}
        onSaveSelection={onSaveSelection}
        onCopySelection={onCopySelection}
        selectedCount={selectedCount}
      />
    </ActionBar>
  );
};
