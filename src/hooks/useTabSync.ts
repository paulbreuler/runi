/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useRef } from 'react';
import { useRequestStoreRaw } from '@/stores/useRequestStore';
import { useTabStore } from '@/stores/useTabStore';
import { deriveTabLabel, type TabSource } from '@/types/tab';
import { globalEventBus, type CollectionRequestSelectedPayload } from '@/events/bus';
import type { HistoryEntry } from '@/types/generated/HistoryEntry';

/**
 * Bidirectional sync between `useTabStore` (multi-tab) and `useRequestStoreRaw` (keyed store).
 *
 * This hook:
 * 1. Initializes a default tab on mount if none exist
 * 2. Loads tab state into the keyed request store when tabs are created/switched
 * 3. Syncs request store edits back to the tab store
 *
 * Call this once in HomePage or App root.
 */
export function useTabSync(): void {
  const { activeTabId, openTab } = useTabStore();

  // Guard against sync loops
  const isSyncingFromTab = useRef(false);

  // --- 1. Initialize default tab on mount ---
  useEffect((): void => {
    const state = useTabStore.getState();
    if (state.tabOrder.length === 0) {
      openTab();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 2. On active tab change: ensure keyed store is initialized ---
  useEffect((): void => {
    if (activeTabId !== null) {
      const storeRaw = useRequestStoreRaw.getState();
      const existingRequestState = storeRaw.contexts[activeTabId];

      if (existingRequestState === undefined) {
        const tab = useTabStore.getState().tabs[activeTabId];
        if (tab !== undefined) {
          isSyncingFromTab.current = true;
          storeRaw.initContext(activeTabId, {
            method: tab.method,
            url: tab.url,
            headers: tab.headers,
            body: tab.body,
            response: tab.response,
          });
          isSyncingFromTab.current = false;
        }
      }
    }
  }, [activeTabId]);

  // --- 3. Sync request store edits back to tabs ---
  useEffect((): (() => void) => {
    // Subscribe to ALL request store changes
    const unsubscribe = useRequestStoreRaw.subscribe((state, prevState): void => {
      // Check every context that might have changed
      Object.keys(state.contexts).forEach((tabId) => {
        const activeState = state.contexts[tabId];
        const prevActiveState = prevState.contexts[tabId];

        if (activeState === undefined || activeState === prevActiveState) {
          return;
        }

        if (isSyncingFromTab.current) {
          return;
        }

        // Check if any request fields changed
        const changed =
          prevActiveState !== undefined &&
          (activeState.method !== prevActiveState.method ||
            activeState.url !== prevActiveState.url ||
            activeState.headers !== prevActiveState.headers ||
            activeState.body !== prevActiveState.body ||
            activeState.response !== prevActiveState.response);

        if (changed) {
          const tab = useTabStore.getState().tabs[tabId];
          if (tab !== undefined) {
            useTabStore.getState().updateTab(tabId, {
              method: activeState.method,
              url: activeState.url,
              headers: activeState.headers,
              body: activeState.body,
              response: activeState.response,
              // Only update the label when the URL actually changes
              ...(activeState.url !== prevActiveState.url
                ? { label: deriveTabLabel(activeState.url) }
                : {}),
              // Mark tab as dirty if it has a source
              ...(tab.source !== undefined ? { isDirty: true } : {}),
            });
          }
        }
      });
    });

    return unsubscribe;
  }, []);

  // --- 4. Tab-aware event handlers ---
  useEffect((): (() => void) => {
    const unsubscribeHistory = globalEventBus.on<HistoryEntry>(
      'history.entry-selected',
      (event): void => {
        const entry = event.payload;
        const source: TabSource = { type: 'history', historyEntryId: entry.id };
        const store = useTabStore.getState();
        const existingTabId = store.findTabBySource(source);

        if (existingTabId !== null) {
          store.setActiveTab(existingTabId);
        } else {
          store.openTab({
            method: entry.request.method,
            url: entry.request.url,
            headers: entry.request.headers,
            body: entry.request.body ?? '',
            label: deriveTabLabel(entry.request.url),
            source,
          });
        }
      }
    );

    const unsubscribeCollection = globalEventBus.on<CollectionRequestSelectedPayload>(
      'collection.request-selected',
      (event): void => {
        const { collectionId, request } = event.payload;
        const source: TabSource = {
          type: 'collection',
          collectionId,
          requestId: request.id,
        };
        const store = useTabStore.getState();
        const existingTabId = store.findTabBySource(source);

        if (existingTabId !== null) {
          store.setActiveTab(existingTabId);
        } else {
          store.openTab({
            method: request.method,
            url: request.url,
            headers: request.headers,
            body: request.body?.content ?? '',
            label: deriveTabLabel(request.url, request.name),
            source,
          });
        }
      }
    );

    return (): void => {
      unsubscribeHistory();
      unsubscribeCollection();
    };
  }, []);
}
