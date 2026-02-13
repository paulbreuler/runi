/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTabStore } from './useTabStore';
import { useRequestStoreRaw } from './useRequestStore';
import { deriveTabLabel } from '@/types/tab';
import { globalEventBus } from '@/events/bus';

// Mock crypto.randomUUID for deterministic tests
let uuidCounter = 0;
vi.stubGlobal(
  'crypto',
  Object.assign({}, globalThis.crypto, {
    randomUUID: () => `test-uuid-${String(++uuidCounter).padStart(3, '0')}`,
  })
);

describe('useTabStore', () => {
  beforeEach(() => {
    uuidCounter = 0;
    // Reset stores to initial state
    act(() => {
      useTabStore.getState().closeAllTabs();
      useTabStore.setState({ tabs: {}, tabOrder: [], activeTabId: null });
      useRequestStoreRaw.setState({ contexts: {} });
    });
  });

  describe('initial state', () => {
    it('starts with no tabs and null activeTabId', () => {
      const { result } = renderHook(() => useTabStore());
      expect(Object.keys(result.current.tabs)).toHaveLength(0);
      expect(result.current.tabOrder).toHaveLength(0);
      expect(result.current.activeTabId).toBeNull();
    });
  });

  describe('openTab', () => {
    it('creates a tab with UUID, adds to tabOrder, and sets as active', () => {
      const { result } = renderHook(() => useTabStore());

      let tabId = '';
      act(() => {
        tabId = result.current.openTab();
      });

      expect(tabId).toMatch(/^test-uuid-\d+$/);
      expect(result.current.tabs[tabId]).toBeDefined();
      expect(result.current.tabOrder).toEqual([tabId]);
      expect(result.current.activeTabId).toBe(tabId);
    });

    it('creates tab with default values', () => {
      const { result } = renderHook(() => useTabStore());

      let tabId = '';
      act(() => {
        tabId = result.current.openTab();
      });

      const tab = result.current.tabs[tabId];
      expect(tab).toBeDefined();
      if (tab === undefined) {
        return;
      }
      expect(tab.method).toBe('GET');
      expect(tab.url).toBe('');
      expect(tab.label).toBe('New Request');
      expect(tab.headers).toEqual({});
      expect(tab.body).toBe('');
      expect(tab.response).toBeNull();
      expect(tab.isDirty).toBe(false);
      expect(tab.source).toBeUndefined();
      expect(tab.createdAt).toBeGreaterThan(0);
    });

    it('populates method/url/headers/body from partial', () => {
      const { result } = renderHook(() => useTabStore());

      let tabId = '';
      act(() => {
        tabId = result.current.openTab({
          method: 'POST',
          url: 'https://api.example.com/users',
          headers: { 'Content-Type': 'application/json' },
          body: '{"name": "test"}',
          label: 'Create User',
          source: { type: 'collection', collectionId: 'c1', requestId: 'r1' },
        });
      });

      const tab = result.current.tabs[tabId];
      expect(tab).toBeDefined();
      if (tab === undefined) {
        return;
      }
      expect(tab.method).toBe('POST');
      expect(tab.url).toBe('https://api.example.com/users');
      expect(tab.headers).toEqual({ 'Content-Type': 'application/json' });
      expect(tab.body).toBe('{"name": "test"}');
      expect(tab.label).toBe('Create User');
      expect(tab.source).toEqual({ type: 'collection', collectionId: 'c1', requestId: 'r1' });
    });

    it('enforces tab limit of 20 and emits toast', () => {
      const { result } = renderHook(() => useTabStore());
      const toastSpy = vi.fn();
      const unsub = globalEventBus.on('toast.show', toastSpy);

      // Open 20 tabs
      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.openTab({ url: `https://api.example.com/${String(i)}` });
        }
      });

      expect(Object.keys(result.current.tabs)).toHaveLength(20);

      // 21st tab should fail
      act(() => {
        result.current.openTab({ url: 'https://api.example.com/21' });
      });

      expect(Object.keys(result.current.tabs)).toHaveLength(20);
      expect(toastSpy).toHaveBeenCalledTimes(1);

      unsub();
    });

    it('appends new tabs to the end of tabOrder', () => {
      const { result } = renderHook(() => useTabStore());

      let id1 = '';
      let id2 = '';
      let id3 = '';
      act(() => {
        id1 = result.current.openTab({ url: 'https://one.com' });
        id2 = result.current.openTab({ url: 'https://two.com' });
        id3 = result.current.openTab({ url: 'https://three.com' });
      });

      expect(result.current.tabOrder).toEqual([id1, id2, id3]);
    });
  });

  describe('closeTab', () => {
    it('removes tab from tabs and tabOrder', () => {
      const { result } = renderHook(() => useTabStore());

      let id1 = '';
      let id2 = '';
      act(() => {
        id1 = result.current.openTab({ url: 'https://one.com' });
        id2 = result.current.openTab({ url: 'https://two.com' });
      });

      act(() => {
        result.current.closeTab(id1);
      });

      expect(result.current.tabs[id1]).toBeUndefined();
      expect(result.current.tabOrder).toEqual([id2]);
    });

    it('activates next tab when closing active tab', () => {
      const { result } = renderHook(() => useTabStore());

      let id2 = '';
      let id3 = '';
      act(() => {
        result.current.openTab({ url: 'https://one.com' });
        id2 = result.current.openTab({ url: 'https://two.com' });
        id3 = result.current.openTab({ url: 'https://three.com' });
        result.current.setActiveTab(id2);
      });

      act(() => {
        result.current.closeTab(id2);
      });

      // Should activate the next tab (id3)
      expect(result.current.activeTabId).toBe(id3);
    });

    it('activates previous tab when closing last tab in order', () => {
      const { result } = renderHook(() => useTabStore());

      let id1 = '';
      let id2 = '';
      act(() => {
        id1 = result.current.openTab({ url: 'https://one.com' });
        id2 = result.current.openTab({ url: 'https://two.com' });
      });

      // id2 is active (last opened)
      expect(result.current.activeTabId).toBe(id2);

      act(() => {
        result.current.closeTab(id2);
      });

      expect(result.current.activeTabId).toBe(id1);
    });

    it('auto-opens new empty tab when closing the last remaining tab', () => {
      const { result } = renderHook(() => useTabStore());

      let id1 = '';
      act(() => {
        id1 = result.current.openTab({ url: 'https://one.com' });
      });

      act(() => {
        result.current.closeTab(id1);
      });

      // Should have created a new empty tab
      expect(Object.keys(result.current.tabs)).toHaveLength(1);
      expect(result.current.activeTabId).not.toBeNull();
      const activeTabId = result.current.activeTabId;
      if (activeTabId === null) {
        return;
      }
      const newTab = result.current.tabs[activeTabId];
      expect(newTab).toBeDefined();
      if (newTab === undefined) {
        return;
      }
      expect(newTab.url).toBe('');
      expect(newTab.label).toBe('New Request');
    });

    it('does not change active tab when closing an inactive tab', () => {
      const { result } = renderHook(() => useTabStore());

      let id1 = '';
      let id2 = '';
      let id3 = '';
      act(() => {
        id1 = result.current.openTab({ url: 'https://one.com' });
        id2 = result.current.openTab({ url: 'https://two.com' });
        id3 = result.current.openTab({ url: 'https://three.com' });
      });

      // id3 is active (last opened)
      expect(result.current.activeTabId).toBe(id3);

      act(() => {
        result.current.closeTab(id1);
      });

      expect(result.current.activeTabId).toBe(id3);
      expect(result.current.tabOrder).toEqual([id2, id3]);
    });
  });

  describe('setActiveTab', () => {
    it('updates activeTabId', () => {
      const { result } = renderHook(() => useTabStore());

      let id1 = '';
      act(() => {
        id1 = result.current.openTab({ url: 'https://one.com' });
        result.current.openTab({ url: 'https://two.com' });
      });

      act(() => {
        result.current.setActiveTab(id1);
      });

      expect(result.current.activeTabId).toBe(id1);
    });
  });

  describe('updateTab', () => {
    it('merges patch into existing tab', () => {
      const { result } = renderHook(() => useTabStore());

      let tabId = '';
      act(() => {
        tabId = result.current.openTab({ url: 'https://api.example.com', method: 'GET' });
      });

      act(() => {
        result.current.updateTab(tabId, { url: 'https://api.example.com/v2', method: 'POST' });
      });

      const tab = result.current.tabs[tabId];
      expect(tab).toBeDefined();
      if (tab === undefined) {
        return;
      }
      expect(tab.url).toBe('https://api.example.com/v2');
      expect(tab.method).toBe('POST');
    });

    it('sets isDirty flag', () => {
      const { result } = renderHook(() => useTabStore());

      let tabId = '';
      act(() => {
        tabId = result.current.openTab();
      });

      let tab = result.current.tabs[tabId];
      expect(tab).toBeDefined();
      if (tab === undefined) {
        return;
      }
      expect(tab.isDirty).toBe(false);

      act(() => {
        result.current.updateTab(tabId, { isDirty: true });
      });

      tab = result.current.tabs[tabId];
      expect(tab).toBeDefined();
      if (tab === undefined) {
        return;
      }
      expect(tab.isDirty).toBe(true);
    });

    it('ignores update for non-existent tab', () => {
      const { result } = renderHook(() => useTabStore());

      act(() => {
        result.current.openTab();
      });

      // Should not throw
      act(() => {
        result.current.updateTab('non-existent-id', { url: 'https://test.com' });
      });

      // Store should be unchanged
      expect(Object.keys(result.current.tabs)).toHaveLength(1);
    });
  });

  describe('reorderTab', () => {
    it('moves tab to new position in tabOrder', () => {
      const { result } = renderHook(() => useTabStore());

      let id1 = '';
      let id2 = '';
      let id3 = '';
      act(() => {
        id1 = result.current.openTab({ label: 'First' });
        id2 = result.current.openTab({ label: 'Second' });
        id3 = result.current.openTab({ label: 'Third' });
      });

      expect(result.current.tabOrder).toEqual([id1, id2, id3]);

      // Move first to last
      act(() => {
        result.current.reorderTab(id1, 2);
      });

      expect(result.current.tabOrder).toEqual([id2, id3, id1]);
    });

    it('moves tab to the beginning', () => {
      const { result } = renderHook(() => useTabStore());

      let id1 = '';
      let id2 = '';
      let id3 = '';
      act(() => {
        id1 = result.current.openTab({ label: 'First' });
        id2 = result.current.openTab({ label: 'Second' });
        id3 = result.current.openTab({ label: 'Third' });
      });

      act(() => {
        result.current.reorderTab(id3, 0);
      });

      expect(result.current.tabOrder).toEqual([id3, id1, id2]);
    });
  });

  describe('findTabBySource', () => {
    it('finds tab by collection source (collectionId + requestId)', () => {
      const { result } = renderHook(() => useTabStore());

      let tabId = '';
      act(() => {
        tabId = result.current.openTab({
          url: 'https://api.example.com/users',
          source: { type: 'collection', collectionId: 'col-1', requestId: 'req-1' },
        });
      });

      const found = result.current.findTabBySource({
        type: 'collection',
        collectionId: 'col-1',
        requestId: 'req-1',
      });

      expect(found).toBe(tabId);
    });

    it('finds tab by history source (historyEntryId)', () => {
      const { result } = renderHook(() => useTabStore());

      let tabId = '';
      act(() => {
        tabId = result.current.openTab({
          url: 'https://api.example.com/users',
          source: { type: 'history', historyEntryId: 'hist-42' },
        });
      });

      const found = result.current.findTabBySource({
        type: 'history',
        historyEntryId: 'hist-42',
      });

      expect(found).toBe(tabId);
    });

    it('returns null when no matching tab exists', () => {
      const { result } = renderHook(() => useTabStore());

      act(() => {
        result.current.openTab({ url: 'https://api.example.com/users' });
      });

      const found = result.current.findTabBySource({
        type: 'collection',
        collectionId: 'col-999',
        requestId: 'req-999',
      });

      expect(found).toBeNull();
    });

    it('does not match tabs without a source', () => {
      const { result } = renderHook(() => useTabStore());

      act(() => {
        result.current.openTab({ url: 'https://api.example.com' });
      });

      const found = result.current.findTabBySource({
        type: 'collection',
        collectionId: 'col-1',
        requestId: 'req-1',
      });

      expect(found).toBeNull();
    });
  });

  describe('closeOtherTabs', () => {
    it('keeps only the specified tab', () => {
      const { result } = renderHook(() => useTabStore());

      let id1 = '';
      act(() => {
        id1 = result.current.openTab({ label: 'Keep' });
        result.current.openTab({ label: 'Remove 1' });
        result.current.openTab({ label: 'Remove 2' });
      });

      act(() => {
        result.current.closeOtherTabs(id1);
      });

      expect(Object.keys(result.current.tabs)).toHaveLength(1);
      expect(result.current.tabs[id1]).toBeDefined();
      expect(result.current.tabOrder).toEqual([id1]);
      expect(result.current.activeTabId).toBe(id1);
    });
  });

  describe('closeAllTabs', () => {
    it('closes all tabs and auto-opens a new empty tab', () => {
      const { result } = renderHook(() => useTabStore());

      act(() => {
        result.current.openTab({ url: 'https://one.com' });
        result.current.openTab({ url: 'https://two.com' });
        result.current.openTab({ url: 'https://three.com' });
      });

      act(() => {
        result.current.closeAllTabs();
      });

      expect(Object.keys(result.current.tabs)).toHaveLength(1);
      expect(result.current.activeTabId).not.toBeNull();
      const activeTabId = result.current.activeTabId;
      if (activeTabId === null) {
        return;
      }
      const newTab = result.current.tabs[activeTabId];
      expect(newTab).toBeDefined();
      if (newTab === undefined) {
        return;
      }
      expect(newTab.url).toBe('');
      expect(newTab.label).toBe('New Request');
    });
  });

  describe('getActiveTab', () => {
    it('returns the active tab state', () => {
      const { result } = renderHook(() => useTabStore());

      act(() => {
        result.current.openTab({ url: 'https://api.example.com', method: 'POST' });
      });

      const activeTab = result.current.getActiveTab();
      expect(activeTab).not.toBeNull();
      expect(activeTab!.url).toBe('https://api.example.com');
      expect(activeTab!.method).toBe('POST');
    });

    it('returns null when no active tab', () => {
      const activeTab = useTabStore.getState().getActiveTab();
      expect(activeTab).toBeNull();
    });
  });

  describe('singleton behavior', () => {
    it('maintains state across multiple hook instances', () => {
      const { result: r1 } = renderHook(() => useTabStore());

      let tabId = '';
      act(() => {
        tabId = r1.current.openTab({ url: 'https://shared.com', method: 'DELETE' });
      });

      const { result: r2 } = renderHook(() => useTabStore());
      const tab = r2.current.tabs[tabId];
      expect(tab).toBeDefined();
      if (tab === undefined) {
        return;
      }
      expect(tab.url).toBe('https://shared.com');
      expect(tab.method).toBe('DELETE');
    });
  });
});

