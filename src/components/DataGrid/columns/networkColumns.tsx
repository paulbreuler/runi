/**
 * @file Network column definitions for TanStack Table
 * @description Column definitions for the Network History Panel using TanStack Table
 */

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Play, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/relative-time';
import type { NetworkHistoryEntry, IntelligenceInfo } from '@/types/history';
import { IntelligenceSignals } from '@/components/History/IntelligenceSignals';
import { Button } from '@/components/ui/button';
import { createExpanderColumn } from './expanderColumn';
import { createSelectionColumn } from './selectionColumn';

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
      <span className="text-sm text-text-primary font-mono truncate" title={url}>
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
    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
// Column Factory
// ============================================================================

interface CreateNetworkColumnsOptions {
  /** Callback when replay button is clicked */
  onReplay: (entry: NetworkHistoryEntry) => void;
  /** Callback when copy cURL button is clicked */
  onCopy: (entry: NetworkHistoryEntry) => void;
  /** Callback when delete button is clicked (optional) */
  onDelete?: (id: string) => void;
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
  const { onReplay, onCopy, onDelete } = options;

  const columns: Array<ColumnDef<NetworkHistoryEntry>> = [
    // Selection column
    createSelectionColumn<NetworkHistoryEntry>({
      size: 'sm',
    }),

    // Expander column
    createExpanderColumn<NetworkHistoryEntry>({
      iconSize: 14,
    }),

    // Method column (fixed width with improved spacing to match Console Tab)
    {
      id: 'method',
      accessorFn: (row) => row.request.method,
      header: 'Method',
      cell: ({ getValue }) => <MethodCell method={getValue() as string} />,
      size: 100,
      minSize: 100,
      maxSize: 100,
      enableResizing: false,
      enableSorting: true,
    },

    // URL column (flexible - fills available space)
    {
      id: 'url',
      accessorFn: (row) => row.request.url,
      header: 'URL',
      cell: ({ row }) => (
        <UrlCell url={row.original.request.url} intelligence={row.original.intelligence} />
      ),
      size: 200, // Starting width, will grow to fill available space
      minSize: 150,
      enableSorting: true,
    },

    // Status column (reduced width for tighter spacing)
    {
      id: 'status',
      accessorFn: (row) => row.response.status,
      header: 'Status',
      cell: ({ getValue }) => <StatusCell status={getValue() as number} />,
      size: 55,
      enableSorting: true,
    },

    // Timing column (reduced width for tighter spacing)
    {
      id: 'timing',
      accessorFn: (row) => row.response.timing.total_ms,
      header: 'Time',
      cell: ({ getValue }) => <TimingCell totalMs={getValue() as number} />,
      size: 70,
      enableSorting: true,
    },

    // Size column (reduced width for tighter spacing)
    {
      id: 'size',
      accessorFn: (row) => row.response.body.length,
      header: 'Size',
      cell: ({ getValue }) => <SizeCell bytes={getValue() as number} />,
      size: 70,
      enableSorting: true,
    },

    // Time ago column (reduced width for tighter spacing)
    {
      id: 'timeAgo',
      accessorFn: (row) => row.timestamp,
      header: 'When',
      cell: ({ getValue }) => <TimeAgoCell timestamp={getValue() as string} />,
      size: 70,
      enableSorting: true,
    },

    // Actions column (pinned to right, frozen during horizontal scroll)
    // Width: 3 buttons (28px each) + 2 gaps (4px each) + left padding (12px) + right padding (12px) = 104px
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <ActionsCell entry={row.original} onReplay={onReplay} onCopy={onCopy} onDelete={onDelete} />
      ),
      size: 104,
      minSize: 104,
      maxSize: 104,
      enableResizing: false,
      enableSorting: false,
      enablePinning: true,
    },
  ];

  return columns;
}
