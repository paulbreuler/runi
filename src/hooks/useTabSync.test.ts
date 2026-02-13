/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTabSync } from './useTabSync';
import { useTabStore } from '@/stores/useTabStore';
import { useRequestStoreRaw } from '@/stores/useRequestStore';
import { globalEventBus } from '@/events/bus';
import type { HistoryEntry } from '@/types/generated/HistoryEntry';
import type { CollectionRequestSelectedPayload } from '@/events/bus';

describe('useTabSync', () => {
  const getActions = (): any => useRequestStoreRaw.getState();
  const getContext = (id: string): any => useRequestStoreRaw.getState().contexts[id];

  beforeEach(() => {
    // Reset both stores to clean state
    useTabStore.setState({ tabs: {}, tabOrder: [], activeTabId: null });
    act(() => {
      useRequestStoreRaw.setState({ contexts: {} });
    });
    globalEventBus.removeAllListeners();
  });

  describe('initialization', () => {
    it('creates a default tab on mount when no tabs exist', () => {
      renderHook(() => {
        useTabSync();
      });

      const tabState = useTabStore.getState();
      expect(tabState.tabOrder).toHaveLength(1);
      expect(tabState.activeTabId).not.toBeNull();
    });

    it('loads persisted active tab into request store on mount', () => {
      // Pre-populate tab store with a persisted tab
      const tabId = 'persisted-tab-1';
      useTabStore.setState({
        tabs: {
          [tabId]: {
            id: tabId,
            label: '/users',
            method: 'POST',
            url: 'https://api.example.com/users',
            headers: { 'Content-Type': 'application/json' },
            body: '{"name":"test"}',
            response: null,
            isDirty: false,
            createdAt: Date.now(),
          },
        },
        tabOrder: [tabId],
        activeTabId: tabId,
      });

      renderHook(() => {
        useTabSync();
      });

      const reqState = getContext(tabId);
      expect(reqState).toBeDefined();
      expect(reqState?.method).toBe('POST');
      expect(reqState?.url).toBe('https://api.example.com/users');
      expect(reqState?.headers).toEqual({ 'Content-Type': 'application/json' });
      expect(reqState?.body).toBe('{"name":"test"}');
    });
  });

  describe('tab switching', () => {
    it('saves outgoing tab state and loads incoming tab state', () => {
      // Set up two tabs
      const tab1Id = 'tab-1';
      const tab2Id = 'tab-2';
      useTabStore.setState({
        tabs: {
          [tab1Id]: {
            id: tab1Id,
            label: 'Tab 1',
            method: 'GET',
            url: 'https://one.com',
            headers: {},
            body: '',
            response: null,
            isDirty: false,
            createdAt: Date.now(),
          },
          [tab2Id]: {
            id: tab2Id,
            label: 'Tab 2',
            method: 'DELETE',
            url: 'https://two.com',
            headers: { Authorization: 'Bearer xyz' },
            body: '',
            response: null,
            isDirty: false,
            createdAt: Date.now(),
          },
        },
        tabOrder: [tab1Id, tab2Id],
        activeTabId: tab1Id,
      });

      renderHook(() => {
        useTabSync();
      });

      // Keyed store should have tab1's data
      expect(getContext(tab1Id)?.url).toBe('https://one.com');

      // Edit request store (simulating user typing)
      act(() => {
        getActions().setUrl(tab1Id, 'https://one.com/edited');
      });

      // Switch to tab2
      act(() => {
        useTabStore.getState().setActiveTab(tab2Id);
      });

      // Keyed store should now have tab2's data
      expect(getContext(tab2Id)?.method).toBe('DELETE');
      expect(getContext(tab2Id)?.url).toBe('https://two.com');
      expect(getContext(tab2Id)?.headers).toEqual({ Authorization: 'Bearer xyz' });

      // Tab1 should have saved the edited URL
      const tab1 = useTabStore.getState().tabs[tab1Id];
      expect(tab1).toBeDefined();
      expect(tab1?.url).toBe('https://one.com/edited');
    });
  });

  describe('request store sync to tab', () => {
    it('syncs request store edits back to active tab', () => {
      renderHook(() => {
        useTabSync();
      });

      const activeId = useTabStore.getState().activeTabId!;

      act(() => {
        getActions().setUrl(activeId, 'https://synced.com');
      });

      const activeTab = useTabStore.getState().tabs[activeId];
      expect(activeTab).toBeDefined();
      expect(activeTab?.url).toBe('https://synced.com');
    });

    it('isDirty on collection tab edit', () => {
      renderHook(() => {
        useTabSync();
      });

      // Emit collection.request-selected to create a tab from a collection
      act(() => {
        globalEventBus.emit<CollectionRequestSelectedPayload>('collection.request-selected', {
          collectionId: 'col-1',
          request: {
            id: 'req-1',
            name: 'List Users',
            seq: 1,
            method: 'GET',
            url: 'https://api.example.com/users',
            headers: {},
            params: [],
            is_streaming: false,
            binding: { is_manual: false },
            intelligence: { ai_generated: false, verified: undefined },
            tags: [],
          },
        });
      });

      const activeId = useTabStore.getState().activeTabId!;
      const tabBeforeEdit = useTabStore.getState().tabs[activeId];
      expect(tabBeforeEdit?.isDirty).toBe(false);

      // Edit the tab via request store
      act(() => {
        getActions().setUrl(activeId, 'https://api.example.com/users/modified');
      });

      const tabAfterEdit = useTabStore.getState().tabs[activeId];
      expect(tabAfterEdit?.isDirty).toBe(true);
    });

    it('syncs response to active tab', () => {
      renderHook(() => {
        useTabSync();
      });

      const activeId = useTabStore.getState().activeTabId!;
      const mockResponse = {
        status: 200,
        status_text: 'OK',
        headers: {},
        body: '{"ok":true}',
        timing: {
          total_ms: 100,
          dns_ms: null,
          connect_ms: null,
          tls_ms: null,
          first_byte_ms: null,
        },
      };

      act(() => {
        getActions().setResponse(activeId, mockResponse);
      });

      const activeTab = useTabStore.getState().tabs[activeId];
      expect(activeTab).toBeDefined();
      expect(activeTab?.response).toEqual(mockResponse);
    });
  });

  describe('event handlers', () => {
    it('history.entry-selected opens a new tab', () => {
      renderHook(() => {
        useTabSync();
      });

      const initialTabCount = useTabStore.getState().tabOrder.length;

      act(() => {
        globalEventBus.emit<HistoryEntry>('history.entry-selected', {
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
            timing: {
              total_ms: 50,
              dns_ms: null,
              connect_ms: null,
              tls_ms: null,
              first_byte_ms: null,
            },
          },
        });
      });

      expect(useTabStore.getState().tabOrder.length).toBe(initialTabCount + 1);
      const activeId = useTabStore.getState().activeTabId!;
      // Keyed store should be loaded with the history entry data
      expect(getContext(activeId)?.url).toBe('https://api.example.com/history');
    });

    it('history.entry-selected activates existing tab for same entry', () => {
      renderHook(() => {
        useTabSync();
      });

      const historyEntry: HistoryEntry = {
        id: 'hist-2',
        timestamp: new Date().toISOString(),
        request: {
          url: 'https://api.example.com/repeat',
          method: 'POST',
          headers: {},
          body: null,
          timeout_ms: 30000,
        },
        response: {
          status: 201,
          status_text: 'Created',
          headers: {},
          body: '',
          timing: {
            total_ms: 50,
            dns_ms: null,
            connect_ms: null,
            tls_ms: null,
            first_byte_ms: null,
          },
        },
      };

      // First emission — opens new tab
      act(() => {
        globalEventBus.emit<HistoryEntry>('history.entry-selected', historyEntry);
      });

      const activeTabAfterFirst = useTabStore.getState().activeTabId;

      // Switch away
      act(() => {
        useTabStore.getState().openTab({ url: 'https://other.com' });
      });

      // Second emission of same entry — should NOT create a new tab
      act(() => {
        globalEventBus.emit<HistoryEntry>('history.entry-selected', historyEntry);
      });

      // Tab count should not have increased (beyond the one we opened manually)
      expect(useTabStore.getState().activeTabId).toBe(activeTabAfterFirst);
    });

    it('collection.request-selected opens a new tab', () => {
      renderHook(() => {
        useTabSync();
      });

      const initialTabCount = useTabStore.getState().tabOrder.length;

      act(() => {
        globalEventBus.emit<CollectionRequestSelectedPayload>('collection.request-selected', {
          collectionId: 'col-1',
          request: {
            id: 'req-1',
            name: 'List Users',
            seq: 1,
            method: 'GET',
            url: 'https://api.example.com/users',
            headers: {},
            params: [],
            is_streaming: false,
            binding: { is_manual: false },
            intelligence: { ai_generated: false, verified: undefined },
            tags: [],
          },
        });
      });

      expect(useTabStore.getState().tabOrder.length).toBe(initialTabCount + 1);
      const activeId = useTabStore.getState().activeTabId!;
      expect(getContext(activeId)?.url).toBe('https://api.example.com/users');
    });

    it('collection.request-selected activates existing tab for same request', () => {
      renderHook(() => {
        useTabSync();
      });

      const collectionPayload: CollectionRequestSelectedPayload = {
        collectionId: 'col-1',
        request: {
          id: 'req-1',
          name: 'List Users',
          seq: 1,
          method: 'GET',
          url: 'https://api.example.com/users',
          headers: {},
          params: [],
          is_streaming: false,
          binding: { is_manual: false },
          intelligence: { ai_generated: false, verified: undefined },
          tags: [],
        },
      };

      // First emission
      act(() => {
        globalEventBus.emit<CollectionRequestSelectedPayload>(
          'collection.request-selected',
          collectionPayload
        );
      });

      const activeAfterFirst = useTabStore.getState().activeTabId;

      // Switch away
      act(() => {
        useTabStore.getState().openTab({ url: 'https://other.com' });
      });

      // Second emission of same collection request
      act(() => {
        globalEventBus.emit<CollectionRequestSelectedPayload>(
          'collection.request-selected',
          collectionPayload
        );
      });

      expect(useTabStore.getState().activeTabId).toBe(activeAfterFirst);
    });
  });
});
