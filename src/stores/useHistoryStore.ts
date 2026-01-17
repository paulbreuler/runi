import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { HistoryEntry } from '@/types/generated/HistoryEntry';
import type { RequestParams, HttpResponse } from '@/types/http';

interface HistoryState {
  // State
  entries: HistoryEntry[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadHistory: (limit?: number) => Promise<void>;
  addEntry: (request: RequestParams, response: HttpResponse) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  entries: [],
  isLoading: false,
  error: null,

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
}));
