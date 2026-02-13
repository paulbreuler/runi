/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useRef } from 'react';
import { useRequestStoreRaw } from '@/stores/useRequestStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { globalEventBus, logEventFlow, type CollectionRequestSelectedPayload } from '@/events/bus';
import type { HistoryEntry } from '@/types/generated/HistoryEntry';
import type { RequestTabState } from '@/types/canvas';
import { requestContextDescriptor } from '@/contexts/RequestContext/descriptor';
import type { HttpResponse } from '@/types/http';

/**
 * Bidirectional sync between `useCanvasStore` (multi-context canvas) and `useRequestStoreRaw` (keyed store).
 *
 * This hook:
 * 1. Initializes a default request context on mount if none exist
 * 2. Loads incoming context state into the keyed request store
 * 3. Syncs request store edits back to the canvas store
 * 4. Handles collection and history selection events by registering/activating contexts
 *
 * Call this once in HomePage.
 */
export function useContextSync(): void {
  const { activeContextId, openRequestTab, registerTemplate } = useCanvasStore();

  // Guard against sync loops
  const isSyncingFromCanvas = useRef(false);

  // --- 1. Initialize default request context on mount ---
  useEffect((): void => {
    const state = useCanvasStore.getState();
    // Check if there are any request contexts (contexts starting with 'request-')
    const hasRequestContexts = state.contextOrder.some((id) => id.startsWith('request-'));

    if (!hasRequestContexts) {
      // Ensure template is registered before opening default tab
      if (!state.templates.has('request')) {
        registerTemplate(requestContextDescriptor);
      }
      openRequestTab();
    }

    // After opening/loading the default tab, clean stale persisted state
    const freshState = useCanvasStore.getState();
    const staleIds: string[] = [];
    for (const contextId of freshState.contextState.keys()) {
      if (!freshState.contexts.has(contextId)) {
        staleIds.push(contextId);
      }
    }
    if (staleIds.length > 0) {
      // Trigger a store update to persist the cleanup
      useCanvasStore.setState((state) => {
        const nextState = new Map(state.contextState);
        for (const id of staleIds) {
          nextState.delete(id);
        }
        return { contextState: nextState };
      });
    }

    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 2. On active context change: ensure keyed store is initialized ---
  useEffect((): void => {
    if (activeContextId?.startsWith('request-') === true) {
      const storeRaw = useRequestStoreRaw.getState();
      const existingRequestState = storeRaw.contexts[activeContextId];

      if (existingRequestState === undefined) {
        const canvasState = useCanvasStore.getState().getContextState(activeContextId);
        if (Object.keys(canvasState).length > 0) {
          // Use a specific type for legacy persisted fields
          interface LegacyPersistedState extends RequestTabState {
            method?: string;
            url?: string;
            headers?: Record<string, string>;
            body?: string;
            response?: HttpResponse | null;
          }
          const legacyState = canvasState as LegacyPersistedState;
          isSyncingFromCanvas.current = true;
          storeRaw.initContext(activeContextId, {
            method: legacyState.method ?? 'GET',
            url: legacyState.url ?? '',
            headers: legacyState.headers ?? {},
            body: legacyState.body ?? '',
            response: legacyState.response ?? null,
          });
          isSyncingFromCanvas.current = false;
        } else {
          storeRaw.initContext(activeContextId);
        }
      }
    }
  }, [activeContextId]);

  // --- 3. Sync request store edits back to canvas contexts ---
  useEffect((): (() => void) => {
    // Subscribe to ALL request store changes
    const unsubscribe = useRequestStoreRaw.subscribe((state, prevState): void => {
      // Check every context that might have changed
      Object.keys(state.contexts).forEach((contextId) => {
        if (!contextId.startsWith('request-')) {
          return;
        }

        const activeState = state.contexts[contextId];
        const prevActiveState = prevState.contexts[contextId];

        if (activeState === undefined || activeState === prevActiveState) {
          return;
        }

        if (isSyncingFromCanvas.current) {
          return;
        }

        const canvasStore = useCanvasStore.getState();
        const currentContextMetadata = canvasStore.getContextState(contextId) as RequestTabState;

        // Check if tab now has meaningful data
        const hasMeaningfulData = canvasStore.hasMeaningfulData(contextId);

        // Only derive label from URL if:
        // 1. URL changed
        // 2. Tab doesn't have a custom name
        // 3. Tab hasn't been saved yet (no meaningful data previously)
        const shouldUpdateLabel =
          activeState.url !== prevActiveState?.url &&
          currentContextMetadata.name === undefined &&
          currentContextMetadata.isSaved !== true;
        const newLabel = shouldUpdateLabel ? deriveContextLabel(activeState.url) : undefined;

        const metadata: RequestTabState = {
          // Metadata fields only
          isSaved: hasMeaningfulData,
          createdAt: currentContextMetadata.createdAt,
          name: currentContextMetadata.name,
          source: currentContextMetadata.source,
          // Mark as dirty if it has a source (collection or history) and values changed
          isDirty:
            (currentContextMetadata.isDirty ?? false) ||
            (currentContextMetadata.source !== undefined &&
              (activeState.method !== prevActiveState.method ||
                activeState.url !== prevActiveState.url ||
                activeState.headers !== prevActiveState.headers ||
                activeState.body !== prevActiveState.body)),
        };

        canvasStore.updateContextState(contextId, metadata as unknown as Record<string, unknown>);

        // Update context label if URL changed and no custom name
        if (newLabel !== undefined) {
          const descriptor = canvasStore.contexts.get(contextId);
          if (descriptor !== undefined) {
            canvasStore.registerContext({
              ...descriptor,
              label: newLabel,
            });
          }
        }
      });
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
          if (!store.templates.has('request')) {
            store.registerTemplate(requestContextDescriptor);
          }
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

        logEventFlow('receive', 'collection.request-selected', event.correlationId, {
          requestId: request.id,
          collectionId,
          requestName: request.name,
        });

        const source = {
          type: 'collection' as const,
          collectionId,
          requestId: request.id,
        };
        const store = useCanvasStore.getState();
        const existingContextId = store.findContextBySource(source);

        logEventFlow('process', 'collection.request-selected', event.correlationId, {
          existingContextId,
          hasRequestContext: store.contexts.has('request'),
        });

        if (existingContextId !== null) {
          store.setActiveContext(existingContextId);
          logEventFlow('complete', 'collection.request-selected', event.correlationId, {
            action: 'activate-existing',
            contextId: existingContextId,
          });
        } else {
          if (!store.templates.has('request')) {
            store.registerTemplate(requestContextDescriptor);
          }
          const newContextId = store.openRequestTab({
            method: request.method,
            url: request.url,
            headers: request.headers,
            body: request.body?.content ?? '',
            source,
            label: deriveContextLabel(request.url, request.name),
          });
          logEventFlow('complete', 'collection.request-selected', event.correlationId, {
            action: 'open-new-tab',
            contextId: newContextId,
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
function deriveContextLabel(url: string | undefined | null, name?: string): string {
  if (name !== undefined && name.length > 0) {
    return name;
  }

  const safeUrl = url ?? '';
  if (safeUrl.length === 0) {
    return 'New Request';
  }

  try {
    const parsed = new URL(safeUrl);
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
    return safeUrl.length > 30 ? `${safeUrl.slice(0, 30)}...` : safeUrl;
  }
}
