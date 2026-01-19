/**
 * @file useHistoryStream hook
 * @description Hook for real-time history event streaming from Tauri backend
 *
 * Subscribes to Tauri events for live history updates:
 * - history:new - New entry added
 * - history:deleted - Entry deleted
 * - history:cleared - All entries cleared
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { HistoryEntry } from '@/types/generated/HistoryEntry';

/**
 * Options for the useHistoryStream hook
 */
export interface UseHistoryStreamOptions {
  /** Callback when a new entry is received */
  onNewEntry: (entry: HistoryEntry) => void;

  /** Callback when an entry is deleted */
  onDeleted?: (id: string) => void;

  /** Callback when all entries are cleared */
  onCleared?: () => void;
}

/**
 * Return type for the useHistoryStream hook
 */
export interface UseHistoryStreamReturn {
  /** The most recently received entry */
  latestEntry: HistoryEntry | null;

  /** Count of events received since mount */
  eventCount: number;

  /** Whether the stream is connected */
  isConnected: boolean;
}

/**
 * Hook for subscribing to real-time history events.
 *
 * @example
 * ```tsx
 * const { latestEntry, eventCount } = useHistoryStream({
 *   onNewEntry: (entry) => setEntries([entry, ...entries]),
 *   onDeleted: (id) => setEntries(entries.filter(e => e.id !== id)),
 *   onCleared: () => setEntries([]),
 * });
 * ```
 */
export function useHistoryStream(options: UseHistoryStreamOptions): UseHistoryStreamReturn {
  const { onNewEntry, onDeleted, onCleared } = options;

  const [latestEntry, setLatestEntry] = useState<HistoryEntry | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Store callbacks in refs to avoid re-subscribing on callback changes
  const onNewEntryRef = useRef(onNewEntry);
  const onDeletedRef = useRef(onDeleted);
  const onClearedRef = useRef(onCleared);

  // Update refs when callbacks change
  useEffect(() => {
    onNewEntryRef.current = onNewEntry;
    onDeletedRef.current = onDeleted;
    onClearedRef.current = onCleared;
  }, [onNewEntry, onDeleted, onCleared]);

  // Handle new entry event
  const handleNewEntry = useCallback((entry: HistoryEntry): void => {
    setLatestEntry(entry);
    setEventCount((prev) => prev + 1);
    onNewEntryRef.current(entry);
  }, []);

  // Handle deleted event
  const handleDeleted = useCallback((id: string): void => {
    if (onDeletedRef.current !== undefined) {
      onDeletedRef.current(id);
    }
  }, []);

  // Handle cleared event
  const handleCleared = useCallback((): void => {
    setLatestEntry(null);
    if (onClearedRef.current !== undefined) {
      onClearedRef.current();
    }
  }, []);

  // Subscribe to Tauri events
  useEffect(() => {
    const unlistenFns: UnlistenFn[] = [];

    const setupListeners = async (): Promise<void> => {
      try {
        // Listen for new entries
        const unlistenNew = await listen<HistoryEntry>('history:new', (event) => {
          handleNewEntry(event.payload);
        });
        unlistenFns.push(unlistenNew);

        // Listen for deletions
        const unlistenDeleted = await listen<string>('history:deleted', (event) => {
          handleDeleted(event.payload);
        });
        unlistenFns.push(unlistenDeleted);

        // Listen for clear
        const unlistenCleared = await listen('history:cleared', () => {
          handleCleared();
        });
        unlistenFns.push(unlistenCleared);

        setIsConnected(true);
      } catch (error) {
        console.error('Failed to subscribe to history events:', error);
      }
    };

    void setupListeners();

    // Cleanup on unmount
    return (): void => {
      setIsConnected(false);
      for (const unlisten of unlistenFns) {
        unlisten();
      }
    };
  }, [handleNewEntry, handleDeleted, handleCleared]);

  return {
    latestEntry,
    eventCount,
    isConnected,
  };
}
