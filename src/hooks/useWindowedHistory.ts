/**
 * @file useWindowedHistory hook
 * @description Hook for windowed history data fetching with pagination
 *
 * This hook provides efficient loading of large history datasets by:
 * 1. Fetching total count first
 * 2. Loading entry IDs in pages (windowed queries)
 * 3. Batch loading entry data as needed
 *
 * Designed to work with the VirtualDataGrid for 10k+ entries.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { HistoryEntry } from '@/types/generated/HistoryEntry';

/**
 * Options for the useWindowedHistory hook
 */
export interface UseWindowedHistoryOptions {
  /** Number of entries to load per page */
  pageSize: number;

  /** Sort order (true = newest first) */
  sortDesc?: boolean;

  /** Auto-fetch on mount */
  autoFetch?: boolean;
}

/**
 * Return type for the useWindowedHistory hook
 */
export interface UseWindowedHistoryReturn {
  /** Loaded history entries */
  entries: HistoryEntry[];

  /** Total count of all entries */
  totalCount: number;

  /** Whether currently loading */
  isLoading: boolean;

  /** Error message if any */
  error: string | null;

  /** Whether there are more entries to load */
  hasMore: boolean;

  /** Load the next page of entries */
  loadMore: () => Promise<void>;

  /** Refresh from the beginning */
  refresh: () => Promise<void>;
}

/**
 * Hook for loading history entries with windowed pagination.
 *
 * @example
 * ```tsx
 * const { entries, isLoading, loadMore, hasMore } = useWindowedHistory({
 *   pageSize: 50,
 * });
 *
 * // Use with VirtualDataGrid
 * <VirtualDataGrid
 *   data={entries}
 *   onEndReached={hasMore ? loadMore : undefined}
 * />
 * ```
 */
export function useWindowedHistory(options: UseWindowedHistoryOptions): UseWindowedHistoryReturn {
  const { pageSize, sortDesc = true, autoFetch = true } = options;

  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track current offset for pagination
  const offsetRef = useRef(0);
  const isLoadingMoreRef = useRef(false);

  /**
   * Fetch the total count of history entries
   */
  const fetchCount = useCallback(async (): Promise<number> => {
    try {
      const count = await invoke<number>('get_history_count');
      setTotalCount(count);
      return count;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to fetch count: ${message}`);
      throw err;
    }
  }, []);

  /**
   * Fetch a page of entry IDs
   */
  const fetchIds = useCallback(
    async (offset: number, limit: number): Promise<string[]> => {
      try {
        return await invoke<string[]>('get_history_ids', {
          limit,
          offset,
          sortDesc,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(`Failed to fetch IDs: ${message}`);
        throw err;
      }
    },
    [sortDesc]
  );

  /**
   * Fetch entries by their IDs
   */
  const fetchBatch = useCallback(async (ids: string[]): Promise<HistoryEntry[]> => {
    if (ids.length === 0) {
      return [];
    }

    try {
      return await invoke<HistoryEntry[]>('get_history_batch', { ids });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to fetch entries: ${message}`);
      throw err;
    }
  }, []);

  /**
   * Load the initial page of entries
   */
  const loadInitial = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    offsetRef.current = 0;

    try {
      await fetchCount();
      const ids = await fetchIds(0, pageSize);
      const batchEntries = await fetchBatch(ids);

      setEntries(batchEntries);
      offsetRef.current = batchEntries.length;
    } catch {
      // Error already set in individual fetch functions
    } finally {
      setIsLoading(false);
    }
  }, [fetchCount, fetchIds, fetchBatch, pageSize]);

  /**
   * Load more entries (next page)
   */
  const loadMore = useCallback(async (): Promise<void> => {
    if (isLoadingMoreRef.current) {
      return;
    }

    isLoadingMoreRef.current = true;

    try {
      const ids = await fetchIds(offsetRef.current, pageSize);
      if (ids.length === 0) {
        return;
      }

      const batchEntries = await fetchBatch(ids);

      setEntries((prev) => [...prev, ...batchEntries]);
      offsetRef.current += batchEntries.length;
    } catch {
      // Error already set in individual fetch functions
    } finally {
      isLoadingMoreRef.current = false;
    }
  }, [fetchIds, fetchBatch, pageSize]);

  /**
   * Refresh from the beginning
   */
  const refresh = useCallback(async (): Promise<void> => {
    await loadInitial();
  }, [loadInitial]);

  // Calculate hasMore
  const hasMore = entries.length < totalCount;

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      void loadInitial();
    }
  }, [autoFetch, loadInitial]);

  return {
    entries,
    totalCount,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
