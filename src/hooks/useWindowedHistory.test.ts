/**
 * @file useWindowedHistory hook tests
 * @description Tests for windowed history data fetching with pagination
 *
 * TDD: RED phase - these tests will fail until the hook is implemented
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useWindowedHistory } from './useWindowedHistory';

// Mock Tauri invoke
const mockInvoke = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]): unknown => mockInvoke(...args) as unknown,
}));

interface MockHistoryEntry {
  id: string;
  timestamp: string;
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: string | null;
    timeout_ms: number;
  };
  response: {
    status: number;
    status_text: string;
    headers: Record<string, string>;
    body: string;
    timing: {
      total_time_ms: number;
      dns_lookup_ms: number;
      connect_time_ms: number;
      tls_time_ms: number;
      first_byte_ms: number;
      download_time_ms: number;
    };
  };
}

// Mock history entry factory
function createMockEntry(id: string): MockHistoryEntry {
  return {
    id,
    timestamp: new Date().toISOString(),
    request: {
      url: `https://api.example.com/${id}`,
      method: 'GET',
      headers: {},
      body: null,
      timeout_ms: 30000,
    },
    response: {
      status: 200,
      status_text: 'OK',
      headers: {},
      body: '{}',
      timing: {
        total_time_ms: 100,
        dns_lookup_ms: 10,
        connect_time_ms: 20,
        tls_time_ms: 30,
        first_byte_ms: 25,
        download_time_ms: 15,
      },
    },
  };
}

describe('useWindowedHistory', () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with empty data and loading state', () => {
      mockInvoke.mockResolvedValue(0);

      const { result } = renderHook(() => useWindowedHistory({ pageSize: 50 }));

      expect(result.current.entries).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.totalCount).toBe(0);
    });
  });

  describe('count fetching', () => {
    it('fetches total count on mount', async () => {
      mockInvoke.mockImplementation((cmd: string): Promise<unknown> => {
        if (cmd === 'get_history_count') {
          return Promise.resolve(100);
        }
        if (cmd === 'get_history_ids') {
          return Promise.resolve([]);
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useWindowedHistory({ pageSize: 50 }));

      await waitFor(() => {
        expect(result.current.totalCount).toBe(100);
      });

      expect(mockInvoke).toHaveBeenCalledWith('get_history_count');
    });
  });

  describe('data loading', () => {
    it('fetches first page of IDs and entries', async () => {
      const mockIds = ['id1', 'id2', 'id3'];
      const mockEntries = mockIds.map(createMockEntry);

      mockInvoke.mockImplementation((cmd: string): Promise<unknown> => {
        if (cmd === 'get_history_count') {
          return Promise.resolve(3);
        }
        if (cmd === 'get_history_ids') {
          return Promise.resolve(mockIds);
        }
        if (cmd === 'get_history_batch') {
          return Promise.resolve(mockEntries);
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useWindowedHistory({ pageSize: 50 }));

      await waitFor(() => {
        expect(result.current.entries.length).toBe(3);
      });

      expect(result.current.entries[0]?.id).toBe('id1');
    });

    it('loads entries in pages when scrolling', async () => {
      // Create 100 mock IDs
      const mockIds = Array.from({ length: 100 }, (_, i) => `id${String(i)}`);
      const pageSize = 20;

      mockInvoke.mockImplementation(
        (cmd: string, args?: Record<string, unknown>): Promise<unknown> => {
          if (cmd === 'get_history_count') {
            return Promise.resolve(100);
          }
          if (cmd === 'get_history_ids') {
            const offset = typeof args?.offset === 'number' ? args.offset : 0;
            const limit = typeof args?.limit === 'number' ? args.limit : pageSize;
            return Promise.resolve(mockIds.slice(offset, offset + limit));
          }
          if (cmd === 'get_history_batch') {
            const ids = args?.ids as string[];
            return Promise.resolve(ids.map(createMockEntry));
          }
          return Promise.resolve(null);
        }
      );

      const { result } = renderHook(() => useWindowedHistory({ pageSize }));

      await waitFor(() => {
        expect(result.current.entries.length).toBeGreaterThan(0);
      });

      // Load more entries
      await act(async () => {
        await result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.entries.length).toBe(40); // 2 pages
      });
    });
  });

  describe('refresh', () => {
    it('refetches data when refresh is called', async () => {
      let callCount = 0;
      mockInvoke.mockImplementation((cmd: string): Promise<unknown> => {
        if (cmd === 'get_history_count') {
          callCount++;
          return Promise.resolve(callCount * 10);
        }
        if (cmd === 'get_history_ids') {
          return Promise.resolve([]);
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useWindowedHistory({ pageSize: 50 }));

      await waitFor(() => {
        expect(result.current.totalCount).toBe(10);
      });

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.totalCount).toBe(20);
      });
    });
  });

  describe('error handling', () => {
    it('sets error state when fetch fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useWindowedHistory({ pageSize: 50 }));

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error).toMatch(/Network error/);
    });
  });

  describe('hasMore', () => {
    it('indicates when more data is available', async () => {
      const mockIds = Array.from({ length: 100 }, (_, i) => `id${String(i)}`);

      mockInvoke.mockImplementation(
        (cmd: string, args?: Record<string, unknown>): Promise<unknown> => {
          if (cmd === 'get_history_count') {
            return Promise.resolve(100);
          }
          if (cmd === 'get_history_ids') {
            const offset = typeof args?.offset === 'number' ? args.offset : 0;
            const limit = typeof args?.limit === 'number' ? args.limit : 50;
            return Promise.resolve(mockIds.slice(offset, offset + limit));
          }
          if (cmd === 'get_history_batch') {
            const ids = args?.ids as string[];
            return Promise.resolve(ids.map(createMockEntry));
          }
          return Promise.resolve(null);
        }
      );

      const { result } = renderHook(() => useWindowedHistory({ pageSize: 50 }));

      await waitFor(() => {
        expect(result.current.entries.length).toBe(50);
      });

      expect(result.current.hasMore).toBe(true);

      // Load remaining entries
      await act(async () => {
        await result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.entries.length).toBe(100);
      });

      expect(result.current.hasMore).toBe(false);
    });
  });
});
