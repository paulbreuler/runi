import { create } from 'zustand';
import type { ConsoleLog, LogLevel } from '@/types/console';

/**
 * Grouped log for displaying multiple identical logs as a single entry.
 */
export interface GroupedLog {
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

export type DisplayLog = ConsoleLog | GroupedLog;

export function isGroupedLog(log: DisplayLog): log is GroupedLog {
  return 'count' in log && 'allLogs' in log;
}

/**
 * Serialize args deterministically for grouping.
 * Sorts object keys to ensure consistent serialization regardless of key order.
 */
function serializeArgs(args: unknown[]): string {
  try {
    return JSON.stringify(args, (_key: string, value: unknown): unknown => {
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
    return String(args);
  }
}

interface ConsoleState {
  // Data State
  logs: ConsoleLog[];
  isLoading: boolean;
  error: string | null;

  // UI State
  filter: LogLevel | 'all';
  searchFilter: string;
  autoScroll: boolean;
  expandedLogIds: Set<string>;
  selectedLogIds: Set<string>;
  lastSelectedIndex: number | null;

  // Data Actions
  addLog: (log: ConsoleLog) => void;
  deleteLog: (id: string) => void;
  clearLogs: () => void;
  setLogs: (logs: ConsoleLog[]) => void;

  // UI Actions
  setFilter: (filter: LogLevel | 'all') => void;
  setSearchFilter: (search: string) => void;
  setAutoScroll: (enabled: boolean) => void;
  toggleExpanded: (id: string) => void;
  setExpandedLogIds: (ids: Set<string>) => void;
  toggleSelection: (id: string) => void;
  selectRange: (fromIndex: number, toIndex: number, filteredLogs: DisplayLog[]) => void;
  selectAll: (filteredLogs: DisplayLog[]) => void;
  deselectAll: () => void;
  setLastSelectedIndex: (index: number | null) => void;

  // Computed (returns filtered and grouped logs)
  filteredLogs: () => DisplayLog[];
}

/**
 * Helper function to check if log matches search text.
 */
function matchesSearch(log: ConsoleLog, searchText: string): boolean {
  const searchLower = searchText.toLowerCase();

  if (log.message.toLowerCase().includes(searchLower)) {
    return true;
  }

  if (
    log.correlationId !== undefined &&
    log.correlationId !== '' &&
    log.correlationId.toLowerCase().includes(searchLower)
  ) {
    return true;
  }

  try {
    const argsString = JSON.stringify(log.args).toLowerCase();
    if (argsString.includes(searchLower)) {
      return true;
    }
  } catch {
    const argsString = String(log.args).toLowerCase();
    if (argsString.includes(searchLower)) {
      return true;
    }
  }

  return false;
}

export const useConsoleStore = create<ConsoleState>((set, get) => ({
  // Data State
  logs: [],
  isLoading: false,
  error: null,

  // UI State
  filter: 'all',
  searchFilter: '',
  autoScroll: true,
  expandedLogIds: new Set<string>(),
  selectedLogIds: new Set<string>(),
  lastSelectedIndex: null,

  // Data Actions
  addLog: (log: ConsoleLog): void => {
    set((state) => ({
      logs: [...state.logs, log],
    }));
  },

  deleteLog: (id: string): void => {
    set((state) => {
      const newSelectedIds = new Set(state.selectedLogIds);
      newSelectedIds.delete(id);

      const newExpandedIds = new Set(state.expandedLogIds);
      newExpandedIds.delete(id);
      newExpandedIds.delete(`${id}_occurrences`);

      return {
        logs: state.logs.filter((log) => log.id !== id),
        selectedLogIds: newSelectedIds,
        expandedLogIds: newExpandedIds,
      };
    });
  },

  clearLogs: (): void => {
    set({
      logs: [],
      selectedLogIds: new Set<string>(),
      expandedLogIds: new Set<string>(),
      lastSelectedIndex: null,
    });
  },

  setLogs: (logs: ConsoleLog[]): void => {
    set({ logs });
  },

  // UI Actions
  setFilter: (filter: LogLevel | 'all'): void => {
    set({ filter });
  },

  setSearchFilter: (search: string): void => {
    set({ searchFilter: search });
  },

  setAutoScroll: (enabled: boolean): void => {
    set({ autoScroll: enabled });
  },

  toggleExpanded: (id: string): void => {
    set((state) => {
      const newExpandedIds = new Set(state.expandedLogIds);
      if (newExpandedIds.has(id)) {
        newExpandedIds.delete(id);
      } else {
        newExpandedIds.add(id);
      }
      return { expandedLogIds: newExpandedIds };
    });
  },

  setExpandedLogIds: (ids: Set<string>): void => {
    set({ expandedLogIds: ids });
  },

  toggleSelection: (id: string): void => {
    set((state) => {
      const newSelectedIds = new Set(state.selectedLogIds);
      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id);
      } else {
        newSelectedIds.add(id);
      }
      return { selectedLogIds: newSelectedIds };
    });
  },

  selectRange: (fromIndex: number, toIndex: number, filteredLogs: DisplayLog[]): void => {
    set((state) => {
      const newSelectedIds = new Set(state.selectedLogIds);
      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);

      for (let i = start; i <= end && i < filteredLogs.length; i++) {
        const log = filteredLogs[i];
        if (log !== undefined) {
          newSelectedIds.add(log.id);
        }
      }

      return { selectedLogIds: newSelectedIds };
    });
  },

  selectAll: (filteredLogs: DisplayLog[]): void => {
    const allLogIds = new Set(filteredLogs.map((log) => log.id));
    const lastSelectedIndex = filteredLogs.length > 0 ? filteredLogs.length - 1 : null;
    set({ selectedLogIds: allLogIds, lastSelectedIndex });
  },

  deselectAll: (): void => {
    set({
      selectedLogIds: new Set<string>(),
      lastSelectedIndex: null,
    });
  },

  setLastSelectedIndex: (index: number | null): void => {
    set({ lastSelectedIndex: index });
  },

  // Computed
  filteredLogs: (): DisplayLog[] => {
    const { logs, filter, searchFilter } = get();

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
  },
}));
