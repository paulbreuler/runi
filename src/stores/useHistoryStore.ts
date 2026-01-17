import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { HistoryEntry } from '@/types/generated/HistoryEntry';
import type { RequestParams, HttpResponse } from '@/types/http';
import type { HistoryFilters, NetworkHistoryEntry } from '@/types/history';
import { DEFAULT_HISTORY_FILTERS } from '@/types/history';

interface HistoryState {
  // Data State
  entries: HistoryEntry[];
  isLoading: boolean;
  error: string | null;

  // UI State
  filters: HistoryFilters;
  selectedId: string | null;
  expandedId: string | null;
  compareMode: boolean;
  compareSelection: string[];

  // Data Actions
  loadHistory: (limit?: number) => Promise<void>;
  addEntry: (request: RequestParams, response: HttpResponse) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;

  // UI Actions
  setFilter: (key: keyof HistoryFilters, value: string) => void;
  resetFilters: () => void;
  setSelectedId: (id: string | null) => void;
  setExpandedId: (id: string | null) => void;
  setCompareMode: (enabled: boolean) => void;
  toggleCompareSelection: (id: string) => void;

  // Computed
  filteredEntries: () => NetworkHistoryEntry[];
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  // Data State
  entries: [],
  isLoading: false,
  error: null,

  // UI State
  filters: { ...DEFAULT_HISTORY_FILTERS },
  selectedId: null,
  expandedId: null,
  compareMode: false,
  compareSelection: [],

  // Data Actions
  loadHistory: async (limit?: number): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const entries = await invoke<HistoryEntry[]>('load_request_history', {
        limit: limit ?? undefined,
      });
      set({ entries, isLoading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage, isLoading: false });
    }
  },

  addEntry: async (request: RequestParams, response: HttpResponse): Promise<void> => {
    try {
      await invoke<string>('save_request_history', {
        request,
        response,
      });

      // Reload history from backend to ensure we use the canonical entry
      // This ensures we have the exact timestamp and entry that was saved
      const entries = await invoke<HistoryEntry[]>('load_request_history', {
        limit: undefined,
      });

      // #region agent log
      if (entries.length > 0 && entries[0] !== undefined) {
        fetch('http://127.0.0.1:7243/ingest/03cf5ddc-da7a-4a6c-9ad4-5db59fd986a0', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'useHistoryStore.ts:75',
            message: 'History entry loaded after save',
            data: {
              entryId: entries[0].id,
              timing: entries[0].response.timing,
              first_byte_ms: entries[0].response.timing.first_byte_ms,
              total_ms: entries[0].response.timing.total_ms,
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'initial',
            hypothesisId: 'B',
          }),
        }).catch(() => {
          // Ignore debug log failures
        });
      }
      // #endregion

      set({
        entries,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage });
    }
  },

  deleteEntry: async (id: string): Promise<void> => {
    try {
      await invoke('delete_history_entry', { id });

      // Remove from entries
      set((state) => ({
        entries: state.entries.filter((entry) => entry.id !== id),
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage });
    }
  },

  clearHistory: async (): Promise<void> => {
    try {
      await invoke('clear_request_history');
      set({ entries: [], error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage });
    }
  },

  // UI Actions
  setFilter: (key: keyof HistoryFilters, value: string): void => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }));
  },

  resetFilters: (): void => {
    set({ filters: { ...DEFAULT_HISTORY_FILTERS } });
  },

  setSelectedId: (id: string | null): void => {
    set({ selectedId: id });
  },

  setExpandedId: (id: string | null): void => {
    set({ expandedId: id });
  },

  setCompareMode: (enabled: boolean): void => {
    set({
      compareMode: enabled,
      // Clear selection when disabling compare mode
      compareSelection: enabled ? get().compareSelection : [],
    });
  },

  toggleCompareSelection: (id: string): void => {
    set((state) => {
      const { compareSelection } = state;

      // If already selected, remove it
      if (compareSelection.includes(id)) {
        return { compareSelection: compareSelection.filter((i) => i !== id) };
      }

      // If we already have 2 selected, don't add more
      if (compareSelection.length >= 2) {
        return state;
      }

      // Add to selection
      return { compareSelection: [...compareSelection, id] };
    });
  },

  // Computed
  filteredEntries: (): NetworkHistoryEntry[] => {
    const { entries, filters } = get();

    return entries.filter((entry) => {
      // Search filter
      if (
        filters.search !== '' &&
        !entry.request.url.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      // Method filter
      if (filters.method !== 'ALL' && entry.request.method.toUpperCase() !== filters.method) {
        return false;
      }

      // Status filter
      if (filters.status !== 'All') {
        const status = entry.response.status;
        const range = filters.status;
        if (range === '2xx' && (status < 200 || status >= 300)) {
          return false;
        }
        if (range === '3xx' && (status < 300 || status >= 400)) {
          return false;
        }
        if (range === '4xx' && (status < 400 || status >= 500)) {
          return false;
        }
        if (range === '5xx' && status < 500) {
          return false;
        }
      }

      // Intelligence filter - check for NetworkHistoryEntry with intelligence
      const networkEntry = entry as NetworkHistoryEntry;
      if (filters.intelligence !== 'All') {
        const intel = networkEntry.intelligence;
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain -- explicit null check needed for drift type
        if (filters.intelligence === 'Has Drift' && (intel === undefined || intel.drift === null)) {
          return false;
        }
        if (filters.intelligence === 'AI Generated' && intel?.aiGenerated !== true) {
          return false;
        }
        if (filters.intelligence === 'Bound to Spec' && intel?.boundToSpec !== true) {
          return false;
        }
        if (filters.intelligence === 'Verified' && intel?.verified !== true) {
          return false;
        }
      }

      return true;
    }) as NetworkHistoryEntry[];
  },
}));
