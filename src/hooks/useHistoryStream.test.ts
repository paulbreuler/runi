/**
 * @file useHistoryStream hook tests
 * @description Tests for real-time history event streaming
 *
 * TDD: RED phase - these tests will fail until the hook is implemented
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHistoryStream } from './useHistoryStream';
import type { HistoryEntry } from '@/types/generated/HistoryEntry';

// Mock event listener
type EventCallback = (event: { payload: unknown }) => void;
const listeners = new Map<string, EventCallback[]>();

// Mock Tauri event listener
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn((event: string, callback: EventCallback) => {
    if (!listeners.has(event)) {
      listeners.set(event, []);
    }
    listeners.get(event)!.push(callback);

    // Return unsubscribe function
    return Promise.resolve(() => {
      const eventListeners = listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    });
  }),
}));

// Helper to emit mock events
function emitEvent(eventName: string, payload: unknown): void {
  const eventListeners = listeners.get(eventName);
  if (eventListeners) {
    for (const callback of eventListeners) {
      callback({ payload });
    }
  }
}

// Mock history entry factory
function createMockEntry(id: string): HistoryEntry {
  return {
    id,
    timestamp: new Date().toISOString(),
    request: {
      url: `https://api.example.com/${id}`,
      method: 'GET',
      headers: {},
      body: null,
      timeout_ms: 30000,
    },
    response: {
      status: 200,
      status_text: 'OK',
      headers: {},
      body: '{}',
      timing: {
        total_ms: 100,
        dns_ms: 10,
        connect_ms: 20,
        tls_ms: 30,
        first_byte_ms: 25,
      },
    },
  };
}

describe('useHistoryStream', () => {
  beforeEach(() => {
    listeners.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('event subscription', () => {
    it('subscribes to history events on mount', async () => {
      const { unmount } = renderHook(() =>
        useHistoryStream({
          onNewEntry: vi.fn(),
        })
      );

      // Wait for async subscriptions to complete
      await waitFor(() => {
        expect(listeners.has('history:new')).toBe(true);
        expect(listeners.has('history:deleted')).toBe(true);
        expect(listeners.has('history:cleared')).toBe(true);
      });

      unmount();
    });

    it('unsubscribes from events on unmount', async () => {
      const { unmount } = renderHook(() =>
        useHistoryStream({
          onNewEntry: vi.fn(),
        })
      );

      // Wait for subscriptions to be set up
      await waitFor(() => {
        expect(listeners.get('history:new')?.length).toBe(1);
      });

      unmount();

      // Wait for cleanup
      await waitFor(() => {
        expect(listeners.get('history:new')?.length ?? 0).toBe(0);
      });
    });
  });

  describe('new entry handling', () => {
    it('calls onNewEntry when history:new event is received', async () => {
      const onNewEntry = vi.fn();
      renderHook(() => useHistoryStream({ onNewEntry }));

      const mockEntry = createMockEntry('new-1');

      await waitFor(() => {
        expect(listeners.get('history:new')?.length).toBe(1);
      });

      act(() => {
        emitEvent('history:new', mockEntry);
      });

      expect(onNewEntry).toHaveBeenCalledWith(mockEntry);
    });

    it('handles multiple new entries', async () => {
      const onNewEntry = vi.fn();
      renderHook(() => useHistoryStream({ onNewEntry }));

      await waitFor(() => {
        expect(listeners.get('history:new')?.length).toBe(1);
      });

      act(() => {
        emitEvent('history:new', createMockEntry('entry-1'));
        emitEvent('history:new', createMockEntry('entry-2'));
        emitEvent('history:new', createMockEntry('entry-3'));
      });

      expect(onNewEntry).toHaveBeenCalledTimes(3);
    });
  });

  describe('delete handling', () => {
    it('calls onDeleted when history:deleted event is received', async () => {
      const onDeleted = vi.fn();
      renderHook(() =>
        useHistoryStream({
          onNewEntry: vi.fn(),
          onDeleted,
        })
      );

      await waitFor(() => {
        expect(listeners.get('history:deleted')?.length).toBe(1);
      });

      act(() => {
        emitEvent('history:deleted', 'deleted-id');
      });

      expect(onDeleted).toHaveBeenCalledWith('deleted-id');
    });
  });

  describe('clear handling', () => {
    it('calls onCleared when history:cleared event is received', async () => {
      const onCleared = vi.fn();
      renderHook(() =>
        useHistoryStream({
          onNewEntry: vi.fn(),
          onCleared,
        })
      );

      await waitFor(() => {
        expect(listeners.get('history:cleared')?.length).toBe(1);
      });

      act(() => {
        emitEvent('history:cleared', null);
      });

      expect(onCleared).toHaveBeenCalled();
    });
  });

  describe('latest entry tracking', () => {
    it('tracks the latest entry received', async () => {
      const { result } = renderHook(() =>
        useHistoryStream({
          onNewEntry: vi.fn(),
        })
      );

      expect(result.current.latestEntry).toBeNull();

      const mockEntry = createMockEntry('latest-1');

      await waitFor(() => {
        expect(listeners.get('history:new')?.length).toBe(1);
      });

      act(() => {
        emitEvent('history:new', mockEntry);
      });

      expect(result.current.latestEntry).toEqual(mockEntry);
    });
  });

  describe('event count tracking', () => {
    it('tracks the count of events received', async () => {
      const { result } = renderHook(() =>
        useHistoryStream({
          onNewEntry: vi.fn(),
        })
      );

      expect(result.current.eventCount).toBe(0);

      await waitFor(() => {
        expect(listeners.get('history:new')?.length).toBe(1);
      });

      act(() => {
        emitEvent('history:new', createMockEntry('count-1'));
        emitEvent('history:new', createMockEntry('count-2'));
      });

      expect(result.current.eventCount).toBe(2);
    });
  });
});
