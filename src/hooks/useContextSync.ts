/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useRef } from 'react';
import { useRequestStore } from '@/stores/useRequestStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { globalEventBus, type CollectionRequestSelectedPayload } from '@/events/bus';
import type { HistoryEntry } from '@/types/generated/HistoryEntry';
import type { RequestTabState } from '@/types/canvas';

/**
 * Bidirectional sync between `useCanvasStore` (multi-context canvas) and `useRequestStore` (single active request).
 *
 * This hook:
 * 1. Initializes a default request context on mount if none exist
 * 2. Loads the active context's request state into the request store on context switch
 * 3. Syncs request store edits back to the active context
 * 4. Handles collection and history selection events by registering/activating contexts
 *
 * Call this once in HomePage.
 */
export function useContextSync(): void {
  const { setMethod, setUrl, setHeaders, setBody, setResponse } = useRequestStore();

  const { activeContextId, openRequestTab, updateContextState } = useCanvasStore();

  // Track previous active context to save outgoing state on switch
  const prevActiveContextIdRef = useRef<string | null>(null);
  // Guard against sync loops: when we're loading context → request store, skip syncing back
  const isSyncingFromContext = useRef(false);

  // --- 1. Initialize default request context on mount ---
  useEffect((): void => {
    const state = useCanvasStore.getState();
    // Check if there are any request contexts (contexts starting with 'request-')
    const hasRequestContexts = state.contextOrder.some((id) => id.startsWith('request-'));

    if (!hasRequestContexts) {
      openRequestTab();
    } else if (state.activeContextId !== null) {
      // Load persisted active context into request store
      const contextState = state.getContextState(state.activeContextId);
      if (Object.keys(contextState).length > 0) {
        const reqState = contextState as Partial<RequestTabState>;
        isSyncingFromContext.current = true;
        setMethod(reqState.method ?? 'GET');
        setUrl(reqState.url ?? '');
        setHeaders(reqState.headers ?? {});
        setBody(reqState.body ?? '');
        setResponse(reqState.response ?? null);
        isSyncingFromContext.current = false;
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 2. On active context change: save outgoing, load incoming ---
  useEffect((): void => {
    const prevId = prevActiveContextIdRef.current;

    if (activeContextId === prevId) {
      prevActiveContextIdRef.current = activeContextId;
      return;
    }

    // Save outgoing context state from request store
    if (prevId?.startsWith('request-') === true) {
      const reqState = useRequestStore.getState();
      updateContextState(prevId, {
        method: reqState.method,
        url: reqState.url,
        headers: reqState.headers,
        body: reqState.body,
        response: reqState.response,
      });
    }

    // Load incoming context state into request store
    if (activeContextId?.startsWith('request-') === true) {
      const contextState = useCanvasStore.getState().getContextState(activeContextId);
      if (Object.keys(contextState).length > 0) {
        const reqState = contextState as Partial<RequestTabState>;
        isSyncingFromContext.current = true;
        setMethod(reqState.method ?? 'GET');
        setUrl(reqState.url ?? '');
        setHeaders(reqState.headers ?? {});
        setBody(reqState.body ?? '');
        setResponse(reqState.response ?? null);
        isSyncingFromContext.current = false;
      }
    }

    prevActiveContextIdRef.current = activeContextId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContextId]);

  // --- 3. Sync request store edits back to active context ---
  useEffect((): (() => void) => {
    // Subscribe to request store changes (excluding response — handled separately)
    const unsubscribe = useRequestStore.subscribe((state, prevState): void => {
      if (isSyncingFromContext.current) {
        return;
      }

      const currentActiveId = useCanvasStore.getState().activeContextId;
      if (currentActiveId?.startsWith('request-') !== true) {
        return;
      }

      // Check if any request fields changed
      const changed =
        state.method !== prevState.method ||
        state.url !== prevState.url ||
        state.headers !== prevState.headers ||
        state.body !== prevState.body;

      if (changed) {
        const currentContext = useCanvasStore
          .getState()
          .getContextState(currentActiveId) as RequestTabState;

        // Check if tab now has meaningful data
        const hasMeaningfulData = useCanvasStore.getState().hasMeaningfulData(currentActiveId);

        // Only derive label from URL if:
        // 1. URL changed
        // 2. Tab doesn't have a custom name
        // 3. Tab hasn't been saved yet (no meaningful data previously)
        const shouldUpdateLabel =
          state.url !== prevState.url &&
          currentContext.name === undefined &&
          currentContext.isSaved !== true;
        const newLabel = shouldUpdateLabel ? deriveContextLabel(state.url) : undefined;

        useCanvasStore.getState().updateContextState(currentActiveId, {
          method: state.method,
          url: state.url,
          headers: state.headers,
          body: state.body,
          // Mark as saved if meaningful data exists
          isSaved: hasMeaningfulData,
          // Mark as dirty if it has a source (collection or history)
          ...(currentContext.source !== undefined ? { isDirty: true } : {}),
        });

        // Update context label if URL changed and no custom name
        if (newLabel !== undefined) {
          const descriptor = useCanvasStore.getState().contexts.get(currentActiveId);
          if (descriptor !== undefined) {
            useCanvasStore.getState().registerContext({
              ...descriptor,
              label: newLabel,
            });
          }
        }
      }

      // Sync response separately (set on execution)
      if (state.response !== prevState.response) {
        useCanvasStore.getState().updateContextState(currentActiveId, {
          response: state.response,
        });
      }
    });

    return unsubscribe;
  }, []);

  // --- 4. Context-aware event handlers ---
  useEffect((): (() => void) => {
    const unsubscribeHistory = globalEventBus.on<HistoryEntry>(
      'history.entry-selected',
      (event): void => {
        const entry = event.payload;
        const source = { type: 'history' as const, historyEntryId: entry.id };
        const store = useCanvasStore.getState();
        const existingContextId = store.findContextBySource(source);

        if (existingContextId !== null) {
          store.setActiveContext(existingContextId);
        } else {
          store.openRequestTab({
            method: entry.request.method,
            url: entry.request.url,
            headers: entry.request.headers,
            body: entry.request.body ?? '',
            source,
            label: deriveContextLabel(entry.request.url),
          });
        }
      }
    );

    const unsubscribeCollection = globalEventBus.on<CollectionRequestSelectedPayload>(
      'collection.request-selected',
      (event): void => {
        const { collectionId, request } = event.payload;
        const source = {
          type: 'collection' as const,
          collectionId,
          requestId: request.id,
        };
        const store = useCanvasStore.getState();
        const existingContextId = store.findContextBySource(source);

        if (existingContextId !== null) {
          store.setActiveContext(existingContextId);
        } else {
          store.openRequestTab({
            method: request.method,
            url: request.url,
            headers: request.headers,
            body: request.body?.content ?? '',
            source,
            label: deriveContextLabel(request.url, request.name),
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

/**
 * Derive a human-readable context label from a URL or explicit name
 */
function deriveContextLabel(url: string, name?: string): string {
  if (name !== undefined && name.length > 0) {
    return name;
  }

  if (url.length === 0) {
    return 'New Request';
  }

  try {
    const parsed = new URL(url);
    const path = parsed.pathname;
    // Use last meaningful path segment, or hostname if root
    if (path === '/' || path === '') {
      return parsed.hostname;
    }
    // Remove trailing slash and get last segment
    const segments = path.replace(/\/$/, '').split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    return lastSegment !== undefined ? `/${lastSegment}` : parsed.hostname;
  } catch {
    // Not a valid URL — return as-is (truncated)
    return url.length > 30 ? `${url.slice(0, 30)}...` : url;
  }
}
