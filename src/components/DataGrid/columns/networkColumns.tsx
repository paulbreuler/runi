/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Network column definitions for TanStack Table
 * @description Column definitions for the Network History Panel using TanStack Table
 */

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Play, Copy, Trash2 } from 'lucide-react';
import type { NetworkHistoryEntry } from '@/types/history';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { useFocusVisible } from '@/utils/accessibility';
import { createExpanderColumn } from './expanderColumn';
import { createSelectionColumn } from './selectionColumn';
import { MethodCell } from './methodCell';
import { UrlCell } from './urlCell';
import { StatusCell } from './statusCell';
import { TimingCell } from './timingCell';
import { SizeCell } from './sizeCell';
import { TimeAgoCell } from './timeAgoCell';
import { ProtocolCell } from './protocolCell';

// Re-export for backward compatibility
export { MethodCell, UrlCell, StatusCell, TimingCell, SizeCell, TimeAgoCell, ProtocolCell };

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
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isVisible = useFocusVisible(containerRef);

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
    <div
      ref={containerRef}
      className={cn(
        'flex items-center justify-end gap-1 transition-opacity',
        isVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      )}
    >
      <Button
        data-test-id="replay-button"
        variant="ghost"
        size="icon-xs"
        onClick={handleReplayClick}
        aria-label="Replay request"
        title="Replay request"
      >
        <Play size={14} />
      </Button>
      <Button
        data-test-id="copy-curl-button"
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
          data-test-id="delete-button"
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

    // Protocol column (reduced width for tighter spacing)
    // Note: Protocol information is not yet captured in the data model
    // This column will show null/undefined until backend is updated
    {
      id: 'protocol',
      accessorFn: (row) => (row.response as { protocol?: string }).protocol,
      header: 'Protocol',
      cell: ({ getValue }) => <ProtocolCell protocol={getValue() as string | null | undefined} />,
      size: 80,
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
