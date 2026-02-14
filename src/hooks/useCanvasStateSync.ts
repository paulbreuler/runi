/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file useCanvasStateSync hook
 * @description Synchronizes canvas state to backend for MCP tool access
 *
 * This hook:
 * - Builds serializable snapshots of canvas state (tabs, templates, active index)
 * - Pushes snapshots to backend via sync_canvas_state Tauri command (debounced)
 * - Listens for Tauri events from MCP tools to update store (switch tab, open, close)
 *
 * **Event flow:**
 * 1. Store changes → debounced snapshot → backend sync
 * 2. MCP tool mutations → Tauri events → store actions
 *
 * This enables MCP tools to read current canvas state and drive navigation.
 */

import { useEffect, useCallback, useRef } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useActivityStore, type ActivityAction } from '@/stores/useActivityStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { globalEventBus, type ToastEventPayload } from '@/events/bus';
import type { EventEnvelope } from '@/hooks/useCollectionEvents';
import type {
  CanvasEventHint,
  CanvasStateSnapshot,
  TabSummary,
  TemplateSummary,
} from '@/types/generated';
import type { RequestTabSource } from '@/types/canvas';

/**
 * Build a serializable canvas snapshot from store state.
 *
 * Extracts tab summaries, active tab index, and template summaries.
 */
export function buildCanvasSnapshot(state: {
  contexts: Map<string, { id: string; label: string; contextType?: string }>;
  templates: Map<string, { id: string; label: string }>;
  contextOrder: string[];
  activeContextId: string | null;
}): CanvasStateSnapshot {
  const { contexts, templates, contextOrder, activeContextId } = state;

  // Build tab summaries from ordered contexts (exclude templates)
  const tabs: TabSummary[] = [];
  for (const id of contextOrder) {
    const context = contexts.get(id);
    if (context === undefined) {
      continue;
    }

    // Determine tab type from context type or ID
    const tabType: 'request' | 'template' =
      context.contextType === 'request' || id.startsWith('request-') ? 'request' : 'template';

    tabs.push({
      id: context.id,
      label: context.label,
      tabType,
    });
  }

  // Build template summaries
  const templateSummaries: TemplateSummary[] = Array.from(templates.values()).map((template) => ({
    id: template.id,
    name: template.label,
    templateType: template.id, // Use ID as template type for now
  }));

  // Find active tab index based on constructed tabs array
  const activeTabIndex =
    activeContextId !== null ? tabs.findIndex((tab) => tab.id === activeContextId) : null;

  const snapshot: CanvasStateSnapshot = {
    tabs,
    activeTabIndex: activeTabIndex === -1 ? null : activeTabIndex,
    templates: templateSummaries,
  };

  return snapshot;
}

/** Diffable subset of canvas state used for event hint derivation. */
interface DiffableState {
  contextOrder: string[];
  activeContextId: string | null;
}

/**
 * Derive a `CanvasEventHint` by comparing previous and current canvas state.
 *
 * - `contextOrder` grew   → `tab_opened` (finds the new ID)
 * - `contextOrder` shrank → `tab_closed` (finds the removed ID)
 * - `activeContextId` changed, same length → `tab_switched`
 * - Otherwise (or null previous)           → `state_sync`
 */
export function deriveEventHint(
  previous: DiffableState | null,
  current: DiffableState,
  contexts: Map<string, { id: string; label: string; contextType?: string }>
): CanvasEventHint {
  if (previous === null) {
    return { kind: 'state_sync' };
  }

  const prevOrder = previous.contextOrder;
  const currOrder = current.contextOrder;

  // Tab opened: contextOrder grew
  if (currOrder.length > prevOrder.length) {
    const prevSet = new Set(prevOrder);
    const newId = currOrder.find((id) => !prevSet.has(id));
    if (newId !== undefined) {
      const label = contexts.get(newId)?.label ?? 'Unknown';
      return { kind: 'tab_opened', tab_id: newId, label };
    }
  }

  // Tab closed: contextOrder shrank
  if (currOrder.length < prevOrder.length) {
    const currSet = new Set(currOrder);
    const removedId = prevOrder.find((id) => !currSet.has(id));
    if (removedId !== undefined) {
      // For closed tabs, try current contexts first, then previous state if available
      const label = contexts.get(removedId)?.label ?? 'Unknown';
      return { kind: 'tab_closed', tab_id: removedId, label };
    }
  }

  // Tab switched: same length, different active ID
  if (
    currOrder.length === prevOrder.length &&
    current.activeContextId !== previous.activeContextId &&
    current.activeContextId !== null
  ) {
    const label = contexts.get(current.activeContextId)?.label ?? 'Unknown';
    return { kind: 'tab_switched', tab_id: current.activeContextId, label };
  }

  return { kind: 'state_sync' };
}

