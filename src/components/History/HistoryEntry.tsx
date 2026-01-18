import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { type HttpMethod } from '@/utils/http-colors';
import { formatRelativeTime } from '@/utils/relative-time';
import type { HistoryEntry as HistoryEntryType } from '@/types/generated/HistoryEntry';

interface HistoryEntryProps {
  entry: HistoryEntryType;
  onSelect: (entry: HistoryEntryType) => void;
  onDelete: (id: string) => void;
}

export const HistoryEntry = ({
  entry,
  onSelect,
  onDelete,
}: HistoryEntryProps): React.JSX.Element => {
  const method = entry.request.method.toUpperCase() as HttpMethod;

  // Get badge background color based on method
  const methodColors: Record<string, string> = {
    GET: 'bg-signal-info/20 text-signal-info',
    POST: 'bg-signal-success/20 text-signal-success',
    PUT: 'bg-signal-warning/20 text-signal-warning',
    PATCH: 'bg-signal-warning/20 text-signal-warning',
    DELETE: 'bg-signal-error/20 text-signal-error',
    HEAD: 'bg-text-muted/20 text-text-muted',
    OPTIONS: 'bg-text-muted/20 text-text-muted',
  };
  const badgeBgColor = methodColors[method] ?? 'bg-signal-info/20 text-signal-info';

  const handleDelete = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onDelete(entry.id);
  };

  return (
    <div
      onClick={() => {
        onSelect(entry);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(entry);
        }
      }}
      role="button"
      tabIndex={0}
      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-bg-raised/50 rounded-lg transition-all duration-200 group cursor-pointer"
      data-testid={`history-entry-${entry.id}`}
    >
      {/* Method Badge */}
      <span
        className={cn('px-2 py-0.5 text-xs font-semibold rounded uppercase', badgeBgColor)}
        data-testid="method-badge"
      >
        {method}
      </span>

      {/* URL and Timestamp */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-sm text-text-secondary truncate" title={entry.request.url}>
          {entry.request.url}
        </span>
        <span className="text-xs text-text-muted">{formatRelativeTime(entry.timestamp)}</span>
      </div>

      {/* Delete Button */}
      <button
        type="button"
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-bg-raised rounded"
        aria-label={`Delete ${method} ${entry.request.url}`}
        data-testid="delete-button"
      >
        <X size={14} className="text-text-muted hover:text-signal-error transition-colors" />
      </button>
    </div>
  );
};
