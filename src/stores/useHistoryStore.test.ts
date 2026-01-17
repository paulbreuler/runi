import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistoryStore } from './useHistoryStore';
import type { HistoryEntry } from '@/types/generated/HistoryEntry';
import { invoke } from '@tauri-apps/api/core';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('useHistoryStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state
    useHistoryStore.getState().entries = [];
    useHistoryStore.getState().isLoading = false;
    useHistoryStore.getState().error = null;
  });

  describe('loadHistory', () => {
    it('should load history entries successfully', async () => {
      const mockEntries: HistoryEntry[] = [
        {
          id: 'hist_1',
          timestamp: '2026-01-15T10:00:00Z',
          request: {
            url: 'https://api.example.com/users',
            method: 'GET',
            headers: {},
            body: null,
            timeout_ms: 30000,
          },
          response: {
            status: 200,
            status_text: 'OK',
            headers: {},
            body: '{"users": []}',
            timing: {
              total_ms: 100,
              dns_ms: null,
              connect_ms: null,
              tls_ms: null,
              first_byte_ms: null,
            },
          },
        },
      ];

      vi.mocked(invoke).mockResolvedValue(mockEntries);

      const { result } = renderHook(() => useHistoryStore());

      await act(async () => {
        await result.current.loadHistory();
      });

      expect(invoke).toHaveBeenCalledWith('load_request_history', { limit: 100 });
      expect(result.current.entries).toEqual(mockEntries);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle loading state correctly', async () => {
      vi.mocked(invoke).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve([]);
            }, 100);
          })
      );

      const { result } = renderHook(() => useHistoryStore());

      act(() => {
        void result.current.loadHistory();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle errors when loading history', async () => {
      const errorMessage = 'Failed to load history';
      vi.mocked(invoke).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useHistoryStore());

      await act(async () => {
        await result.current.loadHistory();
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('addEntry', () => {
    it('should save a new history entry', async () => {
      const mockEntry: HistoryEntry = {
        id: 'hist_new',
        timestamp: '2026-01-15T10:00:00Z',
        request: {
          url: 'https://api.example.com/test',
          method: 'POST',
          headers: {},
          body: '{"test": true}',
          timeout_ms: 30000,
        },
        response: {
          status: 201,
          status_text: 'Created',
          headers: {},
          body: '{"id": 1}',
          timing: {
            total_ms: 150,
            dns_ms: null,
            connect_ms: null,
            tls_ms: null,
            first_byte_ms: null,
          },
        },
      };

      vi.mocked(invoke).mockResolvedValue(mockEntry.id);

      const { result } = renderHook(() => useHistoryStore());

      await act(async () => {
        await result.current.addEntry(mockEntry.request, mockEntry.response);
      });

      expect(invoke).toHaveBeenCalledWith('save_request_history', {
        request: mockEntry.request,
        response: mockEntry.response,
      });
      expect(result.current.entries).toHaveLength(1);
      const firstEntry = result.current.entries[0];
      if (firstEntry === undefined) {
        throw new Error('firstEntry is undefined');
      }
      expect(firstEntry.id).toBe(mockEntry.id);
    });

    it('should prepend new entries to the beginning', async () => {
      const existingEntry: HistoryEntry = {
        id: 'hist_old',
        timestamp: '2026-01-15T09:00:00Z',
        request: {
          url: 'https://api.example.com/old',
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
            total_ms: 50,
            dns_ms: null,
            connect_ms: null,
            tls_ms: null,
            first_byte_ms: null,
          },
        },
      };

      useHistoryStore.getState().entries = [existingEntry];

      const newEntry: HistoryEntry = {
        id: 'hist_new',
        timestamp: '2026-01-15T10:00:00Z',
        request: {
          url: 'https://api.example.com/new',
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
            total_ms: 50,
            dns_ms: null,
            connect_ms: null,
            tls_ms: null,
            first_byte_ms: null,
          },
        },
      };

      vi.mocked(invoke).mockResolvedValue(newEntry.id);

      const { result } = renderHook(() => useHistoryStore());

      await act(async () => {
        await result.current.addEntry(newEntry.request, newEntry.response);
      });

      expect(result.current.entries).toHaveLength(2);
      const firstEntry = result.current.entries[0];
      const secondEntry = result.current.entries[1];
      if (firstEntry === undefined || secondEntry === undefined) {
        throw new Error('Entry is undefined');
      }
      expect(firstEntry.id).toBe(newEntry.id);
      expect(secondEntry.id).toBe(existingEntry.id);
    });
  });

  describe('deleteEntry', () => {
    it('should delete an entry by id', async () => {
      const entries: HistoryEntry[] = [
        {
          id: 'hist_1',
          timestamp: '2026-01-15T10:00:00Z',
          request: {
            url: 'https://api.example.com/1',
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
              total_ms: 50,
              dns_ms: null,
              connect_ms: null,
              tls_ms: null,
              first_byte_ms: null,
            },
          },
        },
        {
          id: 'hist_2',
          timestamp: '2026-01-15T11:00:00Z',
          request: {
            url: 'https://api.example.com/2',
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
              total_ms: 50,
              dns_ms: null,
              connect_ms: null,
              tls_ms: null,
              first_byte_ms: null,
            },
          },
        },
      ];

      useHistoryStore.getState().entries = entries;
      vi.mocked(invoke).mockResolvedValue(undefined);

      const { result } = renderHook(() => useHistoryStore());

      await act(async () => {
        await result.current.deleteEntry('hist_1');
      });

      expect(invoke).toHaveBeenCalledWith('delete_history_entry', { id: 'hist_1' });
      expect(result.current.entries).toHaveLength(1);
      const firstEntry = result.current.entries[0];
      if (firstEntry === undefined) {
        throw new Error('firstEntry is undefined');
      }
      expect(firstEntry.id).toBe('hist_2');
    });

    it('should handle errors when deleting', async () => {
      const errorMessage = 'Entry not found';
      vi.mocked(invoke).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useHistoryStore());

      await act(async () => {
        await result.current.deleteEntry('hist_invalid');
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('clearHistory', () => {
    it('should clear all history entries', async () => {
      const entries: HistoryEntry[] = [
        {
          id: 'hist_1',
          timestamp: '2026-01-15T10:00:00Z',
          request: {
            url: 'https://api.example.com/1',
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
              total_ms: 50,
              dns_ms: null,
              connect_ms: null,
              tls_ms: null,
              first_byte_ms: null,
            },
          },
        },
      ];

      useHistoryStore.getState().entries = entries;
      vi.mocked(invoke).mockResolvedValue(undefined);

      const { result } = renderHook(() => useHistoryStore());

      await act(async () => {
        await result.current.clearHistory();
      });

      expect(invoke).toHaveBeenCalledWith('clear_request_history');
      expect(result.current.entries).toHaveLength(0);
    });
  });
});