/**
 * Record a canvas action in the activity feed.
 *
 * Mirrors `CollectionEventProvider.recordActivity()` pattern.
 */
function recordCanvasActivity(
  envelope: EventEnvelope<unknown>,
  action: ActivityAction,
  target: string,
  targetId?: string
): void {
  useActivityStore.getState().addEntry({
    timestamp: envelope.timestamp,
    actor: envelope.actor,
    action,
    target,
    targetId,
    seq: envelope.lamport?.seq,
  });
}

/**
 * Payload for the `canvas:open_collection_request` Tauri event.
 *
 * Emitted by the backend `open_collection_request` MCP tool with the full
 * request data so the frontend can open a pre-populated tab.
 */
interface OpenCollectionRequestPayload {
  collection_id: string;
  request_id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string> | null;
  body: string | null;
  body_type?: string;
}

/**
 * Hook for synchronizing canvas state to backend and listening for MCP mutations.
 *
 * **Usage:**
 * ```tsx
 * useCanvasStateSync(); // Mount in HomePage or App component
 * ```
 *
 * **Backend sync:**
 * - Subscribes to canvas store changes
 * - Debounces snapshot pushes to 100ms
 * - Calls `sync_canvas_state` Tauri command
 *
 * **MCP event listeners:**
 * - `canvas:switch_tab` → `setActiveContext(id)`
 * - `canvas:open_request_tab` → `openRequestTab(overrides)`
 * - `canvas:open_collection_request` → `openRequestTab(overrides)` with collection source
 * - `canvas:close_tab` → `closeContext(id)`
 */
