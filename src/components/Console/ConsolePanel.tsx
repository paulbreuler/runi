import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Terminal,
  AlertCircle,
  Info,
  Trash2,
  ChevronRight,
  ChevronDown,
  Check,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { getConsoleService } from '@/services/console-service';
import type { ConsoleLog, LogLevel } from '@/types/console';
import { ConsoleContextMenu } from './ConsoleContextMenu';
import { ConsoleToolbar } from './ConsoleToolbar';
import { EmptyState } from '@/components/ui/EmptyState';

export type { LogLevel, ConsoleLog } from '@/types/console';

interface ConsolePanelProps {
  /** Maximum number of logs to keep (default: 1000) */
  maxLogs?: number;
  /** Maximum size in bytes for log storage (default: 4MB) */
  maxSizeBytes?: number;
}

interface GroupedLog {
  id: string;
  level: LogLevel;
  message: string;
  count: number;
  firstTimestamp: number;
  lastTimestamp: number;
  correlationId?: string;
  sampleLog: ConsoleLog; // First log in group
  allLogs: ConsoleLog[]; // For expanding to show all
}

type DisplayLog = ConsoleLog | GroupedLog;

function isGroupedLog(log: DisplayLog): log is GroupedLog {
  return 'count' in log && 'allLogs' in log;
}

/**
 * ConsolePanel - DevTools-style console for viewing application and debug logs.
 *
 * Displays logs from the global console service (logs are intercepted before React mounts).
 * Supports filtering by level and correlation ID for debugging across React and Rust boundaries.
 */
const DEFAULT_MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4MB

