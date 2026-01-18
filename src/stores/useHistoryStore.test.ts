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
    useHistoryStore.setState({
      entries: [],
      isLoading: false,
      error: null,
      filters: {
        search: '',
        method: 'ALL',
        status: 'All',
        intelligence: 'All',
      },
      selectedId: null,
      expandedId: null,
      compareMode: false,
      compareSelection: [],
    });
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

      expect(invoke).toHaveBeenCalledWith('load_request_history', { limit: undefined });
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

      // Mock both the save call (returns ID) and the reload call (returns entries)
      vi.mocked(invoke)
        .mockResolvedValueOnce(mockEntry.id) // First call: save_request_history
        .mockResolvedValueOnce([mockEntry]); // Second call: load_request_history

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

      // Mock both calls - returns new entry followed by existing (backend returns newest first)
      vi.mocked(invoke)
        .mockResolvedValueOnce(newEntry.id) // First call: save_request_history
        .mockResolvedValueOnce([newEntry, existingEntry]); // Second call: load_request_history

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

  describe('UI state', () => {
    describe('filters', () => {
      it('should initialize with default filters', () => {
        const { result } = renderHook(() => useHistoryStore());

        expect(result.current.filters).toEqual({
          search: '',
          method: 'ALL',
          status: 'All',
          intelligence: 'All',
        });
      });

      it('should update a single filter with setFilter', () => {
        const { result } = renderHook(() => useHistoryStore());

        act(() => {
          result.current.setFilter('search', 'api.example.com');
        });

        expect(result.current.filters.search).toBe('api.example.com');
        expect(result.current.filters.method).toBe('ALL'); // Others unchanged
      });

      it('should update method filter', () => {
        const { result } = renderHook(() => useHistoryStore());

        act(() => {
          result.current.setFilter('method', 'POST');
        });

        expect(result.current.filters.method).toBe('POST');
      });

      it('should update status filter', () => {
        const { result } = renderHook(() => useHistoryStore());

        act(() => {
          result.current.setFilter('status', '4xx');
        });

        expect(result.current.filters.status).toBe('4xx');
      });

      it('should update intelligence filter', () => {
        const { result } = renderHook(() => useHistoryStore());

        act(() => {
          result.current.setFilter('intelligence', 'Has Drift');
        });

        expect(result.current.filters.intelligence).toBe('Has Drift');
      });

      it('should reset all filters to defaults with resetFilters', () => {
        const { result } = renderHook(() => useHistoryStore());

        // Set some filters
        act(() => {
          result.current.setFilter('search', 'test');
          result.current.setFilter('method', 'POST');
          result.current.setFilter('status', '4xx');
        });

        // Reset
        act(() => {
          result.current.resetFilters();
        });

        expect(result.current.filters).toEqual({
          search: '',
          method: 'ALL',
          status: 'All',
          intelligence: 'All',
        });
      });
    });

    describe('selection state', () => {
      it('should initialize with null selectedId', () => {
        const { result } = renderHook(() => useHistoryStore());
        expect(result.current.selectedId).toBe(null);
      });

      it('should set selectedId', () => {
        const { result } = renderHook(() => useHistoryStore());

        act(() => {
          result.current.setSelectedId('hist_123');
        });

        expect(result.current.selectedId).toBe('hist_123');
      });

      it('should clear selectedId with null', () => {
        const { result } = renderHook(() => useHistoryStore());

        act(() => {
          result.current.setSelectedId('hist_123');
        });

        act(() => {
          result.current.setSelectedId(null);
        });

        expect(result.current.selectedId).toBe(null);
      });

      it('should initialize with null expandedId', () => {
        const { result } = renderHook(() => useHistoryStore());
        expect(result.current.expandedId).toBe(null);
      });

      it('should set expandedId', () => {
        const { result } = renderHook(() => useHistoryStore());

        act(() => {
          result.current.setExpandedId('hist_456');
        });

        expect(result.current.expandedId).toBe('hist_456');
      });

      it('should clear expandedId with null', () => {
        const { result } = renderHook(() => useHistoryStore());

        act(() => {
          result.current.setExpandedId('hist_456');
        });

        act(() => {
          result.current.setExpandedId(null);
        });

        expect(result.current.expandedId).toBe(null);
      });
    });

    describe('compare mode', () => {
      it('should initialize with compareMode false', () => {
        const { result } = renderHook(() => useHistoryStore());
        expect(result.current.compareMode).toBe(false);
      });

      it('should set compareMode', () => {
        const { result } = renderHook(() => useHistoryStore());

        act(() => {
          result.current.setCompareMode(true);
        });

        expect(result.current.compareMode).toBe(true);
      });

      it('should initialize with empty compareSelection', () => {
        const { result } = renderHook(() => useHistoryStore());
        expect(result.current.compareSelection).toEqual([]);
      });

      it('should add entry to compareSelection with toggleCompareSelection', () => {
        const { result } = renderHook(() => useHistoryStore());

        act(() => {
          result.current.toggleCompareSelection('hist_1');
        });

        expect(result.current.compareSelection).toEqual(['hist_1']);
      });

      it('should remove entry from compareSelection when toggled again', () => {
        const { result } = renderHook(() => useHistoryStore());

        act(() => {
          result.current.toggleCompareSelection('hist_1');
        });

        act(() => {
          result.current.toggleCompareSelection('hist_1');
        });

        expect(result.current.compareSelection).toEqual([]);
      });

      it('should limit compareSelection to 2 entries', () => {
        const { result } = renderHook(() => useHistoryStore());

        act(() => {
          result.current.toggleCompareSelection('hist_1');
          result.current.toggleCompareSelection('hist_2');
          result.current.toggleCompareSelection('hist_3'); // Should not add
        });

        expect(result.current.compareSelection).toEqual(['hist_1', 'hist_2']);
      });

      it('should clear compareSelection when compareMode is disabled', () => {
        const { result } = renderHook(() => useHistoryStore());

        act(() => {
          result.current.setCompareMode(true);
          result.current.toggleCompareSelection('hist_1');
          result.current.toggleCompareSelection('hist_2');
        });

        act(() => {
          result.current.setCompareMode(false);
        });

        expect(result.current.compareSelection).toEqual([]);
      });
    });

    describe('filteredEntries', () => {
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
        {
          id: 'hist_2',
          timestamp: '2026-01-15T11:00:00Z',
          request: {
            url: 'https://api.example.com/posts',
            method: 'POST',
            headers: {},
            body: '{}',
            timeout_ms: 30000,
          },
          response: {
            status: 201,
            status_text: 'Created',
            headers: {},
            body: '{}',
            timing: {
              total_ms: 150,
              dns_ms: null,
              connect_ms: null,
              tls_ms: null,
              first_byte_ms: null,
            },
          },
        },
        {
          id: 'hist_3',
          timestamp: '2026-01-15T12:00:00Z',
          request: {
            url: 'https://api.example.com/items',
            method: 'DELETE',
            headers: {},
            body: null,
            timeout_ms: 30000,
          },
          response: {
            status: 404,
            status_text: 'Not Found',
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

      beforeEach(() => {
        useHistoryStore.setState({ entries: mockEntries });
      });

      it('should return all entries when no filters applied', () => {
        const { result } = renderHook(() => useHistoryStore());
        const filtered = result.current.filteredEntries();
        expect(filtered).toHaveLength(3);
      });

      it('should filter by search term', () => {
        const { result } = renderHook(() => useHistoryStore());

        act(() => {
          result.current.setFilter('search', 'users');
        });

        const filtered = result.current.filteredEntries();
        expect(filtered).toHaveLength(1);
        expect(filtered[0]?.id).toBe('hist_1');
      });

      it('should filter by method', () => {
        const { result } = renderHook(() => useHistoryStore());

        act(() => {
          result.current.setFilter('method', 'POST');
        });

        const filtered = result.current.filteredEntries();
        expect(filtered).toHaveLength(1);
        expect(filtered[0]?.id).toBe('hist_2');
      });

      it('should filter by status range', () => {
        const { result } = renderHook(() => useHistoryStore());

        act(() => {
          result.current.setFilter('status', '4xx');
        });

        const filtered = result.current.filteredEntries();
        expect(filtered).toHaveLength(1);
        expect(filtered[0]?.id).toBe('hist_3');
      });

      it('should combine multiple filters', () => {
        const { result } = renderHook(() => useHistoryStore());

        act(() => {
          result.current.setFilter('search', 'api.example.com');
          result.current.setFilter('method', 'GET');
        });

        const filtered = result.current.filteredEntries();
        expect(filtered).toHaveLength(1);
        expect(filtered[0]?.id).toBe('hist_1');
      });

      it('should return empty array when no entries match', () => {
        const { result } = renderHook(() => useHistoryStore());

        act(() => {
          result.current.setFilter('search', 'nonexistent');
        });

        const filtered = result.current.filteredEntries();
        expect(filtered).toHaveLength(0);
      });
    });
  });
});
