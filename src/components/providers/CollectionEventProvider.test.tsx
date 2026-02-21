/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { CollectionEventProvider } from './CollectionEventProvider';
import { useActivityStore, __resetActivityIdCounter } from '@/stores/useActivityStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useRequestStoreRaw } from '@/stores/useRequestStore';
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
// The provider uses BOTH selector-based access (React hook form) and
// useCollectionStore.getState() (static form in followAiIfEnabled / onCollectionDeleted).
// The mock must support both patterns with a shared state object.
const mockLoadCollections = vi.fn(async (): Promise<void> => undefined);
const mockLoadCollection = vi.fn(async (): Promise<void> => undefined);
const mockSelectCollection = vi.fn();
const mockToggleExpanded = vi.fn();
const mockSetDriftResult = vi.fn();

const mockCollectionState: Record<string, unknown> = {
  loadCollections: mockLoadCollections,
  loadCollection: mockLoadCollection,
  selectedCollectionId: null,
  expandedCollectionIds: new Set<string>(),
  selectCollection: mockSelectCollection,
  toggleExpanded: mockToggleExpanded,
  setDriftResult: mockSetDriftResult,
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

// --- Mock Tauri invoke (needed by useSettingsStore) ---
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

function makeEnvelope<T>(payload: T, actorType: 'user' | 'ai' = 'user'): EventEnvelope<T> {
  return {
    actor: actorType === 'ai' ? { type: 'ai', model: 'claude' } : { type: 'user' },
    timestamp: new Date().toISOString(),
    payload,
  };
}

describe('CollectionEventProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listeners.clear();
    __resetActivityIdCounter();
    useActivityStore.getState().clear();
    useSettingsStore.setState({ followAiMode: false });
    useCanvasStore.getState().reset();
    // Reset mutable state
    mockCollectionState.selectedCollectionId = null;
    mockCollectionState.selectedRequestId = null;
    mockCollectionState.expandedCollectionIds = new Set<string>();
    mockCollectionState.collections = [];
  });

  it('subscribes to all 13 Tauri event channels on mount', async () => {
    await act(async () => {
      render(
        <CollectionEventProvider>
          <div />
        </CollectionEventProvider>
      );
    });

    const subscribedEvents = Array.from(listeners.keys()).sort();
    expect(subscribedEvents).toEqual([
      'collection:created',
      'collection:deleted',
      'collection:environment-activated',
      'collection:environment-deactivated',
      'collection:environment-deleted',
      'collection:environment-updated',
      'collection:imported',
      'collection:refreshed',
      'collection:saved',
      'request:added',
      'request:deleted',
      'request:executed',
      'request:updated',
    ]);
  });

  describe('collection:created', () => {
    it('refreshes collections on creation', async () => {
      await act(async () => {
        render(
          <CollectionEventProvider>
            <div />
          </CollectionEventProvider>
        );
      });

      act(() => {
        emitTauriEvent('collection:created', makeEnvelope({ id: 'col-1', name: 'Test API' }));
      });

      expect(mockLoadCollections).toHaveBeenCalled();
    });

    it('records activity for created collection', async () => {
      await act(async () => {
        render(
          <CollectionEventProvider>
            <div />
          </CollectionEventProvider>
        );
      });

      act(() => {
        emitTauriEvent('collection:created', makeEnvelope({ id: 'col-1', name: 'Test API' }));
      });

      const entries = useActivityStore.getState().entries;
      expect(entries.length).toBe(1);
      expect(entries[0]?.action).toBe('created_collection');
      expect(entries[0]?.target).toBe('Test API');
      expect(entries[0]?.targetId).toBe('col-1');
    });

    it('auto-selects AI-created collection when followAiMode is on', async () => {
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

      expect(mockSelectCollection).toHaveBeenCalledWith('col-ai');
      expect(mockToggleExpanded).toHaveBeenCalledWith('col-ai');
    });

    it('does NOT auto-select when followAiMode is off', async () => {
      useSettingsStore.setState({ followAiMode: false });

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

      expect(mockSelectCollection).not.toHaveBeenCalled();
    });

    it('does NOT auto-select for user-created collections even with followAiMode on', async () => {
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
          makeEnvelope({ id: 'col-user', name: 'User Collection' }, 'user')
        );
      });

      expect(mockSelectCollection).not.toHaveBeenCalled();
    });
  });

  describe('collection:deleted', () => {
    it('refreshes collections on deletion', async () => {
      await act(async () => {
        render(
          <CollectionEventProvider>
            <div />
          </CollectionEventProvider>
        );
      });

      act(() => {
        emitTauriEvent('collection:deleted', makeEnvelope({ id: 'col-1', name: 'Old API' }));
      });

      expect(mockLoadCollections).toHaveBeenCalled();
    });

    it('records activity for deleted collection', async () => {
      await act(async () => {
        render(
          <CollectionEventProvider>
            <div />
          </CollectionEventProvider>
        );
      });

      act(() => {
        emitTauriEvent('collection:deleted', makeEnvelope({ id: 'col-1', name: 'Old API' }));
      });

      const entries = useActivityStore.getState().entries;
      expect(entries.length).toBe(1);
      expect(entries[0]?.action).toBe('deleted_collection');
    });

    it('closes all tabs sourced from the deleted collection', async () => {
      // Open 2 tabs from col-1, 1 tab from col-2
      useCanvasStore.getState().openRequestTab({
        label: 'Get Users',
        name: 'Get Users',
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {},
        body: '',
        source: { type: 'collection', collectionId: 'col-1', requestId: 'req-1' },
      });
      useCanvasStore.getState().openRequestTab({
        label: 'Get Posts',
        name: 'Get Posts',
        method: 'GET',
        url: 'https://api.example.com/posts',
        headers: {},
        body: '',
        source: { type: 'collection', collectionId: 'col-1', requestId: 'req-2' },
      });
      useCanvasStore.getState().openRequestTab({
        label: 'Get Comments',
        name: 'Get Comments',
        method: 'GET',
        url: 'https://api.example.com/comments',
        headers: {},
        body: '',
        source: { type: 'collection', collectionId: 'col-2', requestId: 'req-3' },
      });

      await act(async () => {
        render(
          <CollectionEventProvider>
            <div />
          </CollectionEventProvider>
        );
      });

      act(() => {
        emitTauriEvent('collection:deleted', makeEnvelope({ id: 'col-1', name: 'Old API' }));
      });

      // col-1 tabs should be closed
      const source1 = { type: 'collection' as const, collectionId: 'col-1', requestId: 'req-1' };
      const source2 = { type: 'collection' as const, collectionId: 'col-1', requestId: 'req-2' };
      expect(useCanvasStore.getState().findContextBySource(source1)).toBeNull();
      expect(useCanvasStore.getState().findContextBySource(source2)).toBeNull();

      // col-2 tab should remain
      const source3 = { type: 'collection' as const, collectionId: 'col-2', requestId: 'req-3' };
      expect(useCanvasStore.getState().findContextBySource(source3)).not.toBeNull();
    });

    it('does not error when no tabs match the deleted collection', async () => {
      await act(async () => {
        render(
          <CollectionEventProvider>
            <div />
          </CollectionEventProvider>
        );
      });

      // Should not throw — no tabs open
      act(() => {
        emitTauriEvent('collection:deleted', makeEnvelope({ id: 'col-1', name: 'Old API' }));
      });

      expect(mockLoadCollections).toHaveBeenCalled();
    });

    it('clears selection when deleted collection was selected', async () => {
      mockCollectionState.selectedCollectionId = 'col-1';

      await act(async () => {
        render(
          <CollectionEventProvider>
            <div />
          </CollectionEventProvider>
        );
      });

      act(() => {
        emitTauriEvent('collection:deleted', makeEnvelope({ id: 'col-1', name: 'Old API' }));
      });

      expect(mockSelectCollection).toHaveBeenCalledWith(null);
    });
  });

  describe('request:added', () => {
    it('refreshes both collections and specific collection', async () => {
      await act(async () => {
        render(
          <CollectionEventProvider>
            <div />
          </CollectionEventProvider>
        );
      });

      act(() => {
        emitTauriEvent(
          'request:added',
          makeEnvelope({ collection_id: 'col-1', request_id: 'req-1', name: 'Get Users' })
        );
      });

      expect(mockLoadCollections).toHaveBeenCalled();
      expect(mockLoadCollection).toHaveBeenCalledWith('col-1');
    });

    it('records activity with request name', async () => {
      await act(async () => {
        render(
          <CollectionEventProvider>
            <div />
          </CollectionEventProvider>
        );
      });

      act(() => {
        emitTauriEvent(
          'request:added',
          makeEnvelope({ collection_id: 'col-1', request_id: 'req-1', name: 'Get Users' })
        );
      });

      const entries = useActivityStore.getState().entries;
      expect(entries.length).toBe(1);
      expect(entries[0]?.action).toBe('added_request');
      expect(entries[0]?.target).toBe('Get Users');
    });

    it('auto-selects collection when AI adds request with followAiMode on', async () => {
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
          'request:added',
          makeEnvelope({ collection_id: 'col-1', request_id: 'req-ai', name: 'AI Request' }, 'ai')
        );
      });

      expect(mockSelectCollection).toHaveBeenCalledWith('col-1');
    });
  });

  describe('request:updated', () => {
    it('refreshes the specific collection', async () => {
      await act(async () => {
        render(
          <CollectionEventProvider>
            <div />
          </CollectionEventProvider>
        );
      });

      act(() => {
        emitTauriEvent(
          'request:updated',
          makeEnvelope({ collection_id: 'col-1', request_id: 'req-1' })
        );
      });

      expect(mockLoadCollection).toHaveBeenCalledWith('col-1');
    });

    it('refreshes open tab request store when updated request is in a tab', async () => {
      // Open a tab that sources from col-1/req-1
      const contextId = useCanvasStore.getState().openRequestTab({
        label: 'Get Users',
        name: 'Get Users',
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: { Authorization: 'Bearer old-token' },
        body: '',
        source: { type: 'collection', collectionId: 'col-1', requestId: 'req-1' },
      });

      // Mock loadCollection to populate updated request data in the collections store
      mockLoadCollection.mockImplementationOnce(async (): Promise<void> => {
        mockCollectionState.collections = [
          {
            id: 'col-1',
            requests: [
              {
                id: 'req-1',
                name: 'Get Users',
                method: 'PUT',
                url: 'https://api.example.com/users/updated',
                headers: { Authorization: 'Bearer new-token' },
                body: { body_type: 'json', content: '{"updated": true}' },
              },
            ],
          },
        ];
      });

      await act(async () => {
        render(
          <CollectionEventProvider>
            <div />
          </CollectionEventProvider>
        );
      });

      await act(async () => {
        emitTauriEvent(
          'request:updated',
          makeEnvelope({ collection_id: 'col-1', request_id: 'req-1' })
        );
        // Allow loadCollection promise to resolve
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 10);
        });
      });

      // Verify the tab's request store was updated
      const requestState = useRequestStoreRaw.getState().contexts[contextId];
      expect(requestState?.method).toBe('PUT');
      expect(requestState?.url).toBe('https://api.example.com/users/updated');
      expect(requestState?.headers).toEqual({ Authorization: 'Bearer new-token' });
      expect(requestState?.body).toBe('{"updated": true}');
    });

    it('does NOT refresh tabs that are not sourced from the updated request', async () => {
      // Open a tab sourced from a different request
      const contextId = useCanvasStore.getState().openRequestTab({
        label: 'Other Request',
        name: 'Other Request',
        method: 'GET',
        url: 'https://api.example.com/other',
        headers: {},
        body: '',
        source: { type: 'collection', collectionId: 'col-1', requestId: 'req-2' },
      });

      await act(async () => {
        render(
          <CollectionEventProvider>
            <div />
          </CollectionEventProvider>
        );
      });

      act(() => {
        emitTauriEvent(
          'request:updated',
          makeEnvelope({ collection_id: 'col-1', request_id: 'req-1' })
        );
      });

      // Tab should be unchanged since it's sourced from req-2, not req-1
      const requestState = useRequestStoreRaw.getState().contexts[contextId];
      expect(requestState?.url).toBe('https://api.example.com/other');
    });

    it('records activity for updated request', async () => {
      await act(async () => {
        render(
          <CollectionEventProvider>
            <div />
          </CollectionEventProvider>
        );
      });

      act(() => {
        emitTauriEvent(
          'request:updated',
          makeEnvelope({ collection_id: 'col-1', request_id: 'req-1' })
        );
      });

      const entries = useActivityStore.getState().entries;
      expect(entries.length).toBe(1);
      expect(entries[0]?.action).toBe('updated_request');
    });
  });

  describe('request:executed', () => {
    it('records activity with status info', async () => {
      await act(async () => {
        render(
          <CollectionEventProvider>
            <div />
          </CollectionEventProvider>
        );
      });

      act(() => {
        emitTauriEvent(
          'request:executed',
          makeEnvelope({
            collection_id: 'col-1',
            request_id: 'req-1',
            status: 200,
            total_ms: 150,
          })
        );
      });

      const entries = useActivityStore.getState().entries;
      expect(entries.length).toBe(1);
      expect(entries[0]?.action).toBe('executed_request');
      expect(entries[0]?.target).toContain('200');
    });
  });

  describe('request:deleted', () => {
    it('refreshes the specific collection', async () => {
      await act(async () => {
        render(
          <CollectionEventProvider>
            <div />
          </CollectionEventProvider>
        );
      });

      act(() => {
        emitTauriEvent(
          'request:deleted',
          makeEnvelope({ collection_id: 'col-1', request_id: 'req-1', name: 'Old Request' })
        );
      });

      expect(mockLoadCollection).toHaveBeenCalledWith('col-1');
    });

    it('records activity for deleted request', async () => {
      await act(async () => {
        render(
          <CollectionEventProvider>
            <div />
          </CollectionEventProvider>
        );
      });

      act(() => {
        emitTauriEvent(
          'request:deleted',
          makeEnvelope({ collection_id: 'col-1', request_id: 'req-1', name: 'Old Request' })
        );
      });

      const entries = useActivityStore.getState().entries;
      expect(entries.length).toBe(1);
      expect(entries[0]?.action).toBe('deleted_request');
      expect(entries[0]?.target).toBe('Old Request');
      expect(entries[0]?.targetId).toBe('req-1');
    });

    it('clears selection when deleted request was selected', async () => {
      mockCollectionState.selectedCollectionId = 'col-1';
      mockCollectionState.selectedRequestId = 'req-1';

      await act(async () => {
        render(
          <CollectionEventProvider>
            <div />
          </CollectionEventProvider>
        );
      });

      act(() => {
        emitTauriEvent(
          'request:deleted',
          makeEnvelope({ collection_id: 'col-1', request_id: 'req-1', name: 'Old Request' })
        );
      });

      expect(mockSelectCollection).toHaveBeenCalledWith('col-1');
    });

    it('closes the tab for the deleted request', async () => {
      // Open a tab sourced from col-1/req-1
      useCanvasStore.getState().openRequestTab({
        label: 'Get Users',
        name: 'Get Users',
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {},
        body: '',
        source: { type: 'collection', collectionId: 'col-1', requestId: 'req-1' },
      });

      await act(async () => {
        render(
          <CollectionEventProvider>
            <div />
          </CollectionEventProvider>
        );
      });

      act(() => {
        emitTauriEvent(
          'request:deleted',
          makeEnvelope({ collection_id: 'col-1', request_id: 'req-1', name: 'Get Users' })
        );
      });

      // Tab should be closed
      const source = { type: 'collection' as const, collectionId: 'col-1', requestId: 'req-1' };
      expect(useCanvasStore.getState().findContextBySource(source)).toBeNull();
    });

    it('does not close tabs for other requests in same collection', async () => {
      // Open two tabs from the same collection
      useCanvasStore.getState().openRequestTab({
        label: 'Get Users',
        name: 'Get Users',
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {},
        body: '',
        source: { type: 'collection', collectionId: 'col-1', requestId: 'req-1' },
      });
      useCanvasStore.getState().openRequestTab({
        label: 'Get Posts',
        name: 'Get Posts',
        method: 'GET',
        url: 'https://api.example.com/posts',
        headers: {},
        body: '',
        source: { type: 'collection', collectionId: 'col-1', requestId: 'req-2' },
      });

      await act(async () => {
        render(
          <CollectionEventProvider>
            <div />
          </CollectionEventProvider>
        );
      });

      act(() => {
        emitTauriEvent(
          'request:deleted',
          makeEnvelope({ collection_id: 'col-1', request_id: 'req-1', name: 'Get Users' })
        );
      });

      // req-1 tab closed, req-2 tab remains
      const source1 = { type: 'collection' as const, collectionId: 'col-1', requestId: 'req-1' };
      const source2 = { type: 'collection' as const, collectionId: 'col-1', requestId: 'req-2' };
      expect(useCanvasStore.getState().findContextBySource(source1)).toBeNull();
      expect(useCanvasStore.getState().findContextBySource(source2)).not.toBeNull();
    });

    it('does not clear selection when a different request was deleted', async () => {
      mockCollectionState.selectedCollectionId = 'col-1';
      mockCollectionState.selectedRequestId = 'req-2';

      await act(async () => {
        render(
          <CollectionEventProvider>
            <div />
          </CollectionEventProvider>
        );
      });

      act(() => {
        emitTauriEvent(
          'request:deleted',
          makeEnvelope({ collection_id: 'col-1', request_id: 'req-1', name: 'Old Request' })
        );
      });

      expect(mockSelectCollection).not.toHaveBeenCalled();
    });
  });

  describe('actor attribution', () => {
    it('records AI actor type in activity entries', async () => {
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

      const entries = useActivityStore.getState().entries;
      expect(entries[0]?.actor.type).toBe('ai');
    });

    it('records user actor type in activity entries', async () => {
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
          makeEnvelope({ id: 'col-user', name: 'User Collection' }, 'user')
        );
      });

      const entries = useActivityStore.getState().entries;
      expect(entries[0]?.actor.type).toBe('user');
    });

    it('preserves Lamport timestamp in activity entries', async () => {
      await act(async () => {
        render(
          <CollectionEventProvider>
            <div />
          </CollectionEventProvider>
        );
      });

      act(() => {
        emitTauriEvent('collection:created', {
          actor: { type: 'ai' },
          timestamp: new Date().toISOString(),
          lamport: { participant: { type: 'ai' }, seq: 42 },
          payload: { id: 'col-1', name: 'Test' },
        });
      });

      const entries = useActivityStore.getState().entries;
      expect(entries[0]?.seq).toBe(42);
    });
  });

  describe('collection:refreshed', () => {
    it('calls setDriftResult with the refreshed payload', async () => {
      await act(async () => {
        render(
          <CollectionEventProvider>
            <div />
          </CollectionEventProvider>
        );
      });

      act(() => {
        emitTauriEvent(
          'collection:refreshed',
          makeEnvelope({
            collection_id: 'col-refresh',
            changed: true,
            operationsAdded: [],
            operationsRemoved: [{ method: 'DELETE', path: '/items/{id}' }],
            operationsChanged: [],
          })
        );
      });

      expect(mockSetDriftResult).toHaveBeenCalledWith('col-refresh', {
        changed: true,
        operationsAdded: [],
        operationsRemoved: [{ method: 'DELETE', path: '/items/{id}' }],
        operationsChanged: [],
      });
    });

    it('calls setDriftResult with changed: false when spec has no changes', async () => {
      await act(async () => {
        render(
          <CollectionEventProvider>
            <div />
          </CollectionEventProvider>
        );
      });

      act(() => {
        emitTauriEvent(
          'collection:refreshed',
          makeEnvelope({
            collection_id: 'col-no-change',
            changed: false,
            operationsAdded: [],
            operationsRemoved: [],
            operationsChanged: [],
          })
        );
      });

      expect(mockSetDriftResult).toHaveBeenCalledWith('col-no-change', {
        changed: false,
        operationsAdded: [],
        operationsRemoved: [],
        operationsChanged: [],
      });
    });
  });
});
