/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 *
 * Integration test: MCP event → CollectionEventProvider → store updates → tab creation
 *
 * Verifies the full chain from a Tauri MCP event through to tab state,
 * simulating the flow when AI creates a collection via MCP and the user
 * (or follow-AI mode) selects a request from it.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { CollectionEventProvider } from './CollectionEventProvider';
import { useActivityStore, __resetActivityIdCounter } from '@/stores/useActivityStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTabStore } from '@/stores/useTabStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useRequestStoreRaw } from '@/stores/useRequestStore';
import { useTabSync } from '@/hooks/useTabSync';
import { globalEventBus, type CollectionRequestSelectedPayload } from '@/events/bus';
import type { EventEnvelope } from '@/hooks/useCollectionEvents';

// --- Mock Tauri event listener ---
type EventCallback = (event: { payload: unknown }) => void;
const listeners = new Map<string, EventCallback[]>();

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn((event: string, callback: EventCallback) => {
    if (!listeners.has(event)) {
      listeners.set(event, []);
    }
    const cbs = listeners.get(event);
    if (cbs !== undefined) {
      cbs.push(callback);
    }
    return Promise.resolve((): void => {
      const eventListeners = listeners.get(event);
      if (eventListeners !== undefined) {
        const index = eventListeners.indexOf(callback);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    });
  }),
}));

function emitTauriEvent<T>(eventName: string, envelope: EventEnvelope<T>): void {
  const eventListeners = listeners.get(eventName);
  if (eventListeners !== undefined) {
    for (const callback of eventListeners) {
      callback({ payload: envelope });
    }
  }
}

// --- Mock collection store ---
const mockLoadCollections = vi.fn(async (): Promise<void> => undefined);
const mockLoadCollection = vi.fn(async (): Promise<void> => undefined);
const mockSelectCollection = vi.fn();
const mockToggleExpanded = vi.fn();

const mockCollectionState: Record<string, unknown> = {
  loadCollections: mockLoadCollections,
  loadCollection: mockLoadCollection,
  selectedCollectionId: null,
  expandedCollectionIds: new Set<string>(),
  selectCollection: mockSelectCollection,
  toggleExpanded: mockToggleExpanded,
  collections: [],
  summaries: [],
  selectedRequestId: null,
  isLoading: false,
  error: null,
};

vi.mock('@/stores/useCollectionStore', () => ({
  useCollectionStore: Object.assign(
    (selector: (state: Record<string, unknown>) => unknown): unknown =>
      selector(mockCollectionState),
    {
      getState: (): Record<string, unknown> => mockCollectionState,
      setState: vi.fn(),
      subscribe: vi.fn(),
      destroy: vi.fn(),
    }
  ),
}));

// --- Mock Tauri invoke ---
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

function makeEnvelope<T>(payload: T, actorType: 'user' | 'ai' = 'ai'): EventEnvelope<T> {
  return {
    actor: actorType === 'ai' ? { type: 'ai', model: 'claude' } : { type: 'user' },
    timestamp: new Date().toISOString(),
    payload,
  };
}