export function useCanvasStateSync(): void {
  // Use ref to track debounce timer and last synced state
  const debounceTimerRef = useRef<number | null>(null);
  const lastStateRef = useRef<{
    contexts: Map<string, unknown>;
    templates: Map<string, unknown>;
    contextOrder: string[];
    activeContextId: string | null;
  } | null>(null);

  // Track previous state for event hint derivation
  const previousStateRef = useRef<DiffableState | null>(null);

  // Track whether the current mutation was triggered by an AI/MCP event
  const aiMutationRef = useRef<boolean>(false);

  // Helper to trigger debounced sync
  const triggerSync = useCallback(
    (state: {
      contexts: Map<string, { id: string; label: string; contextType?: string }>;
      templates: Map<string, { id: string; label: string }>;
      contextOrder: string[];
      activeContextId: string | null;
    }): void => {
      // Debounced snapshot push (100ms)
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = window.setTimeout((): void => {
        const snapshot = buildCanvasSnapshot({
          contexts: state.contexts,
          templates: state.templates,
          contextOrder: state.contextOrder,
          activeContextId: state.activeContextId,
        });

        // Derive event hint from state diff
        const eventHint = deriveEventHint(
          previousStateRef.current,
          {
            contextOrder: state.contextOrder,
            activeContextId: state.activeContextId,
          },
          state.contexts
        );

        // Read and reset actor provenance
        const actor = aiMutationRef.current ? 'ai' : 'user';
        aiMutationRef.current = false;

        // Update previous state for next diff
        previousStateRef.current = {
          contextOrder: state.contextOrder,
          activeContextId: state.activeContextId,
        };

        // Push to backend (async, no await)
        void invoke('sync_canvas_state', { snapshot, eventHint, actor }).catch((error: unknown) => {
          console.error('[useCanvasStateSync] Failed to sync canvas state:', error);
          globalEventBus.emit<ToastEventPayload>('toast.show', {
            type: 'error',
            message: 'Failed to sync canvas state',
            details: String(error),
          });
        });

        debounceTimerRef.current = null;
      }, 100);
    },
    []
  );

  // Store subscription for backend sync
  useEffect((): (() => void) => {
    const initialState = useCanvasStore.getState();

    // Trigger initial sync on mount
    triggerSync(initialState);
    lastStateRef.current = {
      contexts: initialState.contexts,
      templates: initialState.templates,
      contextOrder: initialState.contextOrder,
      activeContextId: initialState.activeContextId,
    };

    const unsubscribe = useCanvasStore.subscribe((state) => {
      // Check if sync-relevant state changed (shallow equality for Maps and Arrays)
      const hasChanged =
        state.contexts !== lastStateRef.current?.contexts ||
        state.templates !== lastStateRef.current.templates ||
        state.contextOrder !== lastStateRef.current.contextOrder ||
        state.activeContextId !== lastStateRef.current.activeContextId;

      if (!hasChanged) {
        return;
      }

      // Update last state
      lastStateRef.current = {
        contexts: state.contexts,
        templates: state.templates,
        contextOrder: state.contextOrder,
        activeContextId: state.activeContextId,
      };

      triggerSync(state);
    });

    return (): void => {
      unsubscribe();
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [triggerSync]);

  // MCP event listeners
  useEffect((): (() => void) => {
    let cancelled = false;
    const unlistenFns: UnlistenFn[] = [];

    const addListener = async (
      eventName: string,
      handler: (payload: unknown) => void
    ): Promise<void> => {
      try {
        const unlisten = await listen<unknown>(eventName, (event): void => {
          handler(event.payload);
        });
        if (cancelled) {
          unlisten();
        } else {
          unlistenFns.push(unlisten);
        }
      } catch (error: unknown) {
        console.error(`[useCanvasStateSync] Failed to listen to ${eventName}:`, error);
      }
    };

    const setupListeners = async (): Promise<void> => {
      await Promise.all([
        // Switch tab event
        addListener('canvas:switch_tab', (payload): void => {
          const envelope = payload as EventEnvelope<{ contextId: string }>;
          const isAi = envelope.actor.type === 'ai';

          // Always log activity
          recordCanvasActivity(
            envelope,
            'switched_tab',
            envelope.payload.contextId,
            envelope.payload.contextId
          );

          // Conditionally navigate based on actor + Follow AI mode
          if (!isAi || useSettingsStore.getState().followAiMode) {
            // Mark as AI mutation before store action so triggerSync picks it up
            if (isAi) {
              aiMutationRef.current = true;
            }
            useCanvasStore.getState().setActiveContext(envelope.payload.contextId);
          }
        }),

        // Open request tab event
        addListener('canvas:open_request_tab', (payload): void => {
          const envelope = payload as EventEnvelope<{ label?: string }>;
          const isAi = envelope.actor.type === 'ai';
          const shouldActivate = !isAi || useSettingsStore.getState().followAiMode;

          // Always log activity
          recordCanvasActivity(envelope, 'opened_tab', envelope.payload.label ?? 'Request');

          // Mark as AI mutation before store action so triggerSync picks it up
          if (isAi) {
            aiMutationRef.current = true;
          }

          // Open tab with conditional activation
          useCanvasStore
            .getState()
            .openRequestTab({ label: envelope.payload.label }, { activate: shouldActivate });
        }),

        // Close tab event
        addListener('canvas:close_tab', (payload): void => {
          const envelope = payload as EventEnvelope<{ contextId: string }>;
          const isAi = envelope.actor.type === 'ai';
          const shouldActivate = !isAi || useSettingsStore.getState().followAiMode;

          // Always log activity
          recordCanvasActivity(
            envelope,
            'closed_tab',
            envelope.payload.contextId,
            envelope.payload.contextId
          );

          // Mark as AI mutation before store action so triggerSync picks it up
          if (isAi) {
            aiMutationRef.current = true;
          }

          // Close tab with conditional activation
          useCanvasStore
            .getState()
            .closeContext(envelope.payload.contextId, { activate: shouldActivate });
        }),

        // Open collection request event — opens a pre-populated request tab
        addListener('canvas:open_collection_request', (payload): void => {
          const envelope = payload as EventEnvelope<OpenCollectionRequestPayload>;
          const { collection_id, request_id, name, method, url, headers, body } = envelope.payload;
          const isAi = envelope.actor.type === 'ai';
          const shouldActivate = !isAi || useSettingsStore.getState().followAiMode;

          // Always log activity
          recordCanvasActivity(envelope, 'opened_tab', name, request_id);

          // Mark as AI mutation before store action so triggerSync picks it up
          if (isAi) {
            aiMutationRef.current = true;
          }

          // Check if a tab with this collection source already exists
          const store = useCanvasStore.getState();
          const source: RequestTabSource = {
            type: 'collection',
            collectionId: collection_id,
            requestId: request_id,
          };
          const existingContextId = store.findContextBySource(source);

          if (existingContextId !== null) {
            // Tab already open — just activate it if appropriate
            if (shouldActivate) {
              store.setActiveContext(existingContextId);
            }
            return;
          }

          // Open new request tab with full request data
          store.openRequestTab(
            {
              label: name,
              name,
              method,
              url,
              headers: headers ?? {},
              body: body ?? '',
              source,
            },
            { activate: shouldActivate }
          );
        }),
      ]);
    };

    void setupListeners();

    return (): void => {
      cancelled = true;
      for (const unlisten of unlistenFns) {
        unlisten();
      }
    };
  }, []);
}
