// Copyright (c) 2025 runi contributors
// SPDX-License-Identifier: MIT

import { create } from 'zustand';

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
  },

  ignoreChange: (collectionId: string, method: string, path: string): void => {
    const key = makeKey(collectionId, method, path);
    set((state) => ({
      reviewState: {
        ...state.reviewState,
        [key]: { status: 'ignored' },
      },
    }));
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
