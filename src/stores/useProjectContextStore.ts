/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Project context Zustand store.
 *
 * Manages the persistent project context (active collection, focused request,
 * investigation notes, recent activity, tags). Syncs with the Rust backend
 * via Tauri commands and listens for `context:updated` events emitted by
 * MCP tools or other backend mutations.
 */

import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { ProjectContext } from '@/types/generated/ProjectContext';
import type { ProjectContextUpdate } from '@/types/generated/ProjectContextUpdate';

interface ProjectContextState {
  /** The current project context from the backend. */
  context: ProjectContext;
  /** Whether the initial load has completed. */
  loaded: boolean;
  /** Whether a load or update is in progress. */
  loading: boolean;
  /** Last error from a backend operation. */
  error: string | null;

  /** Fetch the current context from the backend. */
  fetchContext: () => Promise<void>;
  /** Apply a partial update to the context. */
  updateContext: (update: ProjectContextUpdate) => Promise<void>;
  /** Set the context directly (used by event listeners). */
  setContext: (context: ProjectContext) => void;
}

/** Default empty context matching `ProjectContext::new()` in Rust. */
const DEFAULT_CONTEXT: ProjectContext = {
  activeCollectionId: null,
  activeRequestId: null,
  investigationNotes: null,
  recentRequestIds: [],
  tags: [],
};

export const useProjectContextStore = create<ProjectContextState>((set) => ({
  context: DEFAULT_CONTEXT,
  loaded: false,
  loading: false,
  error: null,

  fetchContext: async (): Promise<void> => {
    set({ loading: true, error: null });
    try {
      const context = await invoke<ProjectContext>('cmd_get_project_context');
      set({ context, loaded: true, loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[ProjectContext] Failed to fetch:', message);
      set({ error: message, loading: false });
    }
  },

  updateContext: async (update: ProjectContextUpdate): Promise<void> => {
    set({ loading: true, error: null });
    try {
      const context = await invoke<ProjectContext>('cmd_update_project_context', {
        update,
      });
      set({ context, loaded: true, loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[ProjectContext] Failed to update:', message);
      set({ error: message, loading: false });
    }
  },

  setContext: (context: ProjectContext): void => {
    set({ context, loaded: true });
  },
}));

/** Unlisten handle for cleanup. */
let contextEventUnlisten: UnlistenFn | null = null;

/**
 * Initialize the project context store.
 *
 * Fetches the initial context from the backend and subscribes to
 * `context:updated` Tauri events for live sync from MCP tools.
 *
 * Call once at app startup (e.g., in a root provider or layout effect).
 * Returns a cleanup function that removes the event listener.
 */
export async function initProjectContext(): Promise<() => void> {
  // Clean up any previous listener to prevent leaks on re-init
  if (contextEventUnlisten !== null) {
    contextEventUnlisten();
    contextEventUnlisten = null;
  }

  // Fetch initial state
  await useProjectContextStore.getState().fetchContext();

  // Listen for backend-driven updates (MCP tools, other commands)
  contextEventUnlisten = await listen<ProjectContext>('context:updated', (event) => {
    useProjectContextStore.getState().setContext(event.payload);
  });

  return (): void => {
    if (contextEventUnlisten !== null) {
      contextEventUnlisten();
      contextEventUnlisten = null;
    }
  };
}
