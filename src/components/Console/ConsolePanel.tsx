/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { cn } from '@/utils/cn';
import { getConsoleService } from '@/services/console-service';
import type { ConsoleLog, LogLevel } from '@/types/console';
import { ConsoleContextMenu } from './ConsoleContextMenu';
import { ConsoleToolbar } from './ConsoleToolbar';
import { VirtualDataGrid } from '@/components/DataGrid/VirtualDataGrid';
import { createConsoleColumns } from '@/components/DataGrid/columns/consoleColumns';
import { ExpandedContent } from '@/components/DataGrid/ExpandedContent';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Row } from '@tanstack/react-table';
import { CodeSnippet } from '@/components/History/CodeSnippet';
import { detectSyntaxLanguage } from '@/components/CodeHighlighting/syntaxLanguage';

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
 * Extended ConsoleLog for table display with grouping metadata.
 * This allows us to use consoleColumns (which expect ConsoleLog) while
 * preserving grouping information for expanded content.
 */
interface DisplayLogEntry extends ConsoleLog {
  /** Group count (if this is a grouped log) */
  _groupCount?: number;
  /** Original DisplayLog for expanded content */
  _originalLog?: DisplayLog;
}

/**
 * Serialize args deterministically for grouping.
 * Sorts object keys to ensure consistent serialization regardless of key order.
 */
function serializeArgs(args: unknown[]): string {
  try {
    return JSON.stringify(args, (_key: string, value: unknown): unknown => {
      // Sort object keys for deterministic serialization
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const obj = value as Record<string, unknown>;
        const sorted: Record<string, unknown> = {};
        for (const k of Object.keys(obj).sort()) {
          sorted[k] = obj[k];
        }
        return sorted;
      }
      return value;
    });
  } catch {
    // Fallback if serialization fails
    return String(args);
  }
}

/**
 * Format log arguments for display and detect language for syntax highlighting.
 * Combines all args into a single code block for consistent display.
 */
function formatLogArgs(args: unknown[]): { code: string; language: string } {
  if (args.length === 0) {
    return { code: '', language: 'text' };
  }

  // If single arg, format it directly
  if (args.length === 1) {
    const arg = args[0];
    const code = typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2);
    const language = typeof arg === 'string' ? detectSyntaxLanguage({ body: code }) : 'json';
    return { code, language };
  }

  // Multiple args: combine them (typically all JSON or all strings)
  // Format each arg and join with newlines
  const formattedArgs = args.map((arg) => {
    return typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2);
  });

  const code = formattedArgs.join('\n\n');
  // Detect language from first arg, default to json if any arg is an object
  const hasObjects = args.some((arg) => typeof arg !== 'string');
  const language = hasObjects ? 'json' : detectSyntaxLanguage({ body: code });
  return { code, language };
}

/**
 * ConsolePanel - DevTools-style console for viewing application and debug logs.
 *
 * Displays logs from the global console service (logs are intercepted before React mounts).
 * Supports filtering by level and full-text search across message, args, and correlation ID.
 */
const DEFAULT_MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4MB