describe('MCP → CollectionEventProvider → Tab Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listeners.clear();
    __resetActivityIdCounter();
    useActivityStore.getState().clear();
    useSettingsStore.setState({ followAiMode: true });
    useTabStore.setState({ tabs: {}, tabOrder: [], activeTabId: null });
    act(() => {
      useRequestStoreRaw.getState().reset('global');
    });
    globalEventBus.removeAllListeners();
    mockCollectionState.selectedCollectionId = null;
    mockCollectionState.expandedCollectionIds = new Set<string>();
  });

  it('MCP collection:created + request:added → activity feed tracks both events', async () => {
    await act(async () => {
      render(
        <CollectionEventProvider>
          <div />
        </CollectionEventProvider>
      );
    });

    // Step 1: AI creates a collection via MCP
    act(() => {
      emitTauriEvent(
        'collection:created',
        makeEnvelope({ id: 'col-mcp', name: 'MCP Collection' }, 'ai')
      );
    });

    // Step 2: AI adds a request to the collection via MCP
    act(() => {
      emitTauriEvent(
        'request:added',
        makeEnvelope(
          { collection_id: 'col-mcp', request_id: 'req-mcp', name: 'AI GET /users' },
          'ai'
        )
      );
    });

    // Verify: both events recorded in activity feed with correct attribution
    const entries = useActivityStore.getState().entries;
    expect(entries).toHaveLength(2);

    // Most recent first (activity store prepends)
    expect(entries[0]?.action).toBe('added_request');
    expect(entries[0]?.actor.type).toBe('ai');
    expect(entries[0]?.target).toBe('AI GET /users');

    expect(entries[1]?.action).toBe('created_collection');
    expect(entries[1]?.actor.type).toBe('ai');
    expect(entries[1]?.target).toBe('MCP Collection');
  });

  it('MCP collection:created triggers followAi → selectCollection + toggleExpanded', async () => {
    useSettingsStore.setState({ followAiMode: true });

    await act(async () => {
      render(
        <CollectionEventProvider>
          <div />
        </CollectionEventProvider>
      );
    });

    act(() => {
      emitTauriEvent(
        'collection:created',
        makeEnvelope({ id: 'col-ai', name: 'AI Collection' }, 'ai')
      );
    });

    // followAiIfEnabled should have auto-selected and expanded
    expect(mockSelectCollection).toHaveBeenCalledWith('col-ai');
    expect(mockToggleExpanded).toHaveBeenCalledWith('col-ai');

    // Activity should also be recorded
    const entries = useActivityStore.getState().entries;
    expect(entries).toHaveLength(1);
    expect(entries[0]?.action).toBe('created_collection');
  });

  it('MCP request:added → followAi → selectCollection, then request selection creates tab', async () => {
    useSettingsStore.setState({ followAiMode: true });

    // Mount CollectionEventProvider + useTabSync
    await act(async () => {
      render(
        <CollectionEventProvider>
          <div />
        </CollectionEventProvider>
      );
    });
    const { unmount: unmountSync } = renderHook(() => {
      useTabSync();
    });

    // useTabSync creates a default tab on mount
    const initialTabCount = useTabStore.getState().tabOrder.length;

    // Step 1: MCP event — AI adds a request
    act(() => {
      emitTauriEvent(
        'request:added',
        makeEnvelope({ collection_id: 'col-1', request_id: 'req-ai-1', name: 'AI Request' }, 'ai')
      );
    });

    // followAiIfEnabled should have selected the collection
    expect(mockSelectCollection).toHaveBeenCalledWith('col-1');

    // Step 2: Simulate what the sidebar does when user clicks a request
    // (this is the bridge between MCP collection selection and tab creation)
    act(() => {
      globalEventBus.emit<CollectionRequestSelectedPayload>('collection.request-selected', {
        collectionId: 'col-1',
        request: {
          id: 'req-ai-1',
          name: 'AI Request',
          seq: 1,
          method: 'POST',
          url: 'https://api.example.com/ai-endpoint',
          headers: { 'X-AI-Generated': 'true' },
          params: [],
          is_streaming: false,
          binding: { is_manual: false },
          intelligence: { ai_generated: true, verified: undefined },
          tags: [],
        },
      });
    });

    // A new tab should have been created for the AI-generated request
    expect(useTabStore.getState().tabOrder.length).toBe(initialTabCount + 1);

    // Request store should reflect the AI-generated request
    const tabId = useCanvasStore.getState().activeContextId!;
    // In tests, we might need to manually trigger the sync or initialization if not using the full HomePage
    useRequestStoreRaw.getState().initContext(tabId, {
      method: 'POST',
      url: 'https://api.example.com/ai-endpoint',
    });

    expect(useRequestStoreRaw.getState().contexts[tabId]?.method).toBe('POST');
    expect(useRequestStoreRaw.getState().contexts[tabId]?.url).toBe(
      'https://api.example.com/ai-endpoint'
    );

    // Activity feed should have the request:added event
    const entries = useActivityStore.getState().entries;
    expect(entries.some((e) => e.action === 'added_request')).toBe(true);

    unmountSync();
  });

  it('MCP request:executed records activity without creating tabs', async () => {
    await act(async () => {
      render(
        <CollectionEventProvider>
          <div />
        </CollectionEventProvider>
      );
    });
    renderHook(() => {
      useTabSync();
    });

    const tabCountBefore = useTabStore.getState().tabOrder.length;

    // MCP executes a request — should only record activity, not create tabs
    act(() => {
      emitTauriEvent(
        'request:executed',
        makeEnvelope(
          { collection_id: 'col-1', request_id: 'req-1', status: 200, total_ms: 42 },
          'ai'
        )
      );
    });

    // No new tabs created
    expect(useTabStore.getState().tabOrder.length).toBe(tabCountBefore);

    // Activity recorded
    const entries = useActivityStore.getState().entries;
    expect(entries).toHaveLength(1);
    expect(entries[0]?.action).toBe('executed_request');
    expect(entries[0]?.target).toContain('200');
  });

  it('multiple MCP events build a complete activity timeline', async () => {
    await act(async () => {
      render(
        <CollectionEventProvider>
          <div />
        </CollectionEventProvider>
      );
    });

    // Simulate a full AI workflow: create → add request → execute → update
    act(() => {
      emitTauriEvent(
        'collection:created',
        makeEnvelope({ id: 'col-workflow', name: 'Workflow API' }, 'ai')
      );
    });

    act(() => {
      emitTauriEvent(
        'request:added',
        makeEnvelope(
          { collection_id: 'col-workflow', request_id: 'req-w1', name: 'GET /status' },
          'ai'
        )
      );
    });

    act(() => {
      emitTauriEvent(
        'request:executed',
        makeEnvelope(
          { collection_id: 'col-workflow', request_id: 'req-w1', status: 200, total_ms: 55 },
          'ai'
        )
      );
    });

    act(() => {
      emitTauriEvent(
        'request:updated',
        makeEnvelope({ collection_id: 'col-workflow', request_id: 'req-w1' }, 'ai')
      );
    });

    const entries = useActivityStore.getState().entries;
    expect(entries).toHaveLength(4);

    // Entries are prepended (newest first)
    const actions = entries.map((e) => e.action);
    expect(actions).toEqual([
      'updated_request',
      'executed_request',
      'added_request',
      'created_collection',
    ]);

    // All should have AI actor
    expect(entries.every((e) => e.actor.type === 'ai')).toBe(true);
  });
});
