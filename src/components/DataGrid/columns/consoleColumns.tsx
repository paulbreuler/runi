/**
 * @file Console column definitions for TanStack Table
 * @description Column definitions for the Console Panel using TanStack Table
 */

import * as React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Copy, Trash2, Info, AlertTriangle, XCircle, Bug } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ConsoleLog, LogLevel } from '@/types/console';
import { Button } from '@/components/ui/button';
import { createSelectionColumn } from './selectionColumn';
import { createExpanderColumn } from './expanderColumn';

// ============================================================================
// Level Cell
// ============================================================================

const levelColors: Record<LogLevel, string> = {
  info: 'text-accent-blue',
  warn: 'text-signal-warning',
  error: 'text-signal-error',
  debug: 'text-text-muted',
};

const levelBgColors: Record<LogLevel, string> = {
  info: 'bg-accent-blue/10',
  warn: 'bg-signal-warning/10',
  error: 'bg-signal-error/10',
  debug: 'bg-text-muted/10',
};

const LevelIcons: Record<LogLevel, React.ComponentType<{ size?: number; className?: string }>> = {
  info: Info,
  warn: AlertTriangle,
  error: XCircle,
  debug: Bug,
};

interface LevelCellProps {
  level: LogLevel;
}

/**
 * Renders a log level badge with icon and appropriate color styling.
 */
export const LevelCell = ({ level }: LevelCellProps): React.ReactElement => {
  const Icon = LevelIcons[level];
  const colorClass = levelColors[level];
  const bgClass = levelBgColors[level];

  return (
    <div className="flex items-center gap-1.5">
      <Icon size={14} className={colorClass} />
      <span
        className={cn(
          'text-xs font-medium uppercase',
          colorClass,
          bgClass,
          'px-1.5 py-0.5 rounded'
        )}
      >
        {level}
      </span>
    </div>
  );
};

// ============================================================================
// Message Cell
// ============================================================================

/**
 * Truncates a message to a maximum of 250 characters.
 * If truncated, appends "..." to indicate truncation.
 */
function truncateMessage(message: string, maxLength = 250): string {
  if (message.length <= maxLength) {
    return message;
  }
  return `${message.slice(0, maxLength)}...`;
}

interface MessageCellProps {
  message: string;
  count?: number;
}

/**
 * Renders a log message with optional repeat count badge.
 * Message is truncated to 250 characters max, even when row is expanded.
 * Full message is available via tooltip (title attribute).
 */
export const MessageCell = ({ message, count }: MessageCellProps): React.ReactElement => {
  const truncatedMessage = truncateMessage(message);
  const isTruncated = message.length > 250;

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className="text-sm text-text-primary truncate"
        title={isTruncated ? message : undefined}
      >
        {truncatedMessage}
      </span>
      {count !== undefined && count > 1 && (
        <span className="shrink-0 px-1.5 py-0.5 text-xs font-medium bg-bg-raised rounded text-text-muted">
          ×{count}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// Timestamp Cell
// ============================================================================

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

interface TimestampCellProps {
  timestamp: number;
}

/**
 * Renders a timestamp in HH:MM:SS.mmm format.
 */
export const TimestampCell = ({ timestamp }: TimestampCellProps): React.ReactElement => {
  return <span className="text-xs font-mono text-text-muted">{formatTimestamp(timestamp)}</span>;
};

// ============================================================================
// Console Actions Cell
// ============================================================================

interface ConsoleActionsCellProps {
  log: ConsoleLog;
  onCopy: (log: ConsoleLog) => void;
  onDelete?: (id: string) => void;
}

/**
 * Renders action buttons for a console log entry.
 */
export const ConsoleActionsCell = ({
  log,
  onCopy,
  onDelete,
}: ConsoleActionsCellProps): React.ReactElement => {
  const handleCopyClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onCopy(log);
  };

  const handleDeleteClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onDelete?.(log.id);
  };

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={handleCopyClick}
        aria-label="Copy log"
        title="Copy log"
      >
        <Copy size={14} />
      </Button>
      {onDelete !== undefined && (
        <Button
          variant="destructive-outline"
          size="icon-xs"
          onClick={handleDeleteClick}
          aria-label="Delete log"
          title="Delete log"
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

interface CreateConsoleColumnsOptions {
  /** Callback when copy button is clicked */
  onCopy: (log: ConsoleLog) => void;
  /** Callback when delete button is clicked (optional) */
  onDelete?: (id: string) => void;
}

/**
 * Creates TanStack Table column definitions for the Console Panel.
 *
 * @param options - Callbacks for row actions
 * @returns Array of column definitions
 *
 * @example
 * ```tsx
 * const columns = createConsoleColumns({
 *   onCopy: (log) => copyToClipboard(log.message),
 *   onDelete: (id) => deleteLog(id),
 * });
 * ```
 */
export function createConsoleColumns(
  options: CreateConsoleColumnsOptions
): Array<ColumnDef<ConsoleLog>> {
  const { onCopy, onDelete } = options;

  return [
    // Selection column
    createSelectionColumn<ConsoleLog>({
      size: 'sm',
    }),

    // Expander column
    createExpanderColumn<ConsoleLog>({
      iconSize: 14,
    }),

    // Level column (fixed width to match network method column)
    {
      id: 'level',
      accessorKey: 'level',
      header: 'Level',
      cell: ({ getValue }) => <LevelCell level={getValue() as LogLevel} />,
      size: 100,
      minSize: 100,
      maxSize: 100,
      enableSorting: true,
    },

    // Message column (flexible - fills available space)
    {
      id: 'message',
      accessorKey: 'message',
      header: 'Message',
      cell: ({ row }) => (
        <MessageCell
          message={row.original.message}
          count={(row.original as { _groupCount?: number })._groupCount}
        />
      ),
      size: 400, // Initial size, but will grow to fill space
      minSize: 150,
      enableSorting: true,
    },

    // Timestamp column
    {
      id: 'timestamp',
      accessorKey: 'timestamp',
      header: 'Time',
      cell: ({ getValue }) => <TimestampCell timestamp={getValue() as number} />,
      size: 100,
      enableSorting: true,
    },

    // Actions column (fixed on right)
    {
      id: 'actions',
      header: undefined,
      cell: ({ row }) => (
        <ConsoleActionsCell log={row.original} onCopy={onCopy} onDelete={onDelete} />
      ),
      size: 80,
      minSize: 80,
      maxSize: 80,
      enableSorting: false,
    },
  ];
}
