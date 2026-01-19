/**
 * @file Network column definitions for TanStack Table
 * @description Column definitions for the Network History Panel using TanStack Table
 */

import * as React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Play, Copy, Trash2, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/relative-time';
import type { NetworkHistoryEntry, IntelligenceInfo } from '@/types/history';
import { IntelligenceSignals } from '@/components/History/IntelligenceSignals';
import { Button } from '@/components/ui/button';
import { createSelectionColumn } from './selectionColumn';
import { createExpanderColumn } from './expanderColumn';

// ============================================================================
// Method Cell
// ============================================================================

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

interface MethodCellProps {
  method: string;
}

/**
 * Renders an HTTP method badge with appropriate color styling.
 */
export const MethodCell = ({ method }: MethodCellProps): React.ReactElement => {
  const upperMethod = method.toUpperCase();
  const colorClass = methodColors[upperMethod] ?? 'text-text-muted';
  const bgClass = methodBgColors[upperMethod] ?? 'bg-text-muted/10';

  return (
    <span
      className={cn('px-1.5 py-0.5 text-xs font-semibold rounded font-mono', colorClass, bgClass)}
    >
      {upperMethod}
    </span>
  );
};

// ============================================================================
// Status Cell
// ============================================================================

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

interface StatusCellProps {
  status: number;
}

/**
 * Renders an HTTP status code with appropriate color styling.
 */
export const StatusCell = ({ status }: StatusCellProps): React.ReactElement => {
  return (
    <span className={cn('text-sm font-mono font-semibold', getStatusColorClass(status))}>
      {status}
    </span>
  );
};

// ============================================================================
// URL Cell
// ============================================================================

interface UrlCellProps {
  url: string;
  intelligence?: IntelligenceInfo;
}

/**
 * Renders a URL with optional intelligence signals.
 */
export const UrlCell = ({ url, intelligence }: UrlCellProps): React.ReactElement => {
  return (
    <div className="flex-1 min-w-0 flex items-center gap-2">
      <span className="text-sm text-text-secondary font-mono truncate" title={url}>
        {url}
      </span>
      {intelligence !== undefined && (
        <div data-testid="intelligence-signals">
          <IntelligenceSignals intelligence={intelligence} />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Timing Cell
// ============================================================================

interface TimingCellProps {
  totalMs: number;
}

/**
 * Renders request timing in milliseconds.
 */
export const TimingCell = ({ totalMs }: TimingCellProps): React.ReactElement => {
  return <span className="text-xs font-mono text-text-muted">{totalMs}ms</span>;
};

// ============================================================================
// Size Cell
// ============================================================================

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${String(bytes)} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface SizeCellProps {
  bytes: number;
}

/**
 * Renders response body size in human-readable format.
 */
export const SizeCell = ({ bytes }: SizeCellProps): React.ReactElement => {
  return <span className="text-xs font-mono text-text-muted">{formatSize(bytes)}</span>;
};

// ============================================================================
// Time Ago Cell
// ============================================================================

interface TimeAgoCellProps {
  timestamp: string;
}

/**
 * Renders a relative time (e.g., "5 mins ago").
 */
export const TimeAgoCell = ({ timestamp }: TimeAgoCellProps): React.ReactElement => {
  return <span className="text-xs text-text-muted">{formatRelativeTime(timestamp)}</span>;
};

// ============================================================================
// Actions Cell
// ============================================================================

interface ActionsCellProps {
  entry: NetworkHistoryEntry;
  onReplay: (entry: NetworkHistoryEntry) => void;
  onCopy: (entry: NetworkHistoryEntry) => void;
  onDelete?: (id: string) => void;
}

/**
 * Renders action buttons for a network history entry.
 */
export const ActionsCell = ({
  entry,
  onReplay,
  onCopy,
  onDelete,
}: ActionsCellProps): React.ReactElement => {
  const handleReplayClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onReplay(entry);
  };

  const handleCopyClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onCopy(entry);
  };

  const handleDeleteClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onDelete?.(entry.id);
  };

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
  );
};

// ============================================================================
// Compare Cell
// ============================================================================

interface CompareCellProps {
  /** Whether compare mode is active */
  compareMode: boolean;
  /** Whether this row is selected for comparison */
  isCompareSelected: boolean;
  /** Callback when compare checkbox is toggled */
  onToggleCompare: (id: string) => void;
  /** Entry ID */
  entryId: string;
}

/**
 * Renders a compare checkbox that appears only in compare mode.
 */
