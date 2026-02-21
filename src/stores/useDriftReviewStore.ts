// Copyright (c) 2025 runi contributors
// SPDX-License-Identifier: MIT

import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { EventEnvelope } from '@/hooks/useCollectionEvents';

export interface DriftChangeReviewState {
  status: 'pending' | 'accepted' | 'ignored';
}

/** Key: `${collectionId}:${method}:${path}` */
export type ReviewStateMap = Record<string, DriftChangeReviewState>;

interface DriftReviewUIState {
  // Drawer
  isOpen: boolean;
  collectionId: string | null;
  /** When set, drawer scrolls to this operation on open */
  focusOperationKey: string | null;

  /** Per-change review state (session-scoped, not persisted) */
  reviewState: ReviewStateMap;

  /** Banner dismissed keys (session-scoped) */
  dismissedBannerKeys: Set<string>;

  // Actions
  openDrawer: (collectionId: string, focusKey?: string) => void;
  closeDrawer: () => void;
  acceptChange: (collectionId: string, method: string, path: string) => void;
  ignoreChange: (collectionId: string, method: string, path: string) => void;
  acceptAll: (keys: string[]) => void;
  dismissAll: (keys: string[]) => void;
  dismissBanner: (collectionId: string, method: string, path: string) => void;
  getChangeStatus: (
    collectionId: string,
    method: string,
    path: string
  ) => 'pending' | 'accepted' | 'ignored';
}

const makeKey = (collectionId: string, method: string, path: string): string =>
  `${collectionId}:${method}:${path}`;

export const useDriftReviewStore = create<DriftReviewUIState>((set, get) => ({
  isOpen: false,
  collectionId: null,
  focusOperationKey: null,
  reviewState: {},
  dismissedBannerKeys: new Set(),

  openDrawer: (collectionId: string, focusKey?: string): void => {
    set({
      isOpen: true,
      collectionId,
      focusOperationKey: focusKey ?? null,
    });
  },

  closeDrawer: (): void => {
    set({
      isOpen: false,
      collectionId: null,
      focusOperationKey: null,
    });
  },

  acceptChange: (collectionId: string, method: string, path: string): void => {
    const key = makeKey(collectionId, method, path);
    set((state) => ({
      reviewState: {
        ...state.reviewState,
        [key]: { status: 'accepted' },
      },
    }));
    // Fire-and-forget: sync decision to Rust store so MCP tools reflect UI state.
    // No await — UI is already updated optimistically above.
    // The Rust command does NOT emit events to prevent infinite loop with initDriftReviewStore.
    invoke<undefined>('cmd_set_drift_review_decision', {
      collectionId,
      method,
      path,
      status: 'accepted',
    }).catch((err: unknown) => {
      console.error('[DriftReview] Failed to sync accept decision to Rust store:', err);
    });
  },

  ignoreChange: (collectionId: string, method: string, path: string): void => {
    const key = makeKey(collectionId, method, path);
    set((state) => ({
      reviewState: {
        ...state.reviewState,
        [key]: { status: 'ignored' },
      },
    }));
    // Fire-and-forget: sync decision to Rust store so MCP tools reflect UI state.
    invoke<undefined>('cmd_set_drift_review_decision', {
      collectionId,
      method,
      path,
      status: 'ignored',
    }).catch((err: unknown) => {
      console.error('[DriftReview] Failed to sync ignore decision to Rust store:', err);
    });
  },

  acceptAll: (keys: string[]): void => {
    set((state) => {
      const updates: ReviewStateMap = {};
      for (const key of keys) {
        updates[key] = { status: 'accepted' };
      }
      return { reviewState: { ...state.reviewState, ...updates } };
    });
  },

  dismissAll: (keys: string[]): void => {
    set((state) => {
      const updates: ReviewStateMap = {};
      for (const key of keys) {
        updates[key] = { status: 'ignored' };
      }
      return { reviewState: { ...state.reviewState, ...updates } };
    });
  },

  dismissBanner: (collectionId: string, method: string, path: string): void => {
    const key = makeKey(collectionId, method, path);
    set((state) => {
      const next = new Set(state.dismissedBannerKeys);
      next.add(key);
      return { dismissedBannerKeys: next };
    });
  },

  getChangeStatus: (
    collectionId: string,
    method: string,
    path: string
  ): 'pending' | 'accepted' | 'ignored' => {
    const key = makeKey(collectionId, method, path);
    return get().reviewState[key]?.status ?? 'pending';
  },
}));

/** Shape of the drift change event payload from Rust. */
interface DriftChangeEventPayload {
  collection_id: string;
  method: string;
  path: string;
  status: 'accepted' | 'ignored';
}

/** Unlisten handles for cleanup. */
let acceptedUnlisten: UnlistenFn | null = null;
let dismissedUnlisten: UnlistenFn | null = null;
/** Guard against concurrent calls (TOCTOU protection). */
let initInProgress = false;

/**
 * Initialize the drift review store.
 *
 * Subscribes to `drift:change-accepted` and `drift:change-dismissed` Tauri
 * events emitted by the MCP tools so that AI-driven review actions are
 * reflected in the UI's session-scoped Zustand state.
 *
 * Guards against concurrent re-entrant calls. Call once at app startup.
 * Returns a cleanup function.
 */
export async function initDriftReviewStore(): Promise<() => void> {
  // TOCTOU guard: prevent concurrent initialization
  if (initInProgress) {
    return (): void => {
      /* no-op: initialization already in progress */
    };
  }
  initInProgress = true;

  // Clean up any previous listeners to prevent leaks on re-init
  if (acceptedUnlisten !== null) {
    acceptedUnlisten();
    acceptedUnlisten = null;
  }
  if (dismissedUnlisten !== null) {
    dismissedUnlisten();
    dismissedUnlisten = null;
  }

  try {
    acceptedUnlisten = await listen<EventEnvelope<DriftChangeEventPayload>>(
      'drift:change-accepted',
      (event) => {
        const { collection_id, method, path } = event.payload.payload;
        useDriftReviewStore.getState().acceptChange(collection_id, method, path);
      }
    );

    dismissedUnlisten = await listen<EventEnvelope<DriftChangeEventPayload>>(
      'drift:change-dismissed',
      (event) => {
        const { collection_id, method, path } = event.payload.payload;
        useDriftReviewStore.getState().ignoreChange(collection_id, method, path);
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[DriftReview] Failed to initialize event listeners:', message);
  } finally {
    initInProgress = false;
  }

  return (): void => {
    if (acceptedUnlisten !== null) {
      acceptedUnlisten();
      acceptedUnlisten = null;
    }
    if (dismissedUnlisten !== null) {
      dismissedUnlisten();
      dismissedUnlisten = null;
    }
  };
}