describe('deriveTabLabel', () => {
  it('returns explicit name when provided', () => {
    expect(deriveTabLabel('https://api.example.com/users', 'List Users')).toBe('List Users');
  });

  it('returns "New Request" for empty URL', () => {
    expect(deriveTabLabel('')).toBe('New Request');
  });

  it('returns hostname for root path', () => {
    expect(deriveTabLabel('https://api.example.com')).toBe('api.example.com');
    expect(deriveTabLabel('https://api.example.com/')).toBe('api.example.com');
  });

  it('returns last path segment with leading slash', () => {
    expect(deriveTabLabel('https://api.example.com/users')).toBe('/users');
    expect(deriveTabLabel('https://api.example.com/api/v2/users')).toBe('/users');
  });

  it('handles trailing slash', () => {
    expect(deriveTabLabel('https://api.example.com/users/')).toBe('/users');
  });

  it('returns truncated string for invalid URL', () => {
    expect(deriveTabLabel('not-a-url')).toBe('not-a-url');
  });

  it('truncates long non-URL strings', () => {
    const longString = 'a'.repeat(50);
    expect(deriveTabLabel(longString)).toBe('a'.repeat(30) + '...');
  });

  it('ignores empty name and falls back to URL', () => {
    expect(deriveTabLabel('https://api.example.com/users', '')).toBe('/users');
  });
});
