/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useRef } from 'react';
import { useRequestStore } from '@/stores/useRequestStore';
import { useTabStore } from '@/stores/useTabStore';
import { deriveTabLabel, type TabSource } from '@/types/tab';
import { globalEventBus, type CollectionRequestSelectedPayload } from '@/events/bus';
import type { HistoryEntry } from '@/types/generated/HistoryEntry';

/**
 * Bidirectional sync between `useTabStore` (multi-tab) and `useRequestStore` (single active request).
 *
 * This hook:
 * 1. Initializes a default tab on mount if none exist
 * 2. Loads the active tab's state into the request store on tab switch
 * 3. Syncs request store edits back to the active tab
 * 4. Replaces direct event handlers with tab-aware versions
 *
 * Call this once in HomePage.
 */
export function useTabSync(): void {
  const { setMethod, setUrl, setHeaders, setBody, setResponse } = useRequestStore();

  const { activeTabId, openTab, updateTab } = useTabStore();

  // Track previous active tab to save outgoing state on switch
  const prevActiveTabIdRef = useRef<string | null>(null);
  // Guard against sync loops: when we're loading tab → request store, skip syncing back
  const isSyncingFromTab = useRef(false);

  // --- 1. Initialize default tab on mount ---
  useEffect((): void => {
    const state = useTabStore.getState();
    if (state.tabOrder.length === 0) {
      openTab();
    } else if (state.activeTabId !== null) {
      // Load persisted active tab into request store
      const tab = state.tabs[state.activeTabId];
      if (tab !== undefined) {
        isSyncingFromTab.current = true;
        setMethod(tab.method);
        setUrl(tab.url);
        setHeaders(tab.headers);
        setBody(tab.body);
        setResponse(tab.response);
        isSyncingFromTab.current = false;
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 2. On active tab change: save outgoing, load incoming ---
  useEffect((): void => {
    const prevId = prevActiveTabIdRef.current;

    if (activeTabId === prevId) {
      prevActiveTabIdRef.current = activeTabId;
      return;
    }

    // Save outgoing tab state from request store
    if (prevId !== null) {
      const reqState = useRequestStore.getState();
      updateTab(prevId, {
        method: reqState.method,
        url: reqState.url,
        headers: reqState.headers,
        body: reqState.body,
        response: reqState.response,
      });
    }

    // Load incoming tab state into request store
    if (activeTabId !== null) {
      const tab = useTabStore.getState().tabs[activeTabId];
      if (tab !== undefined) {
        isSyncingFromTab.current = true;
        setMethod(tab.method);
        setUrl(tab.url);
        setHeaders(tab.headers);
        setBody(tab.body);
        setResponse(tab.response);
        isSyncingFromTab.current = false;
      }
    }

    prevActiveTabIdRef.current = activeTabId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId]);

  // --- 3. Sync request store edits back to active tab ---
  useEffect((): (() => void) => {
    // Subscribe to request store changes (excluding response — handled separately)
    const unsubscribe = useRequestStore.subscribe((state, prevState): void => {
      if (isSyncingFromTab.current) {
        return;
      }

      const currentActiveId = useTabStore.getState().activeTabId;
      if (currentActiveId === null) {
        return;
      }

      // Check if any request fields changed
      const changed =
        state.method !== prevState.method ||
        state.url !== prevState.url ||
        state.headers !== prevState.headers ||
        state.body !== prevState.body;

      if (changed) {
        const currentTab = useTabStore.getState().tabs[currentActiveId];
        useTabStore.getState().updateTab(currentActiveId, {
          method: state.method,
          url: state.url,
          headers: state.headers,
          body: state.body,
          // Only update the label when the URL actually changes so we don't
          // overwrite explicit/name-based labels (e.g., collection requests).
          ...(state.url !== prevState.url ? { label: deriveTabLabel(state.url) } : {}),
          // Mark tab as dirty if it has a source (collection or history)
          ...(currentTab?.source !== undefined ? { isDirty: true } : {}),
        });
      }

      // Sync response separately (set on execution)
      if (state.response !== prevState.response) {
        useTabStore.getState().updateTab(currentActiveId, {
          response: state.response,
        });
      }
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
