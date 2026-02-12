/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useContextSync } from './useContextSync';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useRequestStore } from '@/stores/useRequestStore';
import { globalEventBus, type CollectionRequestSelectedPayload } from '@/events/bus';
import type { HistoryEntry } from '@/types/generated/HistoryEntry';

// Mock localStorage
const localStorageMock = ((): {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
} => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    removeItem: (key: string): void => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useContextSync', () => {
  beforeEach(() => {
    // Clear localStorage and reset stores
    localStorageMock.clear();
    act(() => {
      useCanvasStore.getState().reset();
      useRequestStore.getState().reset();
    });
  });

  describe('Initialization', () => {
    it('should create a default request context on mount if none exist', () => {
      renderHook(() => {
        useContextSync();
      });

      const canvasState = useCanvasStore.getState();
      const hasRequestContexts = canvasState.contextOrder.some((id) => id.startsWith('request-'));

      expect(hasRequestContexts).toBe(true);
      expect(canvasState.activeContextId).toMatch(/^request-/);
    });

    it('should clean stale contextState entries on mount', async () => {
      // Pre-populate stale persisted state (no matching contexts)
      act(() => {
        useCanvasStore.setState((state) => {
          const nextContextState = new Map(state.contextState);
          // Add 3 stale entries with no corresponding context descriptors
          nextContextState.set('request-stale-1', {
            method: 'GET',
            url: 'https://stale1.example.com',
            headers: {},
            body: '',
          });
          nextContextState.set('request-stale-2', {
            method: 'POST',
            url: 'https://stale2.example.com',
            headers: {},
            body: '',
          });
          nextContextState.set('request-stale-3', {
            method: 'DELETE',
            url: 'https://stale3.example.com',
            headers: {},
            body: '',
          });
          return { ...state, contextState: nextContextState };
        });
      });

      // Verify stale entries exist before mounting
      expect(useCanvasStore.getState().contextState.size).toBe(3);

      // Mount the sync hook - it should clean up stale entries
      renderHook(() => {
        useContextSync();
      });

      // Wait for cleanup to complete
      await waitFor(() => {
        const canvasState = useCanvasStore.getState();
        // All stale entries should be removed, and a fresh default tab created
        const staleEntries = Array.from(canvasState.contextState.keys()).filter(
          (id) => id === 'request-stale-1' || id === 'request-stale-2' || id === 'request-stale-3'
        );
        expect(staleEntries).toHaveLength(0);
        // Should have 1 context: 1 fresh tab (template is in templates Map, not contextOrder)
        expect(canvasState.contextOrder.length).toBe(1);
        // Should have 1 contextState entry (the fresh tab; template has no state)
        expect(canvasState.contextState.size).toBe(1);
        // Verify the remaining state is for a fresh request tab
        const remainingIds = Array.from(canvasState.contextState.keys());
        expect(remainingIds[0]).toMatch(/^request-/);
        expect(remainingIds[0]).not.toBe('request'); // Not the template
      });
    });

    it('should load persisted active context into request store on mount', () => {
      // Pre-populate a request context
      act(() => {
        const contextId = useCanvasStore.getState().openRequestTab({
          method: 'POST',
          url: 'https://api.example.com',
          headers: { 'Content-Type': 'application/json' },
          body: '{"test": true}',
        });
        useCanvasStore.getState().setActiveContext(contextId);
      });

      // Now mount the sync hook
      renderHook(() => {
        useContextSync();
      });

      const reqState = useRequestStore.getState();
      expect(reqState.method).toBe('POST');
      expect(reqState.url).toBe('https://api.example.com');
      expect(reqState.headers).toEqual({ 'Content-Type': 'application/json' });
      expect(reqState.body).toBe('{"test": true}');
    });
  });

  describe('Context Switching', () => {
    it('should save outgoing context state when switching contexts', async () => {
      renderHook(() => {
        useContextSync();
      });

      const canvasStore = useCanvasStore.getState();
      const context1 = canvasStore.activeContextId;

      // Modify request store
      act(() => {
        useRequestStore.getState().setMethod('POST');
        useRequestStore.getState().setUrl('https://api.example.com');
      });

      // Create and switch to a new context
      let context2 = '';
      act(() => {
        context2 = canvasStore.openRequestTab({ method: 'GET', url: 'https://example.com' });
        canvasStore.setActiveContext(context2);
      });

      // Wait for sync to complete
      await waitFor(() => {
        const context1State = canvasStore.getContextState(context1 ?? '');
        expect(context1State.method).toBe('POST');
        expect(context1State.url).toBe('https://api.example.com');
      });
    });

    it('should load incoming context state into request store when switching', () => {
      renderHook(() => {
        useContextSync();
      });

      const canvasStore = useCanvasStore.getState();

      // Create a second context with specific state
      let context2 = '';
      act(() => {
        context2 = canvasStore.openRequestTab({
          method: 'DELETE',
          url: 'https://api.example.com/users/123',
          headers: { Authorization: 'Bearer token' },
          body: '',
        });
      });

      // Switch to the new context
      act(() => {
        canvasStore.setActiveContext(context2);
      });

      // Verify request store was updated
      const reqState = useRequestStore.getState();
      expect(reqState.method).toBe('DELETE');
      expect(reqState.url).toBe('https://api.example.com/users/123');
      expect(reqState.headers).toEqual({ Authorization: 'Bearer token' });
    });
  });

  describe('Request Store Sync', () => {
    it('should sync request store changes to active context', async () => {
      renderHook(() => {
        useContextSync();
      });

      const canvasStore = useCanvasStore.getState();
      const contextId = canvasStore.activeContextId;

      // Modify request store
      act(() => {
        useRequestStore.getState().setMethod('PATCH');
        useRequestStore.getState().setUrl('https://api.example.com/users');
        useRequestStore.getState().setHeaders({ 'X-Custom': 'value' });
        useRequestStore.getState().setBody('{"name": "John"}');
      });

      // Wait for sync to complete
      await waitFor(() => {
        const contextState = canvasStore.getContextState(contextId ?? '');
        expect(contextState.method).toBe('PATCH');
        expect(contextState.url).toBe('https://api.example.com/users');
        expect(contextState.headers).toEqual({ 'X-Custom': 'value' });
        expect(contextState.body).toBe('{"name": "John"}');
      });
    });

    it('should sync response changes to active context', async () => {
      renderHook(() => {
        useContextSync();
      });

      const canvasStore = useCanvasStore.getState();
      const contextId = canvasStore.activeContextId;

      const mockResponse = {
        status: 200,
        status_text: 'OK',
        headers: {},
        body: '{"success": true}',
        timing: {
          total_ms: 123,
          dns_ms: null,
          connect_ms: null,
          tls_ms: null,
          first_byte_ms: null,
        },
      };

      // Set response in request store
      act(() => {
        useRequestStore.getState().setResponse(mockResponse);
      });

      // Wait for sync to complete
      await waitFor(() => {
        const contextState = canvasStore.getContextState(contextId ?? '');
        expect(contextState.response).toEqual(mockResponse);
      });
    });

    it('should mark context as dirty when source exists and changes are made', async () => {
      renderHook(() => {
        useContextSync();
      });

      const canvasStore = useCanvasStore.getState();

      // Create a context with a source
      let contextId = '';
      act(() => {
        contextId = canvasStore.openRequestTab({
          method: 'GET',
          url: 'https://api.example.com',
          source: {
            type: 'collection',
            collectionId: 'col-123',
            requestId: 'req-456',
          },
        });
        canvasStore.setActiveContext(contextId);
      });

      // Modify request store
      act(() => {
        useRequestStore.getState().setMethod('POST');
      });

      // Wait for sync to complete
      await waitFor(() => {
        const contextState = canvasStore.getContextState(contextId);
        expect(contextState.isDirty).toBe(true);
      });
    });
  });

  describe('Event Handlers', () => {
    it('should open new context for history entry selection', async () => {
      renderHook(() => {
        useContextSync();
      });

      const mockEntry: HistoryEntry = {
        id: 'entry-123',
        timestamp: new Date().toISOString(),
        request: {
          method: 'GET',
          url: 'https://api.example.com/users',
          headers: {},
          body: null,
          timeout_ms: 30000,
        },
        response: {
          status: 200,
          status_text: 'OK',
          headers: {},
          body: '[]',
          timing: {
            total_ms: 100,
            dns_ms: null,
            connect_ms: null,
            tls_ms: null,
            first_byte_ms: null,
          },
        },
      };

      act(() => {
        globalEventBus.emit('history.entry-selected', mockEntry);
      });

      await waitFor(() => {
        const canvasStore = useCanvasStore.getState();
        const contextId = canvasStore.findContextBySource({
          type: 'history',
          historyEntryId: 'entry-123',
        });

        expect(contextId).not.toBeNull();
        expect(canvasStore.activeContextId).toBe(contextId);
      });
    });

    it('should activate existing context for duplicate history entry', async () => {
      renderHook(() => {
        useContextSync();
      });

      const mockEntry: HistoryEntry = {
        id: 'entry-123',
        timestamp: new Date().toISOString(),
        request: {
          method: 'GET',
          url: 'https://api.example.com/users',
          headers: {},
          body: null,
          timeout_ms: 30000,
        },
        response: {
          status: 200,
          status_text: 'OK',
          headers: {},
          body: '[]',
          timing: {
            total_ms: 100,
            dns_ms: null,
            connect_ms: null,
            tls_ms: null,
            first_byte_ms: null,
          },
        },
      };

      // Emit event twice
      act(() => {
        globalEventBus.emit('history.entry-selected', mockEntry);
      });

      await waitFor(() => {
        const canvasStore = useCanvasStore.getState();
        const contextId = canvasStore.findContextBySource({
          type: 'history',
          historyEntryId: 'entry-123',
        });
        expect(contextId).not.toBeNull();
      });

      const contextCountBefore = useCanvasStore
        .getState()
        .contextOrder.filter((id) => id.startsWith('request-')).length;

      act(() => {
        globalEventBus.emit('history.entry-selected', mockEntry);
      });

      // Should not create a new context
      await waitFor(() => {
        const contextCountAfter = useCanvasStore
          .getState()
          .contextOrder.filter((id) => id.startsWith('request-')).length;
        expect(contextCountAfter).toBe(contextCountBefore);
      });
    });

    it('should open new context for collection request selection', async () => {
      renderHook(() => {
        useContextSync();
      });

      const mockPayload: CollectionRequestSelectedPayload = {
        collectionId: 'col-123',
        request: {
          id: 'req-456',
          name: 'Get Users',
          seq: 0,
          method: 'GET',
          url: 'https://api.example.com/users',
          headers: {},
          params: [],
          is_streaming: false,
          binding: { is_manual: false },
          intelligence: { ai_generated: false },
          tags: [],
        },
      };

      act(() => {
        globalEventBus.emit('collection.request-selected', mockPayload);
      });

      await waitFor(() => {
        const canvasStore = useCanvasStore.getState();
        const contextId = canvasStore.findContextBySource({
          type: 'collection',
          collectionId: 'col-123',
          requestId: 'req-456',
        });

        expect(contextId).not.toBeNull();
        expect(canvasStore.activeContextId).toBe(contextId);
      });
    });

    it('should activate existing context for duplicate collection request', async () => {
      renderHook(() => {
        useContextSync();
      });

      const mockPayload: CollectionRequestSelectedPayload = {
        collectionId: 'col-123',
        request: {
          id: 'req-456',
          name: 'Get Users',
          seq: 0,
          method: 'GET',
          url: 'https://api.example.com/users',
          headers: {},
          params: [],
          is_streaming: false,
          binding: { is_manual: false },
          intelligence: { ai_generated: false },
          tags: [],
        },
      };

      // Emit event twice
      act(() => {
        globalEventBus.emit('collection.request-selected', mockPayload);
      });

      await waitFor(() => {
        const canvasStore = useCanvasStore.getState();
        const contextId = canvasStore.findContextBySource({
          type: 'collection',
          collectionId: 'col-123',
          requestId: 'req-456',
        });
        expect(contextId).not.toBeNull();
      });

      const contextCountBefore = useCanvasStore
        .getState()
        .contextOrder.filter((id) => id.startsWith('request-')).length;

      act(() => {
        globalEventBus.emit('collection.request-selected', mockPayload);
      });

      // Should not create a new context
      await waitFor(() => {
        const contextCountAfter = useCanvasStore
          .getState()
          .contextOrder.filter((id) => id.startsWith('request-')).length;
        expect(contextCountAfter).toBe(contextCountBefore);
      });
    });

    it('should open a new context when source matches only stale persisted state', async () => {
      renderHook(() => {
        useContextSync();
      });

      const staleSource = {
        type: 'collection' as const,
        collectionId: 'col-stale',
        requestId: 'req-stale',
      };

      act(() => {
        useCanvasStore.setState((state) => {
          const nextContextState = new Map(state.contextState);
          nextContextState.set('request-stale', {
            source: staleSource,
            method: 'GET',
            url: 'https://stale.example.com',
            headers: {},
            body: '',
          });
          return { ...state, contextState: nextContextState };
        });
      });

      const requestContextCountBefore = useCanvasStore
        .getState()
        .contextOrder.filter((id) => id.startsWith('request-')).length;

      const payload: CollectionRequestSelectedPayload = {
        collectionId: 'col-stale',
        request: {
          id: 'req-stale',
          name: 'Stale Source Request',
          seq: 0,
          method: 'GET',
          url: 'https://api.example.com/stale',
          headers: {},
          params: [],
          is_streaming: false,
          binding: { is_manual: false },
          intelligence: { ai_generated: false },
          tags: [],
        },
      };

      act(() => {
        globalEventBus.emit('collection.request-selected', payload);
      });

      // Stale persisted source entries must be ignored, so a new tab opens.
      await waitFor(() => {
        const canvasStore = useCanvasStore.getState();
        const requestContextCountAfter = canvasStore.contextOrder.filter((id) =>
          id.startsWith('request-')
        ).length;

        expect(requestContextCountAfter).toBe(requestContextCountBefore + 1);
        expect(canvasStore.activeContextId).not.toBe('request-stale');
        expect(canvasStore.activeContextId).toMatch(/^request-/);
      });
    });

    it('should open new contexts even when many stale persisted sources exist', async () => {
      renderHook(() => {
        useContextSync();
      });

      act(() => {
        useCanvasStore.setState((state) => {
          const nextContextState = new Map(state.contextState);

          for (let i = 1; i <= 10; i += 1) {
            nextContextState.set(`request-stale-${String(i)}`, {
              source: {
                type: 'collection',
                collectionId: 'col-httpbin',
                requestId: `req-${String(i)}`,
              },
              method: 'GET',
              url: `https://stale.example.com/${String(i)}`,
              headers: {},
              body: '',
            });
          }

          return { ...state, contextState: nextContextState };
        });
      });

      const requestContextCountBefore = useCanvasStore
        .getState()
        .contextOrder.filter((id) => id.startsWith('request-')).length;

      for (let i = 1; i <= 12; i += 1) {
        act(() => {
          globalEventBus.emit('collection.request-selected', {
            collectionId: 'col-httpbin',
            request: {
              id: `req-${String(i)}`,
              name: `Request ${String(i)}`,
              seq: i,
              method: 'GET',
              url: `https://httpbin.org/anything/${String(i)}`,
              headers: {},
              params: [],
              is_streaming: false,
              binding: { is_manual: false },
              intelligence: { ai_generated: false },
              tags: [],
            },
          } satisfies CollectionRequestSelectedPayload);
        });
      }

      await waitFor(() => {
        const canvasStore = useCanvasStore.getState();
        const requestContextCountAfter = canvasStore.contextOrder.filter((id) =>
          id.startsWith('request-')
        ).length;
        expect(requestContextCountAfter).toBe(requestContextCountBefore + 12);
      });
    });
  });
});
