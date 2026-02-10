/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { globalEventBus, type ToastEventPayload } from '@/events/bus';
import { deriveTabLabel, type TabSource, type TabState } from '@/types/tab';

/** Maximum number of open tabs. */
const MAX_TABS = 20;

interface TabStoreState {
  /** All open tabs keyed by ID. */
  tabs: Record<string, TabState>;
  /** Tab display order (array of tab IDs). */
  tabOrder: string[];
  /** Currently active tab ID, or null if none. */
  activeTabId: string | null;
}

interface TabStoreActions {
  /**
   * Open a new tab with optional initial state.
   * Returns the new tab's ID, or the current active tab ID if at limit.
   */
  openTab: (tab?: Partial<TabState>) => string;
  /** Close a tab by ID. Activates adjacent tab or creates empty tab if last. */
  closeTab: (id: string) => void;
  /** Set the active tab by ID. */
  setActiveTab: (id: string) => void;
  /** Merge a partial update into an existing tab. */
  updateTab: (id: string, patch: Partial<TabState>) => void;
  /** Move a tab to a new index in the tab order. */
  reorderTab: (id: string, newIndex: number) => void;
  /** Close all tabs except the specified one. */
  closeOtherTabs: (keepId: string) => void;
  /** Close all tabs and auto-open a new empty tab. */
  closeAllTabs: () => void;
  /** Find a tab matching the given source. Returns tab ID or null. */
  findTabBySource: (source: TabSource) => string | null;
  /** Get the currently active tab's state, or null. */
  getActiveTab: () => TabState | null;
}

type TabStore = TabStoreState & TabStoreActions;

/**
 * Create a new empty tab state with defaults.
 */
function createDefaultTab(overrides?: Partial<TabState>): TabState {
  const id = crypto.randomUUID();
  const url = overrides?.url ?? '';
  const label = overrides?.label ?? deriveTabLabel(url, undefined);

  return {
    label,
    method: 'GET',
    url,
    headers: {},
    body: '',
    response: null,
    isDirty: false,
    createdAt: Date.now(),
    ...overrides,
    // Ensure id is always the generated one (can't be overridden)
    id,
  };
}

/**
 * Check if two TabSource objects refer to the same resource.
 */
function sourcesMatch(a: TabSource, b: TabSource): boolean {
  if (a.type !== b.type) {
    return false;
  }
  if (a.type === 'collection') {
    return a.collectionId === b.collectionId && a.requestId === b.requestId;
  }
  // history
  return a.historyEntryId === b.historyEntryId;
}

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      tabs: {},
      tabOrder: [],
      activeTabId: null,

      openTab: (partial): string => {
        const state = get();
        const tabCount = Object.keys(state.tabs).length;

        if (tabCount >= MAX_TABS) {
          globalEventBus.emit<ToastEventPayload>('toast.show', {
            type: 'warning',
            message: `Tab limit reached (${String(MAX_TABS)} max). Close a tab to open a new one.`,
          });
          return state.activeTabId ?? '';
        }

        const newTab = createDefaultTab(partial);
        set({
          tabs: { ...state.tabs, [newTab.id]: newTab },
          tabOrder: [...state.tabOrder, newTab.id],
          activeTabId: newTab.id,
        });

        return newTab.id;
      },

      closeTab: (id): void => {
        const state = get();
        const { [id]: removed, ...remainingTabs } = state.tabs;
        if (removed === undefined) {
          return;
        }

        const remainingOrder = state.tabOrder.filter((tabId) => tabId !== id);

        // If closing the last tab, auto-open a new empty one
        if (remainingOrder.length === 0) {
          const newTab = createDefaultTab();
          set({
            tabs: { [newTab.id]: newTab },
            tabOrder: [newTab.id],
            activeTabId: newTab.id,
          });
          return;
        }

        // If closing the active tab, activate an adjacent one
        let newActiveId = state.activeTabId;
        if (state.activeTabId === id) {
          const closedIndex = state.tabOrder.indexOf(id);
          // Prefer the next tab; fall back to previous
          const newIndex = closedIndex < remainingOrder.length ? closedIndex : closedIndex - 1;
          newActiveId = remainingOrder[Math.max(0, newIndex)] ?? null;
        }

        set({
          tabs: remainingTabs,
          tabOrder: remainingOrder,
          activeTabId: newActiveId,
        });
      },

      setActiveTab: (id): void => {
        const state = get();
        if (state.tabs[id] !== undefined) {
          set({ activeTabId: id });
        }
      },

      updateTab: (id, patch): void => {
        const state = get();
        const tab = state.tabs[id];
        if (tab === undefined) {
          return;
        }

        set({
          tabs: {
            ...state.tabs,
            [id]: { ...tab, ...patch, id }, // Prevent id from being overwritten
          },
        });
      },

      reorderTab: (id, newIndex): void => {
        const state = get();
        const currentIndex = state.tabOrder.indexOf(id);
        if (currentIndex === -1) {
          return;
        }

        const newOrder = [...state.tabOrder];
        newOrder.splice(currentIndex, 1);
        const clampedIndex = Math.max(0, Math.min(newOrder.length, newIndex));
        newOrder.splice(clampedIndex, 0, id);

        set({ tabOrder: newOrder });
      },

      closeOtherTabs: (keepId): void => {
        const state = get();
        const tabToKeep = state.tabs[keepId];
        if (tabToKeep === undefined) {
          return;
        }

        set({
          tabs: { [keepId]: tabToKeep },
          tabOrder: [keepId],
          activeTabId: keepId,
        });
      },

      closeAllTabs: (): void => {
        const newTab = createDefaultTab();
        set({
          tabs: { [newTab.id]: newTab },
          tabOrder: [newTab.id],
          activeTabId: newTab.id,
        });
      },

      findTabBySource: (source): string | null => {
        const state = get();
        for (const tab of Object.values(state.tabs)) {
          if (tab.source !== undefined && sourcesMatch(tab.source, source)) {
            return tab.id;
          }
        }
        return null;
      },

      getActiveTab: (): TabState | null => {
        const state = get();
        if (state.activeTabId === null) {
          return null;
        }
        return state.tabs[state.activeTabId] ?? null;
      },
    }),
    {
      name: 'runi-tabs',
      partialize: (state) => ({
        tabs: Object.fromEntries(
          Object.entries(state.tabs).map(([id, tab]) => [id, { ...tab, response: null }])
        ),
        tabOrder: state.tabOrder,
        activeTabId: state.activeTabId,
      }),
    }
  )
);
