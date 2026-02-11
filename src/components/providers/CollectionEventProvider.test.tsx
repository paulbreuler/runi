/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { CollectionEventProvider } from './CollectionEventProvider';
import { useActivityStore, __resetActivityIdCounter } from '@/stores/useActivityStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
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
    // Reset mutable state
    mockCollectionState.selectedCollectionId = null;
    mockCollectionState.expandedCollectionIds = new Set<string>();
  });

  it('subscribes to all 6 Tauri event channels on mount', async () => {
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
      'collection:saved',
      'request:added',
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
});
