import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { HistoryEntry } from '@/types/generated/HistoryEntry';
import type { RequestParams, HttpResponse } from '@/types/http';
import type { HistoryFilters, NetworkHistoryEntry } from '@/types/history';
import { DEFAULT_HISTORY_FILTERS } from '@/types/history';
import { globalEventBus, type ToastEventPayload } from '@/events/bus';

interface HistoryState {
  // Data State
  entries: HistoryEntry[];
  isLoading: boolean;
  error: string | null;

  // UI State
  filters: HistoryFilters;
  selectedId: string | null;
  selectedIds: Set<string>; // Multi-select support
  lastSelectedIndex: number | null; // For range selection
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
  toggleSelection: (id: string) => void;
  selectRange: (fromIndex: number, toIndex: number) => void;
  selectAll: (ids: string[]) => void;
  deselectAll: () => void;
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
  selectedIds: new Set<string>(),
  lastSelectedIndex: null,
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
    if (id === null) {
      set({ selectedId: null, selectedIds: new Set<string>() });
    } else {
      set({ selectedId: id, selectedIds: new Set([id]) });
    }
  },

  toggleSelection: (id: string): void => {
    set((state) => {
      const newSelectedIds = new Set(state.selectedIds);
      if (newSelectedIds.has(id)) {
        // Removing from selection - always allowed
        newSelectedIds.delete(id);
      } else {
        // Adding to selection - check limit
        if (newSelectedIds.size >= 2) {
          // Already at max, show warning toast
          globalEventBus.emit<ToastEventPayload>('toast.show', {
            type: 'warning',
            message: 'You can select a maximum of 2 items for comparison.',
            duration: 3000,
          });
          // Don't add the item
          return state;
        }
        newSelectedIds.add(id);
      }

      // Update selectedId for backward compatibility (first item in Set, sorted for determinism)
      const selectedId =
        newSelectedIds.size > 0 ? (Array.from(newSelectedIds).sort()[0] ?? null) : null;

      // Update lastSelectedIndex to current entry index
      const currentIndex = state.entries.findIndex((entry) => entry.id === id);
      const lastSelectedIndex = currentIndex >= 0 ? currentIndex : state.lastSelectedIndex;

      return {
        selectedIds: newSelectedIds,
        selectedId,
        lastSelectedIndex,
      };
    });
  },

  selectRange: (fromIndex: number, toIndex: number): void => {
    set((state) => {
      const { entries, selectedIds } = state;
      const newSelectedIds = new Set(selectedIds);

      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);

      // Add all entries in range (only if they exist), but limit to 2 items total
      for (let i = start; i <= end && i < entries.length && newSelectedIds.size < 2; i++) {
        const entry = entries[i];
        if (entry !== undefined) {
          newSelectedIds.add(entry.id);
        }
      }

      // Show warning if range would exceed limit
      const rangeSize = end - start + 1;
      if (rangeSize > 2 || (selectedIds.size > 0 && rangeSize + selectedIds.size > 2)) {
        globalEventBus.emit<ToastEventPayload>('toast.show', {
          type: 'warning',
          message: 'You can select a maximum of 2 items for comparison.',
          duration: 3000,
        });
      }

      // Update selectedId for backward compatibility (first item, sorted for determinism)
      const selectedId =
        newSelectedIds.size > 0 ? (Array.from(newSelectedIds).sort()[0] ?? null) : null;

      return {
        selectedIds: newSelectedIds,
        selectedId,
        lastSelectedIndex: toIndex,
      };
    });
  },

  selectAll: (ids: string[]): void => {
    set((state) => {
      // Limit to first 2 items
      const limitedIds = ids.slice(0, 2);
      const newSelectedIds = new Set(limitedIds);

      // Show warning if more than 2 items were provided
      if (ids.length > 2) {
        globalEventBus.emit<ToastEventPayload>('toast.show', {
          type: 'warning',
          message: 'You can select a maximum of 2 items for comparison.',
          duration: 3000,
        });
      }

      // Update selectedId for backward compatibility
      const selectedId =
        newSelectedIds.size > 0 ? (Array.from(newSelectedIds).sort()[0] ?? null) : null;
      const lastSelectedIndex =
        limitedIds.length > 0
          ? state.entries.findIndex((e) => e.id === limitedIds[limitedIds.length - 1])
          : null;
      return {
        selectedIds: newSelectedIds,
        selectedId,
        lastSelectedIndex,
      };
    });
  },

  deselectAll: (): void => {
    set({
      selectedIds: new Set<string>(),
      selectedId: null,
      lastSelectedIndex: null,
    });
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