export const ConsolePanel = ({
  maxLogs = 1000,
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
}: ConsolePanelProps): React.JSX.Element => {
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [correlationIdFilter, setCorrelationIdFilter] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    log: DisplayLog;
    position: { x: number; y: number };
  } | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef(getConsoleService());

  // Subscribe to console service logs
  useEffect(() => {
    const service = serviceRef.current;

    // Configure limits (count-based and size-based)
    service.setMaxLogs(maxLogs);
    service.setMaxSizeBytes(maxSizeBytes);

    // Load initial logs
    const initialLogs = service.getLogs();
    setLogs(initialLogs);

    // Subscribe to new logs
    const handler = (log: ConsoleLog): void => {
      // Use functional update to ensure we get latest state
      setLogs((prev) => {
        const updated = [...prev, log];
        // Limit to maxLogs (size limit is handled by service)
        if (updated.length > maxLogs) {
          return updated.slice(-maxLogs);
        }
        return updated;
      });
    };
    const unsubscribe = service.subscribe(handler);

    // Also poll for logs periodically (fallback for tests)
    const interval = setInterval(() => {
      const currentLogs = service.getLogs();
      setLogs((prev) => {
        // Only update if logs changed
        if (currentLogs.length !== prev.length) {
          if (currentLogs.length > maxLogs) {
            return currentLogs.slice(-maxLogs);
          }
          return currentLogs;
        }
        return prev;
      });
    }, 100); // Poll every 100ms for tests

    return (): void => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [maxLogs, maxSizeBytes]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logContainerRef.current !== null) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Filter and group logs based on selected level and correlation ID
  const filteredLogs = useMemo(() => {
    let filtered = logs;

    if (filter !== 'all') {
      filtered = filtered.filter((log) => log.level === filter);
    }

    if (correlationIdFilter.trim() !== '') {
      const filterValue = correlationIdFilter.trim().toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.correlationId !== undefined &&
          log.correlationId !== '' &&
          log.correlationId.toLowerCase().includes(filterValue)
      );
    }

    // Group identical logs (same level + message + correlationId)
    const grouped = new Map<string, ConsoleLog[]>();
    for (const log of filtered) {
      const correlationId = log.correlationId ?? '';
      const groupKey = `${log.level}|${log.message}|${correlationId}`;
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }
      const group = grouped.get(groupKey);
      if (group !== undefined) {
        group.push(log);
      }
    }

    // Convert groups to GroupedLog or individual ConsoleLog
    const result: DisplayLog[] = [];
    for (const [groupKey, logGroup] of grouped.entries()) {
      if (logGroup.length > 1) {
        // Group multiple identical logs
        const firstLog = logGroup[0];
        if (firstLog === undefined) {
          continue;
        }
        const sortedGroup = [...logGroup].sort((a, b) => a.timestamp - b.timestamp);
        const firstSorted = sortedGroup[0];
        const lastSorted = sortedGroup[sortedGroup.length - 1];
        if (firstSorted === undefined || lastSorted === undefined) {
          continue;
        }
        const groupedLog: GroupedLog = {
          id: `group_${groupKey}`,
          level: firstLog.level,
          message: firstLog.message,
          count: logGroup.length,
          firstTimestamp: firstSorted.timestamp,
          lastTimestamp: lastSorted.timestamp,
          correlationId: firstLog.correlationId,
          sampleLog: firstLog,
          allLogs: sortedGroup,
        };
        result.push(groupedLog);
      } else {
        // Single log - no grouping needed
        const singleLog = logGroup[0];
        if (singleLog !== undefined) {
          result.push(singleLog);
        }
      }
    }

    // Sort by first timestamp
    return result.sort((a, b) => {
      const timeA = isGroupedLog(a) ? a.firstTimestamp : a.timestamp;
      const timeB = isGroupedLog(b) ? b.firstTimestamp : b.timestamp;
      return timeA - timeB;
    });
  }, [logs, filter, correlationIdFilter]);

  const handleClear = (): void => {
    const service = getConsoleService();
    service.clear();
    setLogs([]);
    setExpandedLogIds(new Set());
    setSelectedLogIds(new Set());
    setContextMenu(null);
  };

  const handleToggleSelect = (logId: string): void => {
    setSelectedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  const downloadJson = (data: unknown, filename: string): void => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveAll = (): void => {
    downloadJson(filteredLogs, `console-logs-${String(Date.now())}.json`);
  };

  const handleSaveSelection = (): void => {
    if (selectedLogIds.size === 0) {
      return;
    }
    const selectedLogs = filteredLogs.filter((log) => selectedLogIds.has(log.id));
    downloadJson(selectedLogs, `console-logs-selected-${String(Date.now())}.json`);
  };

  const handleCopySelection = async (): Promise<void> => {
    if (selectedLogIds.size === 0) {
      return;
    }
    const selectedLogs = filteredLogs.filter((log) => selectedLogIds.has(log.id));
    const text = selectedLogs
      .map((log) => {
        const timestamp = formatTimestamp(isGroupedLog(log) ? log.firstTimestamp : log.timestamp);
        return `[${timestamp}] ${log.level.toUpperCase()}: ${log.message}`;
      })
      .join('\n');
    await handleCopy(text);
  };

  const handleDeleteLog = (logId: string): void => {
    const service = getConsoleService();
    const logToDelete = filteredLogs.find((log) => log.id === logId);
    if (logToDelete !== undefined) {
      if (isGroupedLog(logToDelete)) {
        // Delete all logs in the group
        for (const individualLog of logToDelete.allLogs) {
          service.deleteLog(individualLog.id);
        }
      } else {
        // Delete single log
        service.deleteLog(logId);
      }
      // Refresh logs from service
      setLogs(service.getLogs());
      // Remove from selection
      setSelectedLogIds((prev) => {
        const next = new Set(prev);
        next.delete(logId);
        return next;
      });
    }
  };

  const handleContextMenu = (event: React.MouseEvent, log: DisplayLog): void => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      log,
      position: { x: event.clientX, y: event.clientY },
    });
  };

  const handleCopy = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        // eslint-disable-next-line @typescript-eslint/no-deprecated -- Fallback for older browsers that don't support Clipboard API
        document.execCommand('copy');
      } catch {
        // Ignore errors
      }
      document.body.removeChild(textArea);
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const timeStr = date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    // Add milliseconds manually (toLocaleTimeString doesn't support fractionalSecondDigits in all browsers)
    const ms = String(date.getMilliseconds()).padStart(3, '0');
    return `${timeStr}.${ms}`;
  };

  const getLogIcon = (level: LogLevel): React.ReactNode => {
    switch (level) {
      case 'error':
        return <AlertCircle size={12} className="text-signal-error" />;
      case 'warn':
        return <AlertCircle size={12} className="text-signal-warning" />;
      case 'info':
        return <Info size={12} className="text-accent-blue" />;
      case 'debug':
        return <Terminal size={12} className="text-text-muted" />;
      default:
        return null;
    }
  };

  const getLogLevelClass = (level: LogLevel): string => {
    switch (level) {
      case 'error':
        return 'text-signal-error';
      case 'warn':
        return 'text-signal-warning';
      case 'info':
        return 'text-accent-blue';
      case 'debug':
        return 'text-text-secondary';
      default:
        return 'text-text-muted';
    }
  };

  const countByLevel = useMemo(() => {
    return logs.reduce<Record<LogLevel, number>>(
      (acc, log) => {
        acc[log.level] += 1;
        return acc;
      },
      { debug: 0, info: 0, warn: 0, error: 0 }
    );
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-bg-surface">
      {/* Toolbar - now using ConsoleToolbar component */}
      <ConsoleToolbar
        filter={filter}
        onFilterChange={setFilter}
        correlationIdFilter={correlationIdFilter}
        onCorrelationIdFilterChange={setCorrelationIdFilter}
        autoScroll={autoScroll}
        onAutoScrollToggle={() => {
          setAutoScroll(!autoScroll);
        }}
        onClear={handleClear}
        onSaveAll={handleSaveAll}
        onSaveSelection={handleSaveSelection}
        onCopySelection={handleCopySelection}
        selectedCount={selectedLogIds.size}
        counts={countByLevel}
        totalCount={logs.length}
      />

      {/* Log list */}
      <div
        ref={logContainerRef}
        className="flex-1 overflow-auto min-h-0 font-mono text-xs"
        style={{ scrollbarGutter: 'stable' }}
        data-testid="console-logs"
      >
        {filteredLogs.length === 0 ? (
          <EmptyState
            variant="muted"
            size="sm"
            title={`No logs${filter !== 'all' ? ` (${filter} only)` : ''}`}
          />
        ) : (
          <div className="p-2 space-y-0.5">
            {filteredLogs.map((displayLog) => {
              const isGrouped = isGroupedLog(displayLog);
              const isExpanded = expandedLogIds.has(displayLog.id);
              const logLevel = isGrouped ? displayLog.level : displayLog.level;
              const logMessage = isGrouped ? displayLog.message : displayLog.message;
              const logTimestamp = isGrouped ? displayLog.firstTimestamp : displayLog.timestamp;
              const logCorrelationId = isGrouped
                ? displayLog.correlationId
                : displayLog.correlationId;
              const logId = isGrouped ? displayLog.id : displayLog.id;

              const isSelected = selectedLogIds.has(logId);

              return (
                <div key={logId} className="group">
                  <div
                    className={cn(
                      'flex items-start gap-3 px-2 py-1 rounded hover:bg-bg-raised/50 transition-colors',
                      isSelected && 'bg-bg-raised/30',
                      getLogLevelClass(logLevel)
                    )}
                    data-testid={`console-log-${logLevel}`}
                    onContextMenu={(e): void => {
                      handleContextMenu(e, displayLog);
                    }}
                  >
                    {/* Checkbox for selection */}
                    <button
                      type="button"
                      onClick={(e): void => {
                        e.stopPropagation();
                        handleToggleSelect(logId);
                      }}
                      className={cn(
                        'shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                        isSelected
                          ? 'bg-accent-blue border-accent-blue'
                          : 'border-border-default hover:border-border-emphasis'
                      )}
                      title={isSelected ? 'Deselect' : 'Select'}
                    >
                      {isSelected && <Check size={10} className="text-white" />}
                    </button>
                    {/* Expand/collapse icon for grouped logs */}
                    {isGrouped && (
                      <button
                        type="button"
                        onClick={(): void => {
                          setExpandedLogIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(logId)) {
                              next.delete(logId);
                            } else {
                              next.add(logId);
                            }
                            return next;
                          });
                        }}
                        className="shrink-0 mt-0.5 text-text-muted hover:text-text-primary"
                      >
                        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>
                    )}
                    {!isGrouped && (
                      <button
                        type="button"
                        onClick={(): void => {
                          setExpandedLogIds((prev) => {
                            const next = new Set(prev);
                            if (displayLog.args.length > 0) {
                              if (next.has(logId)) {
                                next.delete(logId);
                              } else {
                                next.add(logId);
                              }
                            }
                            return next;
                          });
                        }}
                        className={cn(
                          'shrink-0 mt-0.5 text-text-muted hover:text-text-primary transition-colors',
                          displayLog.args.length === 0 ? 'invisible' : ''
                        )}
                        title={displayLog.args.length > 0 ? 'Expand/collapse args' : ''}
                      >
                        {expandedLogIds.has(logId) ? (
                          <ChevronDown size={12} />
                        ) : (
                          <ChevronRight size={12} />
                        )}
                      </button>
                    )}
                    {!isGrouped && displayLog.args.length === 0 && (
                      <span className="shrink-0 w-3" />
                    )}
                    <span className="shrink-0 mt-0.5">{getLogIcon(logLevel)}</span>
                    <span className="shrink-0 text-text-muted w-24">
                      {formatTimestamp(logTimestamp)}
                    </span>
                    <span className="flex-1 min-w-0 break-words">{logMessage}</span>
                    {logCorrelationId !== undefined && logCorrelationId !== '' && (
                      <span
                        className="shrink-0 text-text-muted text-xs font-mono w-40 truncate"
                        title={logCorrelationId}
                      >
                        {logCorrelationId}
                      </span>
                    )}
                    {/* Count badge for grouped logs */}
                    {isGrouped && displayLog.count > 1 && (
                      <span
                        className={cn(
                          'shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold min-w-[20px] text-center',
                          ((): string => {
                            if (logLevel === 'error') {
                              return 'bg-signal-error/20 text-signal-error';
                            }
                            if (logLevel === 'warn') {
                              return 'bg-signal-warning/20 text-signal-warning';
                            }
                            return 'bg-text-muted/20 text-text-muted';
                          })()
                        )}
                        title={`${String(displayLog.count)} occurrences`}
                      >
                        {displayLog.count}
                      </span>
                    )}
                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e): void => {
                        e.stopPropagation();
                        handleDeleteLog(logId);
                      }}
                      className="shrink-0 p-0.5 text-text-muted hover:text-signal-error opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete log"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {/* Expanded view for grouped logs */}
                  {isGrouped && isExpanded && (
                    <div className="ml-8 mt-0.5 space-y-0.5 border-l border-border-default pl-2">
                      {displayLog.allLogs.map((individualLog) => {
                        const isLogExpanded = expandedLogIds.has(individualLog.id);
                        return (
                          <div key={individualLog.id}>
                            <div
                              className={cn(
                                'flex items-start gap-3 px-2 py-1 rounded hover:bg-bg-raised/30 transition-colors text-xs',
                                getLogLevelClass(individualLog.level)
                              )}
                              onContextMenu={(e): void => {
                                handleContextMenu(e, individualLog);
                              }}
                            >
                              {/* Expand button for args (only if args exist) */}
                              {individualLog.args.length > 0 && (
                                <button
                                  type="button"
                                  onClick={(): void => {
                                    setExpandedLogIds((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(individualLog.id)) {
                                        next.delete(individualLog.id);
                                      } else {
                                        next.add(individualLog.id);
                                      }
                                      return next;
                                    });
                                  }}
                                  className="shrink-0 mt-0.5 text-text-muted hover:text-text-primary"
                                >
                                  {isLogExpanded ? (
                                    <ChevronDown size={10} />
                                  ) : (
                                    <ChevronRight size={10} />
                                  )}
                                </button>
                              )}
                              {individualLog.args.length === 0 && (
                                <span className="shrink-0 w-2.5" />
                              )}
                              <span className="shrink-0 mt-0.5">
                                {getLogIcon(individualLog.level)}
                              </span>
                              <span className="shrink-0 text-text-muted w-24">
                                {formatTimestamp(individualLog.timestamp)}
                              </span>
                              <span className="flex-1 min-w-0 break-words">
                                {individualLog.message}
                              </span>
                              {individualLog.correlationId !== undefined &&
                                individualLog.correlationId !== '' && (
                                  <span
                                    className="shrink-0 text-text-muted text-xs font-mono w-40 truncate"
                                    title={individualLog.correlationId}
                                  >
                                    {individualLog.correlationId}
                                  </span>
                                )}
                            </div>
                            {/* Expandable args view for individual logs in group */}
                            {individualLog.args.length > 0 && isLogExpanded && (
                              <div className="ml-6 mt-0.5 pl-2 border-l border-border-default">
                                {individualLog.args.map((arg: unknown, index: number) => (
                                  <div
                                    key={index}
                                    className="mb-1 text-xs font-mono text-text-secondary"
                                  >
                                    <pre className="whitespace-pre-wrap break-words overflow-x-auto">
                                      {typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)}
                                    </pre>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Expandable args view for individual (non-grouped) logs */}
                  {!isGrouped && isExpanded && displayLog.args.length > 0 && (
                    <div className="ml-8 mt-0.5 pl-2 border-l border-border-default">
                      {displayLog.args.map((arg: unknown, index: number) => (
                        <div key={index} className="mb-1 text-xs font-mono text-text-secondary">
                          <pre className="whitespace-pre-wrap break-words overflow-x-auto">
                            {typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu !== null && (
        <ConsoleContextMenu
          log={contextMenu.log}
          position={contextMenu.position}
          onClose={(): void => {
            setContextMenu(null);
          }}
          onCopy={handleCopy}
        />
      )}
    </div>
  );
};
