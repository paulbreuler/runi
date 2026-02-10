/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Activity feed store for real-time provenance tracking.
 *
 * Stores a rolling log of actions with actor attribution,
 * enabling the "multiplayer" feel where you watch AI work.
 */

import { create } from 'zustand';
import type { Actor } from '@/hooks/useCollectionEvents';

/** A single activity entry in the feed. */
export interface ActivityEntry {
  id: string;
  timestamp: string;
  actor: Actor;
  action: ActivityAction;
  target: string;
  targetId?: string;
  /** Lamport sequence number from the event, if available. */
  seq?: number;
}

/** Supported activity actions. */
export type ActivityAction =
  | 'created_collection'
  | 'deleted_collection'
  | 'added_request'
  | 'updated_request'
  | 'executed_request'
  | 'saved_collection';

/** Maximum entries to keep in memory. */
const MAX_ENTRIES = 100;

/** Maximum age before auto-pruning (1 hour in ms). */
const MAX_AGE_MS = 60 * 60 * 1000;

interface ActivityState {
  entries: ActivityEntry[];
  /** Add a new activity entry. Auto-prunes old entries. */
  addEntry: (entry: Omit<ActivityEntry, 'id'>) => void;
  /** Clear all entries. */
  clear: () => void;
  /** Prune entries older than MAX_AGE_MS. */
  prune: () => void;
}

let nextId = 0;

export const useActivityStore = create<ActivityState>((set) => ({
  entries: [],

  addEntry: (entry): void => {
    nextId += 1;
    const newEntry: ActivityEntry = {
      ...entry,
      id: `activity-${String(nextId)}`,
    };

    set((state) => {
      const now = Date.now();
      const cutoff = now - MAX_AGE_MS;

      // Add new entry, prune old, cap at MAX_ENTRIES
      const updated = [newEntry, ...state.entries]
        .filter((e) => new Date(e.timestamp).getTime() > cutoff)
        .slice(0, MAX_ENTRIES);

      return { entries: updated };
    });
  },

  clear: (): void => {
    set({ entries: [] });
  },

  prune: (): void => {
    set((state) => {
      const cutoff = Date.now() - MAX_AGE_MS;
      return {
        entries: state.entries.filter((e) => new Date(e.timestamp).getTime() > cutoff),
      };
    });
  },
}));

/** Reset the ID counter for testing. */
export function __resetActivityIdCounter(): void {
  nextId = 0;
}
