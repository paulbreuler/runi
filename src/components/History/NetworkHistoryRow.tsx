import { ChevronRight, Copy, Play, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { cn } from '@/utils/cn';
import { type HttpMethod } from '@/utils/http-colors';
import { formatRelativeTime } from '@/utils/relative-time';
import type { NetworkHistoryEntry } from '@/types/history';
import { calculateWaterfallSegments } from '@/types/history';
import { IntelligenceSignals } from './IntelligenceSignals';
import { TimingWaterfall } from './TimingWaterfall';
import { Button } from '@/components/ui/button';

interface NetworkHistoryRowProps {
  /** The history entry to display */
  entry: NetworkHistoryEntry;
  /** Whether the row is expanded to show details */
  isExpanded: boolean;
  /** Whether the row is selected */
  isSelected: boolean;
  /** Toggle row expansion */
  onToggleExpand: (id: string) => void;
  /** Select this row */
  onSelect: (id: string) => void;
  /** Replay the request */
  onReplay: (entry: NetworkHistoryEntry) => void;
  /** Copy as cURL command */
  onCopyCurl: (entry: NetworkHistoryEntry) => void;
  /** Whether compare mode is active */
  compareMode?: boolean;
  /** Whether this row is selected for comparison */
  isCompareSelected?: boolean;
  /** Toggle this row's compare selection */
  onToggleCompare?: (id: string) => void;
  /** Delete this entry */
  onDelete?: (id: string) => void;
}

const methodColors: Record<string, string> = {
  GET: 'text-accent-blue',
  POST: 'text-signal-success',
  PUT: 'text-signal-warning',
  PATCH: 'text-signal-warning',
  DELETE: 'text-signal-error',
  HEAD: 'text-text-muted',
  OPTIONS: 'text-text-muted',
};

const methodBgColors: Record<string, string> = {
  GET: 'bg-accent-blue/10',
  POST: 'bg-signal-success/10',
  PUT: 'bg-signal-warning/10',
  PATCH: 'bg-signal-warning/10',
  DELETE: 'bg-signal-error/10',
  HEAD: 'bg-text-muted/10',
  OPTIONS: 'bg-text-muted/10',
};

function getStatusColorClass(status: number): string {
  if (status >= 200 && status < 300) {
    return 'text-signal-success';
  }
  if (status >= 300 && status < 400) {
    return 'text-accent-blue';
  }
  if (status >= 400 && status < 500) {
    return 'text-signal-warning';
  }
  if (status >= 500) {
    return 'text-signal-error';
  }
  return 'text-text-muted';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${String(bytes)} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * A single row in the Network History Panel.
 * Shows method, URL, signals, status, timing, and actions.
 */
export const NetworkHistoryRow = ({
  entry,
  isExpanded,
  isSelected,
  onToggleExpand,
  onSelect,
  onReplay,
  onCopyCurl,
  compareMode = false,
  isCompareSelected = false,
  onToggleCompare,
  onDelete,
}: NetworkHistoryRowProps): React.JSX.Element => {
  const shouldReduceMotion = useReducedMotion();
  const method = entry.request.method.toUpperCase() as HttpMethod;
  const status = entry.response.status;
  const totalMs = entry.response.timing.total_ms;
  const bodySize = entry.response.body.length;
  const segments = calculateWaterfallSegments(entry.response.timing);

  // Respect user's motion preferences
  const chevronTransition =
    shouldReduceMotion === true ? { duration: 0 } : { duration: 0.15, ease: 'easeOut' as const };
  const expandTransition =
    shouldReduceMotion === true ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' as const };

  const handleRowClick = (e: React.MouseEvent): void => {
    // Don't select if clicking on buttons or checkboxes
    if ((e.target as HTMLElement).closest('button') !== null) {
      return;
    }
    if ((e.target as HTMLElement).closest('[data-testid="compare-checkbox"]') !== null) {
      return;
    }
    // Selection checkbox handles its own click, so row click should also toggle selection
    onSelect(entry.id);
  };

  const handleRowDoubleClick = (e: React.MouseEvent): void => {
    // Don't expand if clicking on buttons or checkboxes
    if ((e.target as HTMLElement).closest('button') !== null) {
      return;
    }
    if ((e.target as HTMLElement).closest('[data-testid="compare-checkbox"]') !== null) {
      return;
    }
    onToggleExpand(entry.id);
  };

  const handleCompareToggle = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onToggleCompare?.(entry.id);
  };

  const handleExpandClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onToggleExpand(entry.id);
  };

  const handleReplayClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onReplay(entry);
  };

  const handleCopyClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onCopyCurl(entry);
  };

  const handleDeleteClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onDelete?.(entry.id);
  };

  return (
    <div className="border-b border-border-subtle">
      {/* Main row */}
      <div
        data-testid="history-row"
        onClick={handleRowClick}
        onDoubleClick={handleRowDoubleClick}
        className={cn(
          'flex items-center gap-3 px-3 py-2 cursor-pointer group transition-colors',
          isSelected ? 'bg-bg-raised' : 'hover:bg-bg-raised/50'
        )}
      >
        {/* Selection checkbox - always visible (like Console pattern) */}
        <button
          type="button"
          onClick={(e): void => {
            e.stopPropagation();
            onSelect(entry.id);
          }}
          className={cn(
            'shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
            isSelected
              ? 'bg-accent-blue border-accent-blue'
              : 'border-border-default hover:border-border-emphasis'
          )}
          title={isSelected ? 'Deselect' : 'Select'}
          aria-label={isSelected ? 'Deselect' : 'Select'}
        >
          {isSelected && <Check size={10} className="text-white" />}
        </button>

        {/* Compare checkbox - only shown in compare mode */}
        {compareMode && (
          <div
            data-testid="compare-checkbox"
            onClick={handleCompareToggle}
            className={cn(
              'w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer shrink-0 transition-colors',
              isCompareSelected
                ? 'border-signal-ai bg-signal-ai'
                : 'border-border-emphasis bg-transparent hover:border-signal-ai/50'
            )}
            role="checkbox"
            aria-checked={isCompareSelected}
            aria-label="Select for comparison"
          >
            {isCompareSelected && <Check size={10} className="text-white" />}
          </div>
        )}

        {/* Expand chevron */}
        <button
          data-testid="expand-button"
          onClick={handleExpandClick}
          className="p-0.5 hover:bg-bg-raised rounded transition-colors"
          aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
        >
          <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={chevronTransition}>
            <ChevronRight size={14} className="text-text-muted" />
          </motion.div>
        </button>

        {/* Method badge */}
        <span
          data-testid="method-badge"
          className={cn(
            'px-1.5 py-0.5 text-xs font-semibold rounded font-mono',
            methodColors[method],
            methodBgColors[method]
          )}
        >
          {method}
        </span>

        {/* URL with intelligence signals */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span
            className="text-sm text-text-secondary font-mono truncate"
            title={entry.request.url}
          >
            {entry.request.url}
          </span>
          <IntelligenceSignals intelligence={entry.intelligence} />
        </div>

        {/* Status code */}
        <span
          data-testid="status-badge"
          className={cn('text-sm font-mono font-semibold', getStatusColorClass(status))}
        >
          {status}
        </span>

        {/* Response time */}
        <span className="text-xs font-mono text-text-muted w-14 text-right">{totalMs}ms</span>

        {/* Response size */}
        <span
          data-testid="response-size"
          className="text-xs font-mono text-text-muted w-16 text-right"
        >
          {formatSize(bodySize)}
        </span>

        {/* Relative time */}
        <span className="text-xs text-text-muted w-16 text-right">
          {formatRelativeTime(entry.timestamp)}
        </span>

        {/* Hover actions */}
        <div
          data-testid="row-actions"
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Button
            data-testid="replay-button"
            variant="ghost"
            size="icon-xs"
            onClick={handleReplayClick}
            aria-label="Replay request"
            title="Replay request"
          >
            <Play size={14} />
          </Button>
          <Button
            data-testid="copy-curl-button"
            variant="ghost"
            size="icon-xs"
            onClick={handleCopyClick}
            aria-label="Copy as cURL"
            title="Copy as cURL"
          >
            <Copy size={14} />
          </Button>
          {onDelete !== undefined && (
            <Button
              data-testid="delete-button"
              variant="destructive-outline"
              size="icon-xs"
              onClick={handleDeleteClick}
              aria-label="Delete entry"
              title="Delete entry"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Expanded section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            data-testid="expanded-section"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={expandTransition}
            className="overflow-hidden"
          >
            <div className="px-10 py-3 bg-bg-elevated border-t border-border-subtle">
              {/* Timing waterfall */}
              <div className="mb-4">
                <p className="text-xs text-text-muted mb-2">Timing</p>
                <TimingWaterfall segments={segments} totalMs={totalMs} showLegend height="h-2" />
              </div>

              {/* Intelligence details */}
              {entry.intelligence !== undefined && (
                <div className="mb-4">
                  <p className="text-xs text-text-muted mb-2">Intelligence</p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    {entry.intelligence.verified && (
                      <span className="text-signal-success">Verified</span>
                    )}
                    {entry.intelligence.boundToSpec && (
                      <span className="text-accent-blue">
                        Bound to {entry.intelligence.specOperation ?? 'spec'}
                      </span>
                    )}
                    {entry.intelligence.drift !== null && (
                      <span className="text-signal-warning">
                        Drift: {entry.intelligence.drift.message}
                      </span>
                    )}
                    {entry.intelligence.aiGenerated && (
                      <span className="text-signal-ai">AI Generated</span>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 text-xs bg-bg-raised hover:bg-bg-raised/80 rounded transition-colors"
                  onClick={handleReplayClick}
                >
                  Edit & Replay
                </button>
                <button
                  className="px-3 py-1.5 text-xs bg-bg-raised hover:bg-bg-raised/80 rounded transition-colors"
                  onClick={handleCopyClick}
                >
                  Copy as cURL
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
