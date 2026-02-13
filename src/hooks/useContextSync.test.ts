/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContextSync } from './useContextSync';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useRequestStoreRaw } from '@/stores/useRequestStore';
import { globalEventBus } from '@/events/bus';
import type { HistoryEntry } from '@/types/generated/HistoryEntry';
import type { CollectionRequestSelectedPayload } from '@/events/bus';

describe('useContextSync', () => {
  const getActions = (): any => useRequestStoreRaw.getState();
  const getContext = (id: string): any => useRequestStoreRaw.getState().contexts[id];

  beforeEach(() => {
    // Reset both stores to clean state
    useCanvasStore.getState().reset();
    act(() => {
      useRequestStoreRaw.setState({ contexts: {} });
    });
    globalEventBus.removeAllListeners();
  });

  describe('Initialization', () => {
    it('should create a default request context on mount if none exist', () => {
      renderHook(() => {
        useContextSync();
      });

      const canvasState = useCanvasStore.getState();
      const requestContexts = canvasState.contextOrder.filter((id) => id.startsWith('request-'));
      expect(requestContexts).toHaveLength(1);
      expect(canvasState.activeContextId).toBe(requestContexts[0]);
    });

    it('should clean stale contextState entries on mount', () => {
      // Set up stale state in canvas store
      useCanvasStore.setState({
        contextState: new Map([
          ['stale-context', { method: 'GET', url: 'https://stale.com' }],
          ['active-context', { method: 'POST', url: 'https://active.com' }],
        ]),
        contexts: new Map([
          ['active-context', { id: 'active-context', label: 'Active', order: 1 } as any],
        ]),
        contextOrder: ['active-context'],
      });

      renderHook(() => {
        useContextSync();
      });

      const canvasState = useCanvasStore.getState();
      expect(canvasState.contextState.has('stale-context')).toBe(false);
      expect(canvasState.contextState.has('active-context')).toBe(true);
    });

    it('should load persisted active context into request store on mount', () => {
      const contextId = 'request-persisted';
      useCanvasStore.setState({
        contexts: new Map([[contextId, { id: contextId, contextType: 'request' } as any]]),
        contextOrder: [contextId],
        activeContextId: contextId,
        contextState: new Map([
          [
            contextId,
            {
              method: 'PATCH',
              url: 'https://persisted.api.com',
              headers: { 'X-Persisted': 'true' },
              body: '{"persisted": true}',
            },
          ],
        ]),
      });

      renderHook(() => {
        useContextSync();
      });

      const reqState = getContext(contextId);
      expect(reqState).toBeDefined();
      expect(reqState?.method).toBe('PATCH');
      expect(reqState?.url).toBe('https://persisted.api.com');
      expect(reqState?.headers).toEqual({ 'X-Persisted': 'true' });
      expect(reqState?.body).toBe('{"persisted": true}');
    });
  });

  describe('Context Switching', () => {
    it('should load incoming context state into request store when switching', () => {
      const context1Id = 'request-1';
      const context2Id = 'request-2';

      useCanvasStore.setState({
        contexts: new Map([
          [context1Id, { id: context1Id, contextType: 'request' } as any],
          [context2Id, { id: context2Id, contextType: 'request' } as any],
        ]),
        contextOrder: [context1Id, context2Id],
        activeContextId: context1Id,
        contextState: new Map([
          [context1Id, { method: 'GET', url: 'https://api.com/1' }],
          [context2Id, { method: 'POST', url: 'https://api.com/2' }],
        ]),
      });

      renderHook(() => {
        useContextSync();
      });

      // Initial state
      expect(getContext(context1Id)?.url).toBe('https://api.com/1');

      // Switch to context 2
      act(() => {
        useCanvasStore.getState().setActiveContext(context2Id);
      });

      expect(getContext(context2Id)?.method).toBe('POST');
      expect(getContext(context2Id)?.url).toBe('https://api.com/2');
    });
  });

  describe('Request Store Sync', () => {
    it('should sync request store changes to active context', () => {
      renderHook(() => {
        useContextSync();
      });

      const activeId = useCanvasStore.getState().activeContextId!;

      act(() => {
        getActions().setUrl(activeId, 'https://synced.com');
        getActions().setMethod(activeId, 'PATCH');
      });

      // Verification: Check if state in useRequestStoreRaw was updated correctly
      const reqState = useRequestStoreRaw.getState().contexts[activeId];
      expect(reqState?.url).toBe('https://synced.com');
      expect(reqState?.method).toBe('PATCH');
    });

    it('should sync response changes to active context', () => {
      renderHook(() => {
        useContextSync();
      });

      const activeId = useCanvasStore.getState().activeContextId!;
      const mockResponse = {
        status: 200,
        status_text: 'OK',
        headers: {},
        body: '{"ok":true}',
        timing: { total_ms: 100 } as any,
      };

      act(() => {
        getActions().setResponse(activeId, mockResponse as any);
      });

      const reqState = useRequestStoreRaw.getState().contexts[activeId];
      expect(reqState?.response).toEqual(mockResponse);
    });
  });

  describe('Event Handlers', () => {
    it('should open new context for history entry selection', () => {
      renderHook(() => {
        useContextSync();
      });

      const initialContextCount = useCanvasStore.getState().contextOrder.length;

      act(() => {
        globalEventBus.emit('history.entry-selected', {
          id: 'hist-1',
          timestamp: new Date().toISOString(),
          request: {
            url: 'https://api.example.com/history',
            method: 'GET',
            headers: {},
            body: null,
            timeout_ms: 30000,
          },
          response: {
            status: 200,
            status_text: 'OK',
            headers: {},
            body: '',
            timing: { total_ms: 50 } as any,
          },
        } as unknown as HistoryEntry);
      });

      expect(useCanvasStore.getState().contextOrder.length).toBe(initialContextCount + 1);
      const activeId = useCanvasStore.getState().activeContextId!;
      expect(getContext(activeId)?.url).toBe('https://api.example.com/history');
    });

    it('should activate existing context for duplicate history entry', () => {
      renderHook(() => {
        useContextSync();
      });

      const historyEntry = {
        id: 'hist-2',
        request: { url: 'https://api.example.com/repeat', method: 'POST' } as any,
      } as any;

      // First selection
      act(() => {
        globalEventBus.emit('history.entry-selected', historyEntry as unknown as HistoryEntry);
      });

      const activeIdAfterFirst = useCanvasStore.getState().activeContextId;

      // Create another context
      act(() => {
        useCanvasStore.getState().openRequestTab();
      });

      // Second selection of same entry
      act(() => {
        globalEventBus.emit('history.entry-selected', historyEntry as unknown as HistoryEntry);
      });

      expect(useCanvasStore.getState().activeContextId).toBe(activeIdAfterFirst);
    });

    it('should open new context for collection request selection', () => {
      renderHook(() => {
        useContextSync();
      });

      const initialContextCount = useCanvasStore.getState().contextOrder.length;

      act(() => {
        globalEventBus.emit<CollectionRequestSelectedPayload>('collection.request-selected', {
          collectionId: 'col-1',
          request: {
            id: 'req-1',
            name: 'List Users',
            method: 'GET',
            url: 'https://api.example.com/users',
            headers: {},
            body: null,
          } as any,
        });
      });

      expect(useCanvasStore.getState().contextOrder.length).toBe(initialContextCount + 1);
      const activeId = useCanvasStore.getState().activeContextId!;
      expect(getContext(activeId)?.url).toBe('https://api.example.com/users');
    });
  });
});
