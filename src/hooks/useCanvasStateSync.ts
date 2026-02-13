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
import type { CanvasStateSnapshot, TabSummary, TemplateSummary } from '@/types/generated';

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
 * - `canvas:close_tab` → `closeContext(id)`
 */
export function useCanvasStateSync(): void {
  const contexts = useCanvasStore((s) => s.contexts);
  const templates = useCanvasStore((s) => s.templates);
  const contextOrder = useCanvasStore((s) => s.contextOrder);
  const activeContextId = useCanvasStore((s) => s.activeContextId);
  const setActiveContext = useCanvasStore((s) => s.setActiveContext);
  const openRequestTab = useCanvasStore((s) => s.openRequestTab);
  const closeContext = useCanvasStore((s) => s.closeContext);

  // Use ref to track debounce timer
  const debounceTimerRef = useRef<number | null>(null);

  // Build and sync snapshot to backend
  const syncSnapshot = useCallback((): void => {
    const snapshot = buildCanvasSnapshot({
      contexts,
      templates,
      contextOrder,
      activeContextId,
    });

    // Push to backend (async, no await)
    void invoke('sync_canvas_state', { snapshot }).catch((error: unknown) => {
      console.error('[useCanvasStateSync] Failed to sync canvas state:', error);
      globalEventBus.emit<ToastEventPayload>('toast.show', {
        type: 'error',
        message: 'Failed to sync canvas state',
        details: String(error),
      });
    });
  }, [contexts, templates, contextOrder, activeContextId]);

  // Debounced snapshot push (100ms)
  useEffect((): (() => void) => {
    // Clear existing timer
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = window.setTimeout((): void => {
      syncSnapshot();
      debounceTimerRef.current = null;
    }, 100);

    // Cleanup on unmount
    return (): void => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [syncSnapshot]);

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
            setActiveContext(envelope.payload.contextId);
          }
        }),

        // Open request tab event
        addListener('canvas:open_request_tab', (payload): void => {
          const envelope = payload as EventEnvelope<{ label?: string }>;
          const isAi = envelope.actor.type === 'ai';
          const shouldActivate = !isAi || useSettingsStore.getState().followAiMode;

          // Always log activity
          recordCanvasActivity(envelope, 'opened_tab', envelope.payload.label ?? 'Request');

          // Open tab with conditional activation
          openRequestTab({ label: envelope.payload.label }, { activate: shouldActivate });
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

          // Close tab with conditional activation
          // Note: closeContext will still activate adjacent if closing the user's active tab
          closeContext(envelope.payload.contextId, { activate: shouldActivate });
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
  }, [setActiveContext, openRequestTab, closeContext]);
}
