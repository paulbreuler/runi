/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file useCollectionEvents hook tests
 * @description Tests for the collection:refreshed event subscription.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCollectionEvents, type CollectionRefreshedEvent } from './useCollectionEvents';

type EventCallback = (event: { payload: unknown }) => void;
const listeners = new Map<string, EventCallback[]>();

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn((event: string, callback: EventCallback) => {
    if (!listeners.has(event)) {
      listeners.set(event, []);
    }
    listeners.get(event)!.push(callback);
    return Promise.resolve(() => {
      const arr = listeners.get(event);
      if (arr) {
        const idx = arr.indexOf(callback);
        if (idx > -1) {
          arr.splice(idx, 1);
        }
      }
    });
  }),
}));

function emitEvent(eventName: string, payload: unknown): void {
  const arr = listeners.get(eventName) ?? [];
  for (const cb of arr) {
    cb({ payload });
  }
}

describe('useCollectionEvents — collection:refreshed', () => {
  beforeEach(() => {
    listeners.clear();
  });

  afterEach(() => {
    listeners.clear();
  });

  it('calls onCollectionRefreshed when collection:refreshed event is emitted', async () => {
    const onCollectionRefreshed = vi.fn();

    renderHook(() => {
      useCollectionEvents({ onCollectionRefreshed });
    });

    // Wait for listeners to be set up
    await waitFor(() => {
      expect(listeners.has('collection:refreshed')).toBe(true);
    });

    const refreshedPayload: CollectionRefreshedEvent = {
      collection_id: 'col-123',
      changed: true,
      operationsAdded: [],
      operationsRemoved: [{ method: 'DELETE', path: '/users/{id}' }],
      operationsChanged: [],
    };

    // collection:refreshed is wrapped in EventEnvelope by the backend; simulate that here
    await act(async () => {
      emitEvent('collection:refreshed', {
        actor: { type: 'user' },
        timestamp: '2026-01-01T00:00:00Z',
        correlation_id: null,
        lamport: null,
        payload: refreshedPayload,
      });
    });

    expect(onCollectionRefreshed).toHaveBeenCalledTimes(1);
    expect(onCollectionRefreshed).toHaveBeenCalledWith(refreshedPayload);
  });

  it('does not call onCollectionRefreshed when callback is not provided', async () => {
    // Should not throw
    renderHook(() => {
      useCollectionEvents({});
    });

    await waitFor(() => {
      expect(listeners.has('collection:refreshed')).toBe(true);
    });

    const refreshedPayload: CollectionRefreshedEvent = {
      collection_id: 'col-123',
      changed: false,
      operationsAdded: [],
      operationsRemoved: [],
      operationsChanged: [],
    };

    await act(async () => {
      emitEvent('collection:refreshed', {
        actor: { type: 'user' },
        timestamp: '2026-01-01T00:00:00Z',
        correlation_id: null,
        lamport: null,
        payload: refreshedPayload,
      });
    });

    // No error thrown is sufficient
  });

  it('cleans up collection:refreshed listener on unmount', async () => {
    const onCollectionRefreshed = vi.fn();
    const { unmount } = renderHook(() => {
      useCollectionEvents({ onCollectionRefreshed });
    });

    await waitFor(() => {
      expect(listeners.has('collection:refreshed')).toBe(true);
      expect(listeners.get('collection:refreshed')!.length).toBeGreaterThan(0);
    });

    unmount();

    await waitFor(() => {
      expect(listeners.get('collection:refreshed')?.length ?? 0).toBe(0);
    });
  });
});
