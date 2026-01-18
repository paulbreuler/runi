import React, { useEffect, useRef } from 'react';
import type { ConsoleLog, LogLevel } from '@/types/console';

interface GroupedLog {
  id: string;
  level: LogLevel;
  message: string;
  count: number;
  firstTimestamp: number;
  lastTimestamp: number;
  correlationId?: string;
  sampleLog: ConsoleLog;
  allLogs: ConsoleLog[];
}

interface ConsoleContextMenuProps {
  log: ConsoleLog | GroupedLog;
  position: { x: number; y: number };
  onClose: () => void;
  onCopy: (text: string) => void;
}

/**
 * ConsoleContextMenu - Right-click context menu for log entries.
 *
 * Provides copy actions:
 * - Copy message
 * - Copy correlation ID (if present)
 * - Copy all (formatted JSON)
 */
export const ConsoleContextMenu = ({
  log,
  position,
  onClose,
  onCopy,
}: ConsoleContextMenuProps): React.JSX.Element | null => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (menuRef.current !== null && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Determine if log is grouped or individual
  const isGrouped = 'count' in log && 'allLogs' in log;
  const message = isGrouped ? log.message : log.message;
  const correlationId = isGrouped ? log.correlationId : log.correlationId;

  const handleCopyMessage = (): void => {
    onCopy(message);
    onClose();
  };

  const handleCopyCorrelationId = (): void => {
    if (correlationId !== undefined && correlationId !== '') {
      onCopy(correlationId);
      onClose();
    }
  };

  const handleCopyAll = (): void => {
    const logData = isGrouped
      ? {
          level: log.level,
          message: log.message,
          count: log.count,
          firstTimestamp: log.firstTimestamp,
          lastTimestamp: log.lastTimestamp,
          correlationId: log.correlationId,
          allLogs: log.allLogs,
        }
      : {
          id: log.id,
          level: log.level,
          message: log.message,
          args: log.args,
          timestamp: log.timestamp,
          source: log.source,
          correlationId: log.correlationId,
        };
    onCopy(JSON.stringify(logData, null, 2));
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-48 bg-bg-surface border border-border-default rounded shadow-lg py-1"
      style={{ left: `${String(position.x)}px`, top: `${String(position.y)}px` }}
      role="menu"
      onContextMenu={(e): void => {
        e.preventDefault();
      }}
    >
      <button
        type="button"
        onClick={handleCopyMessage}
        className="w-full px-3 py-1.5 text-left text-sm text-text-primary hover:bg-bg-raised transition-colors"
        role="menuitem"
      >
        Copy message
      </button>
      {correlationId !== undefined && correlationId !== '' && (
        <button
          type="button"
          onClick={handleCopyCorrelationId}
          className="w-full px-3 py-1.5 text-left text-sm text-text-primary hover:bg-bg-raised transition-colors"
          role="menuitem"
        >
          Copy correlation ID
        </button>
      )}
      <button
        type="button"
        onClick={handleCopyAll}
        className="w-full px-3 py-1.5 text-left text-sm text-text-primary hover:bg-bg-raised transition-colors"
        role="menuitem"
      >
        Copy all
      </button>
    </div>
  );
};