export const ConsolePanel = ({
  maxLogs = 1000,
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
}: ConsolePanelProps): React.JSX.Element => {
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
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
    // NOTE: Disable polling in Storybook to prevent cross-story contamination
    // In Storybook, stories share the same console service singleton, and polling
    // causes all stories to see each other's logs. The subscription mechanism is
    // sufficient for Storybook.
    const isStorybook =
      typeof window !== 'undefined' &&
      (window.location.href.includes('storybook') ||
        (window.parent !== window && window.parent.location.href.includes('storybook')));

    const interval = isStorybook
      ? null
      : setInterval(() => {
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
      if (interval !== null) {
        clearInterval(interval);
      }
    };
  }, [maxLogs, maxSizeBytes]);

  // Helper function to check if log matches search text
  const matchesSearch = (log: ConsoleLog, searchText: string): boolean => {
    const searchLower = searchText.toLowerCase();

    // Search in message
    if (log.message.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Search in correlation ID
    if (
      log.correlationId !== undefined &&
      log.correlationId !== '' &&
      log.correlationId.toLowerCase().includes(searchLower)
    ) {
      return true;
    }

    // Search in args (serialize to string for searching)
    try {
      const argsString = JSON.stringify(log.args).toLowerCase();
      if (argsString.includes(searchLower)) {
        return true;
      }
    } catch {
      // If serialization fails, fallback to string conversion
      const argsString = String(log.args).toLowerCase();
      if (argsString.includes(searchLower)) {
        return true;
      }
    }

    return false;
  };

  // Filter and group logs based on selected level and full-text search
  const filteredLogs = useMemo(() => {
    let filtered = logs;

    if (filter !== 'all') {
      filtered = filtered.filter((log) => log.level === filter);
    }

    if (searchFilter.trim() !== '') {
      const searchValue = searchFilter.trim();
      filtered = filtered.filter((log) => matchesSearch(log, searchValue));
    }

    // Group identical logs (same level + message + correlationId + args)
    const grouped = new Map<string, ConsoleLog[]>();
    for (const log of filtered) {
      const correlationId = log.correlationId ?? '';
      const argsKey = serializeArgs(log.args);
      const groupKey = `${log.level}|${log.message}|${correlationId}|${argsKey}`;
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
  }, [logs, filter, searchFilter]);

  // Convert DisplayLog[] to DisplayLogEntry[] for TanStack Table
  const tableData = useMemo((): DisplayLogEntry[] => {
    return filteredLogs.map((displayLog): DisplayLogEntry => {
      if (isGroupedLog(displayLog)) {
        // Convert GroupedLog to DisplayLogEntry using sampleLog as base
        return {
          ...displayLog.sampleLog,
          id: displayLog.id,
          timestamp: displayLog.firstTimestamp, // Use first timestamp for display
          _groupCount: displayLog.count,
          _originalLog: displayLog,
        };
      }
      // ConsoleLog - just add metadata
      return {
        ...displayLog,
        _originalLog: displayLog,
      };
    });
  }, [filteredLogs]);

  const handleSelectRange = useCallback(
    (fromIndex: number, toIndex: number): void => {
      setSelectedLogIds((prev) => {
        const next = new Set(prev);
        const start = Math.min(fromIndex, toIndex);
        const end = Math.max(fromIndex, toIndex);

        // Add all logs in range
        for (let i = start; i <= end && i < filteredLogs.length; i++) {
          const log = filteredLogs[i];
          if (log !== undefined) {
            next.add(log.id);
          }
        }

        return next;
      });
    },
    [filteredLogs]
  );

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (!autoScroll || logContainerRef.current === null) {
      return;
    }

    // Defer scroll until DOM has updated
    requestAnimationFrame(() => {
      if (logContainerRef.current === null) {
        return;
      }

      const container = logContainerRef.current;
      const targetScroll = container.scrollHeight - container.clientHeight;

      // Scroll to bottom (respects reduced motion preference)
      // Note: Both paths do the same thing - reduced motion is handled by CSS
      container.scrollTop = targetScroll;
    });
  }, [filteredLogs.length, autoScroll]); // Depend on filteredLogs.length, not logs

  const handleClear = (): void => {
    const service = getConsoleService();
    service.clear();
    setLogs([]);
    setExpandedLogIds(new Set());
    setSelectedLogIds(new Set());
    setLastSelectedIndex(null);
    setContextMenu(null);
  };

  // Select all/deselect all handled via TanStack Table's header checkbox
  // The handleRowSelectionChange callback will be called with all rows selected/deselected

  const formatTimestamp = useCallback((timestamp: number): string => {
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
  }, []);

  const handleToggleSelect = useCallback((logId: string): void => {
    setSelectedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  }, []);

  const downloadJson = async (data: unknown, filename: string): Promise<void> => {
    const filePath = await save({
      defaultPath: filename,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });

    if (filePath !== null) {
      await writeTextFile(filePath, JSON.stringify(data, null, 2));
    }
  };

  const handleSaveAll = async (): Promise<void> => {
    await downloadJson(filteredLogs, `console-logs-${String(Date.now())}.json`);
  };

  const handleSaveSelection = async (): Promise<void> => {
    if (selectedLogIds.size === 0) {
      return;
    }
    const selectedLogs = filteredLogs.filter((log) => selectedLogIds.has(log.id));
    await downloadJson(selectedLogs, `console-logs-selected-${String(Date.now())}.json`);
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

  const handleDeleteLog = useCallback(
    (logId: string): void => {
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
        setLogs(() => [...service.getLogs()]);
        // Remove from selection
        setSelectedLogIds((prev) => {
          const next = new Set(prev);
          next.delete(logId);
          return next;
        });
        // Remove from expanded logs (including occurrences key for grouped logs)
        setExpandedLogIds((prev) => {
          const next = new Set(prev);
          next.delete(logId);
          next.delete(`${logId}_occurrences`);
          return next;
        });
      }
    },
    [filteredLogs]
  );

  const handleCopy = useCallback(async (text: string): Promise<void> => {
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
  }, []);

  const handleCopyLog = useCallback(
    (log: ConsoleLog): void => {
      const timestamp = formatTimestamp(log.timestamp);
      const text = `[${timestamp}] ${log.level.toUpperCase()}] ${log.message}`;
      void handleCopy(text);
    },
    [handleCopy, formatTimestamp]
  );

  // Create columns with callbacks
  const columns = useMemo(
    () =>
      createConsoleColumns({
        onCopy: handleCopyLog,
        onDelete: handleDeleteLog,
      }),
    [handleCopyLog, handleDeleteLog]
  );

  // Sync TanStack Table selection with local state
  const handleRowSelectionChange = useCallback(
    (selection: Record<string, boolean>): void => {
      const selectedSet = new Set(Object.keys(selection).filter((id) => selection[id] === true));
      const currentSet = selectedLogIds;

      // Handle select all / deselect all
      if (selectedSet.size === filteredLogs.length && currentSet.size === 0) {
        // Select all
        const allLogIds = new Set(filteredLogs.map((log) => log.id));
        setSelectedLogIds(allLogIds);
        if (filteredLogs.length > 0) {
          setLastSelectedIndex(filteredLogs.length - 1);
        }
        return;
      }
      if (selectedSet.size === 0 && currentSet.size > 0) {
        // Deselect all
        setSelectedLogIds(new Set());
        setLastSelectedIndex(null);
        return;
      }

      // Batch update: only toggle IDs that changed
      for (const id of selectedSet) {
        if (!currentSet.has(id)) {
          handleToggleSelect(id);
        }
      }
      for (const id of currentSet) {
        if (!selectedSet.has(id)) {
          handleToggleSelect(id);
        }
      }
    },
    [selectedLogIds, handleToggleSelect, filteredLogs]
  );

  // Convert local selection to TanStack Table format
  const initialRowSelection = useMemo(() => {
    const selection: Record<string, boolean> = {};
    for (const id of selectedLogIds) {
      selection[id] = true;
    }
    return selection;
  }, [selectedLogIds]);

  // Sync TanStack Table expansion with local state
  // Use functional updates to avoid dependency on expandedLogIds (prevents infinite loops)
  const handleExpandedChange = useCallback((expanded: Record<string, boolean>): void => {
    // Prevent circular updates - if we're already updating from user action, skip
    if (isUpdatingExpansionRef.current) {
      return;
    }

    const expandedSet = new Set(Object.keys(expanded).filter((id) => expanded[id] === true));

    // Update expanded state using functional update to avoid dependency on expandedLogIds
    setExpandedLogIds((prev) => {
      // Filter prev to only non-occurrence IDs for comparison (TanStack Table doesn't track occurrences)
      const prevMainIds = new Set(Array.from(prev).filter((id) => !id.includes('_occurrences')));

      // If both are empty, no update needed (prevents unnecessary re-renders)
      if (expandedSet.size === 0 && prevMainIds.size === 0) {
        return prev;
      }

      // Check if the sets are actually different before updating
      let hasChanges = false;
      if (expandedSet.size !== prevMainIds.size) {
        hasChanges = true;
      } else {
        // Check if any IDs differ
        for (const id of expandedSet) {
          if (!prevMainIds.has(id)) {
            hasChanges = true;
            break;
          }
        }
        if (!hasChanges) {
          // Check if prevMainIds has IDs not in expandedSet
          for (const id of prevMainIds) {
            if (!expandedSet.has(id)) {
              hasChanges = true;
              break;
            }
          }
        }
      }

      // If no changes, return prev to prevent unnecessary re-render
      if (!hasChanges) {
        return prev;
      }

      const next = new Set(prev);
      // Add new expansions
      for (const id of expandedSet) {
        next.add(id);
      }
      // Remove deselections (only for main log IDs, not occurrences)
      for (const id of prev) {
        if (!id.includes('_occurrences') && !expandedSet.has(id)) {
          next.delete(id);
        }
      }
      return next;
    });
  }, []); // Empty deps - uses functional updates

  // Convert local expansion to TanStack Table format (only for initial mount)
  // After mount, expansion state is controlled via handleExpandedChange callback
  const initialExpanded = useMemo(() => {
    return {};
  }, []); // Always start with no expansions - handleExpandedChange will sync from TanStack Table

  // Refs for external control
  const setRowSelectionRef = useRef<((selection: Record<string, boolean>) => void) | null>(null);
  const setExpandedRef = useRef<((expanded: Record<string, boolean>) => void) | null>(null);
  // Ref to prevent circular updates when syncing expansion state
  const isUpdatingExpansionRef = useRef(false);

  const handleSetRowSelectionReady = useCallback(
    (setRowSelectionFn: (selection: Record<string, boolean>) => void): void => {
      setRowSelectionRef.current = setRowSelectionFn;
    },
    []
  );

  const handleSetExpandedReady = useCallback(
    (setExpandedFn: (expanded: Record<string, boolean>) => void): void => {
      setExpandedRef.current = setExpandedFn;
    },
    []
  );

  const handleContextMenu = useCallback((event: React.MouseEvent, log: DisplayLog): void => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      log,
      position: { x: event.clientX, y: event.clientY },
    });
  }, []);

  // Custom row renderer that includes expanded content
  const renderRow = useCallback(
    (row: Row<DisplayLogEntry>, cells: React.ReactNode): React.ReactNode => {
      const entry = row.original;
      const originalLog = entry._originalLog;
      if (originalLog === undefined) {
        return null;
      }

      const isGrouped = isGroupedLog(originalLog);
      // Use TanStack Table's expanded state as source of truth (matches NetworkHistoryPanel pattern)
      const isExpanded = row.getIsExpanded();
      const isSelected = selectedLogIds.has(entry.id);
      const logLevel = entry.level;

      // Handle row click for selection (with Shift/Ctrl support)
      const handleRowClick = (e: React.MouseEvent): void => {
        // Don't toggle if clicking on buttons or checkboxes
        const target = e.target as HTMLElement;
        if (
          target.closest('button') !== null ||
          target.closest('[role="checkbox"]') !== null ||
          target.closest('input') !== null
        ) {
          return;
        }

        e.preventDefault();

        // Find current log index in filtered logs
        const currentIndex = filteredLogs.findIndex((log) => log.id === entry.id);
        if (currentIndex < 0) {
          return;
        }

        // Handle Shift-click for range selection
        if (e.shiftKey && lastSelectedIndex !== null) {
          handleSelectRange(lastSelectedIndex, currentIndex);
          setLastSelectedIndex(currentIndex);
          return;
        }

        // Handle Ctrl/Cmd-click for multi-select
        if (e.ctrlKey || e.metaKey) {
          handleToggleSelect(entry.id);
          setLastSelectedIndex(currentIndex);
          return;
        }

        // Single click: toggle selection
        handleToggleSelect(entry.id);
        setLastSelectedIndex(currentIndex);
      };

      // Handle double-click for expansion
      const handleRowDoubleClick = (e: React.MouseEvent): void => {
        const target = e.target as HTMLElement;
        if (
          target.closest('button') !== null ||
          target.closest('[role="checkbox"]') !== null ||
          target.closest('input') !== null
        ) {
          return;
        }

        // For non-grouped logs, only expand if there are args
        if (!isGrouped && entry.args.length === 0) {
          return;
        }

        // Toggle expansion
        // Set flag FIRST to prevent handleExpandedChange from running
        isUpdatingExpansionRef.current = true;

        // Update local state
        setExpandedLogIds((prev) => {
          const next = new Set(prev);
          if (next.has(entry.id)) {
            next.delete(entry.id);
          } else {
            next.add(entry.id);
          }
          return next;
        });

        // Sync to TanStack Table
        if (setExpandedRef.current !== null) {
          const newExpanded: Record<string, boolean> = {};
          // Use TanStack Table's expansion state as source of truth
          const currentlyExpanded = row.getIsExpanded();
          if (!currentlyExpanded) {
            newExpanded[entry.id] = true;
          }
          setExpandedRef.current(newExpanded);
        }

        // Clear flag after state updates complete
        setTimeout(() => {
          isUpdatingExpansionRef.current = false;
        }, 0);
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

      // Format args for display (combine all args into single CodeSnippet)
      const formattedArgs = isGrouped
        ? originalLog.sampleLog.args.length > 0
          ? formatLogArgs(originalLog.sampleLog.args)
          : null
        : entry.args.length > 0
          ? formatLogArgs(entry.args)
          : null;

      return (
        <>
          <tr
            key={row.id}
            className={cn(
              'group border-b border-border-default hover:bg-bg-raised/50 transition-colors cursor-pointer select-none',
              isSelected && 'bg-bg-raised/30',
              getLogLevelClass(logLevel)
            )}
            data-row-id={row.id}
            data-testid={`console-log-${logLevel}`}
            onClick={handleRowClick}
            onDoubleClick={handleRowDoubleClick}
            onMouseDown={(e): void => {
              // Prevent text selection on Shift-click
              if (e.shiftKey) {
                e.preventDefault();
              }
            }}
            onContextMenu={(e): void => {
              handleContextMenu(e, originalLog);
            }}
          >
            {cells}
          </tr>
          {/* Expanded content row */}
          {isExpanded && (
            <tr key={`${row.id}-expanded`}>
              <td colSpan={columns.length} className="p-0">
                <ExpandedContent innerClassName="mt-0.5 space-y-0.5 border-l border-border-default pl-2">
                  {isGrouped ? (
                    <>
                      {/* Args content (grouped logs show args once) */}
                      {formattedArgs !== null && (
                        <div className="mb-2">
                          <div className="pl-2 border-l border-border-default">
                            <CodeSnippet
                              code={formattedArgs.code}
                              language={formattedArgs.language}
                              variant="borderless"
                              className="text-xs"
                            />
                          </div>
                        </div>
                      )}

                      {/* Occurrences list */}
                      {originalLog.count > 1 && (
                        <div>
                          <button
                            type="button"
                            onClick={(): void => {
                              const occurrencesKey = `${originalLog.id}_occurrences`;
                              setExpandedLogIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(occurrencesKey)) {
                                  next.delete(occurrencesKey);
                                } else {
                                  next.add(occurrencesKey);
                                }
                                return next;
                              });
                            }}
                            className="flex items-center gap-2 px-2 py-1 text-xs text-text-muted hover:text-text-primary hover:bg-bg-raised/30 rounded transition-colors w-full"
                          >
                            {expandedLogIds.has(`${originalLog.id}_occurrences`) ? (
                              <ChevronDown size={12} />
                            ) : (
                              <ChevronRight size={12} />
                            )}
                            <span>
                              {originalLog.count} occurrence{originalLog.count !== 1 ? 's' : ''} at:
                            </span>
                          </button>
                          {expandedLogIds.has(`${originalLog.id}_occurrences`) && (
                            <div className="ml-6 mt-0.5 space-y-0.5">
                              {originalLog.allLogs.map((individualLog) => (
                                <div
                                  key={individualLog.id}
                                  className="flex items-center gap-2 px-2 py-0.5 text-xs text-text-muted font-mono"
                                  onContextMenu={(e): void => {
                                    handleContextMenu(e, individualLog);
                                  }}
                                >
                                  <span className="shrink-0 w-24">
                                    {formatTimestamp(individualLog.timestamp)}
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
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    /* Individual log args */
                    formattedArgs !== null && (
                      <div className="pl-2 border-l border-border-default">
                        <CodeSnippet
                          code={formattedArgs.code}
                          language={formattedArgs.language}
                          variant="borderless"
                          className="text-xs"
                        />
                      </div>
                    )
                  )}
                </ExpandedContent>
              </td>
            </tr>
          )}
        </>
      );
    },
    [
      expandedLogIds, // Needed for occurrences sub-expansion (nested within expanded rows)
      selectedLogIds,
      lastSelectedIndex,
      filteredLogs,
      columns.length,
      handleSelectRange,
      handleToggleSelect,
      handleContextMenu,
      formatTimestamp,
      // setExpandedRef is a ref, doesn't need to be in deps
    ]
  );

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
        searchFilter={searchFilter}
        onSearchFilterChange={setSearchFilter}
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

      {/* Log list container */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Note: Select all is handled via TanStack Table's header checkbox in selection column */}

        {/* VirtualDataGrid - replaces custom rendering */}
        {/* Note: VirtualDataGrid handles scrolling internally, no need for overflow-x-auto wrapper */}
        <div
          className="flex-1 flex flex-col min-h-0"
          ref={logContainerRef}
          data-testid="console-logs"
        >
          <VirtualDataGrid
            data={tableData}
            columns={columns}
            getRowId={(row) => row.id}
            enableRowSelection={true}
            enableExpanding={true}
            getRowCanExpand={() => true}
            initialRowSelection={initialRowSelection}
            initialExpanded={initialExpanded}
            initialColumnPinning={{ left: ['select', 'expand'], right: ['actions'] }}
            onRowSelectionChange={handleRowSelectionChange}
            onExpandedChange={handleExpandedChange}
            onSetRowSelectionReady={handleSetRowSelectionReady}
            onSetExpandedReady={handleSetExpandedReady}
            estimateRowHeight={32}
            emptyMessage={`No logs${filter !== 'all' ? ` (${filter} only)` : ''}`}
            renderRow={renderRow}
            height={600}
            className="flex-1 font-mono text-xs"
          />
        </div>
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
