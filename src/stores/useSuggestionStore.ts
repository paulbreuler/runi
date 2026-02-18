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
import type { EventEnvelope } from '@/hooks/useCollectionEvents';

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
      console.warn('[Suggestions] Fetching suggestions…', { status: status ?? null });
      const suggestions = await invoke<Suggestion[]>('cmd_list_suggestions', {
        status: status ?? null,
      });
      console.warn('[Suggestions] Loaded', suggestions.length, 'suggestions');
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
/** Guard against concurrent calls (TOCTOU protection). */
let initInProgress = false;

/**
 * Initialize the suggestion store.
 *
 * Subscribes to Tauri events BEFORE fetching initial state to ensure
 * no events are missed in the window between fetch and subscription.
 * Guards against concurrent re-entrant calls.
 *
 * Call once at app startup. Returns a cleanup function.
 */
export async function initSuggestionStore(): Promise<() => void> {
  // TOCTOU guard: prevent concurrent initialization
  if (initInProgress) {
    return (): void => {
      /* no-op: initialization already in progress */
    };
  }
  initInProgress = true;

  // Clean up any previous listeners to prevent leaks on re-init
  if (createdUnlisten !== null) {
    createdUnlisten();
    createdUnlisten = null;
  }
  if (resolvedUnlisten !== null) {
    resolvedUnlisten();
    resolvedUnlisten = null;
  }

  try {
    // Listen BEFORE fetch so no events are missed between fetch completion
    // and subscription registration (matches useProjectContextStore pattern)
    createdUnlisten = await listen<EventEnvelope<Suggestion>>('suggestion:created', (event) => {
      console.warn('[Suggestions] Event suggestion:created', event.payload);
      useSuggestionStore.getState().addSuggestion(event.payload.payload);
    });

    resolvedUnlisten = await listen<EventEnvelope<Suggestion>>('suggestion:resolved', (event) => {
      console.warn('[Suggestions] Event suggestion:resolved', event.payload);
      useSuggestionStore.getState().updateSuggestion(event.payload.payload);
    });

    // Fetch initial state after listeners are registered
    await useSuggestionStore.getState().fetchSuggestions();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    useSuggestionStore.setState({ error: message });
  } finally {
    initInProgress = false;
  }

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
