/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Suggestion Zustand store for the Vigilance Monitor.
 *
 * Manages AI-generated suggestions (drift fixes, schema updates, test gaps,
 * optimizations). Syncs with the Rust backend via Tauri commands and listens
 * for `suggestion:created` and `suggestion:resolved` events.
 */

import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { Suggestion } from '@/types/generated/Suggestion';
import type { SuggestionStatus } from '@/types/generated/SuggestionStatus';
import type { CreateSuggestionRequest } from '@/types/generated/CreateSuggestionRequest';

interface SuggestionState {
  /** All loaded suggestions. */
  suggestions: Suggestion[];
  /** Whether the initial load has completed. */
  loaded: boolean;
  /** Whether a load or mutation is in progress. */
  loading: boolean;
  /** Last error from a backend operation. */
  error: string | null;

  /** Fetch suggestions from the backend, optionally filtered by status. */
  fetchSuggestions: (status?: SuggestionStatus) => Promise<void>;
  /** Create a new suggestion via Tauri command. */
  createSuggestion: (request: CreateSuggestionRequest) => Promise<void>;
  /** Resolve (accept or dismiss) a suggestion. */
  resolveSuggestion: (id: string, status: SuggestionStatus) => Promise<void>;
  /** Add a suggestion from an event (no backend call). */
  addSuggestion: (suggestion: Suggestion) => void;
  /** Update an existing suggestion from an event (no backend call). */
  updateSuggestion: (suggestion: Suggestion) => void;
  /** Count of pending suggestions. */
  pendingCount: () => number;
}

export const useSuggestionStore = create<SuggestionState>((set, get) => ({
  suggestions: [],
  loaded: false,
  loading: false,
  error: null,

  fetchSuggestions: async (status?: SuggestionStatus): Promise<void> => {
    set({ loading: true, error: null });
    try {
      const suggestions = await invoke<Suggestion[]>('cmd_list_suggestions', {
        status: status ?? null,
      });
      set({ suggestions, loaded: true, loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Suggestions] Failed to fetch:', message);
      set({ error: message, loading: false });
    }
  },

  createSuggestion: async (request: CreateSuggestionRequest): Promise<void> => {
    set({ loading: true, error: null });
    try {
      const suggestion = await invoke<Suggestion>('cmd_create_suggestion', { request });
      set((state) => ({
        suggestions: [suggestion, ...state.suggestions],
        loading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Suggestions] Failed to create:', message);
      set({ error: message, loading: false });
    }
  },

  resolveSuggestion: async (id: string, status: SuggestionStatus): Promise<void> => {
    set({ loading: true, error: null });
    try {
      const updated = await invoke<Suggestion>('cmd_resolve_suggestion', { id, status });
      set((state) => ({
        suggestions: state.suggestions.map((s) => (s.id === id ? updated : s)),
        loading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Suggestions] Failed to resolve:', message);
      set({ error: message, loading: false });
    }
  },

  addSuggestion: (suggestion: Suggestion): void => {
    set((state) => {
      // Don't duplicate
      if (state.suggestions.some((s) => s.id === suggestion.id)) {
        return state;
      }
      return { suggestions: [suggestion, ...state.suggestions] };
    });
  },

  updateSuggestion: (suggestion: Suggestion): void => {
    set((state) => ({
      suggestions: state.suggestions.map((s) => (s.id === suggestion.id ? suggestion : s)),
    }));
  },

  pendingCount: (): number => {
    return get().suggestions.filter((s) => s.status === 'pending').length;
  },
}));

/** Unlisten handles for cleanup. */
let createdUnlisten: UnlistenFn | null = null;
let resolvedUnlisten: UnlistenFn | null = null;

/**
 * Initialize the suggestion store.
 *
 * Fetches initial suggestions from the backend and subscribes to
 * Tauri events for live sync from MCP tools.
 *
 * Call once at app startup. Returns a cleanup function.
 */
export async function initSuggestionStore(): Promise<() => void> {
  // Clean up any previous listeners to prevent leaks on re-init
  if (createdUnlisten !== null) {
    createdUnlisten();
    createdUnlisten = null;
  }
  if (resolvedUnlisten !== null) {
    resolvedUnlisten();
    resolvedUnlisten = null;
  }

  // Fetch initial state
  await useSuggestionStore.getState().fetchSuggestions();

  // Listen for backend-driven creates (MCP tools, other commands)
  createdUnlisten = await listen<Suggestion>('suggestion:created', (event) => {
    useSuggestionStore.getState().addSuggestion(event.payload);
  });

  // Listen for backend-driven resolves
  resolvedUnlisten = await listen<Suggestion>('suggestion:resolved', (event) => {
    useSuggestionStore.getState().updateSuggestion(event.payload);
  });

  return (): void => {
    if (createdUnlisten !== null) {
      createdUnlisten();
      createdUnlisten = null;
    }
    if (resolvedUnlisten !== null) {
      resolvedUnlisten();
      resolvedUnlisten = null;
    }
  };
}