const CompareCell = ({
  compareMode,
  isCompareSelected,
  onToggleCompare,
  entryId,
}: CompareCellProps): React.ReactElement | null => {
  if (!compareMode) {
    return null;
  }

  const handleClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onToggleCompare(entryId);
  };

  return (
    <div
      data-testid="compare-checkbox"
      onClick={handleClick}
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
  );
};

// ============================================================================
// Column Factory
// ============================================================================

interface CreateNetworkColumnsOptions {
  /** Callback when replay button is clicked */
  onReplay: (entry: NetworkHistoryEntry) => void;
  /** Callback when copy cURL button is clicked */
  onCopy: (entry: NetworkHistoryEntry) => void;
  /** Callback when delete button is clicked (optional) */
  onDelete?: (id: string) => void;
  /** Whether compare mode is active */
  compareMode?: boolean;
  /** Callback when compare selection is toggled */
  onToggleCompare?: (id: string) => void;
  /** Function to check if entry is selected for comparison */
  isCompareSelected?: (id: string) => boolean;
}

/**
 * Creates TanStack Table column definitions for the Network History Panel.
 *
 * @param options - Callbacks for row actions
 * @returns Array of column definitions
 *
 * @example
 * ```tsx
 * const columns = createNetworkColumns({
 *   onReplay: (entry) => sendRequest(entry.request),
 *   onCopy: (entry) => copyToClipboard(generateCurl(entry)),
 *   onDelete: (id) => deleteEntry(id),
 * });
 * ```
 */
export function createNetworkColumns(
  options: CreateNetworkColumnsOptions
): Array<ColumnDef<NetworkHistoryEntry>> {
  const {
    onReplay,
    onCopy,
    onDelete,
    compareMode = false,
    onToggleCompare,
    isCompareSelected,
  } = options;

  const columns: Array<ColumnDef<NetworkHistoryEntry>> = [
    // Selection column
    createSelectionColumn<NetworkHistoryEntry>({
      size: 'sm',
    }),

    // Compare column (only when compare mode is active)
    ...(compareMode && onToggleCompare !== undefined && isCompareSelected !== undefined
      ? [
          {
            id: 'compare',
            header: undefined,
            cell: ({ row }) => (
              <CompareCell
                compareMode={compareMode}
                isCompareSelected={isCompareSelected(row.original.id)}
                onToggleCompare={onToggleCompare}
                entryId={row.original.id}
              />
            ),
            size: 32,
            enableSorting: false,
          } as ColumnDef<NetworkHistoryEntry>,
        ]
      : []),

    // Expander column
    createExpanderColumn<NetworkHistoryEntry>({
      iconSize: 14,
    }),

    // Method column
    {
      id: 'method',
      accessorFn: (row) => row.request.method,
      header: 'Method',
      cell: ({ getValue }) => <MethodCell method={getValue() as string} />,
      size: 80,
      enableSorting: true,
    },

    // URL column (with intelligence signals)
    {
      id: 'url',
      accessorFn: (row) => row.request.url,
      header: 'URL',
      cell: ({ row }) => (
        <UrlCell url={row.original.request.url} intelligence={row.original.intelligence} />
      ),
      size: 400,
      enableSorting: true,
    },

    // Status column
    {
      id: 'status',
      accessorFn: (row) => row.response.status,
      header: 'Status',
      cell: ({ getValue }) => <StatusCell status={getValue() as number} />,
      size: 60,
      enableSorting: true,
    },

    // Timing column
    {
      id: 'timing',
      accessorFn: (row) => row.response.timing.total_ms,
      header: 'Time',
      cell: ({ getValue }) => <TimingCell totalMs={getValue() as number} />,
      size: 80,
      enableSorting: true,
    },

    // Size column
    {
      id: 'size',
      accessorFn: (row) => row.response.body.length,
      header: 'Size',
      cell: ({ getValue }) => <SizeCell bytes={getValue() as number} />,
      size: 80,
      enableSorting: true,
    },

    // Time ago column
    {
      id: 'timeAgo',
      accessorFn: (row) => row.timestamp,
      header: 'When',
      cell: ({ getValue }) => <TimeAgoCell timestamp={getValue() as string} />,
      size: 80,
      enableSorting: true,
    },

    // Actions column
    {
      id: 'actions',
      header: undefined,
      cell: ({ row }) => (
        <ActionsCell entry={row.original} onReplay={onReplay} onCopy={onCopy} onDelete={onDelete} />
      ),
      size: 100,
      enableSorting: false,
    },
  ];

  return columns;
}
