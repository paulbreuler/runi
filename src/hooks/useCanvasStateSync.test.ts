/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file useCanvasStateSync hook tests
 * @description Tests for canvas state synchronization to backend
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { buildCanvasSnapshot, deriveEventHint, useCanvasStateSync } from './useCanvasStateSync';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useActivityStore, __resetActivityIdCounter } from '@/stores/useActivityStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useRequestStoreRaw } from '@/stores/useRequestStore';
import type { CanvasEventHint, CanvasStateSnapshot } from '@/types/generated';

// Mock event listener
type EventCallback = (event: { payload: unknown }) => void;
const listeners = new Map<string, EventCallback[]>();

// Mock invoke calls
const invokeCalls: Array<{ command: string; args: Record<string, unknown> }> = [];

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
      if (eventListeners !== undefined) {
        const index = eventListeners.indexOf(callback);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    });
  }),
}));

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn((command: string, args: Record<string, unknown>) => {
    invokeCalls.push({ command, args });
    return Promise.resolve();
  }),
}));

// Helper to emit mock events
function emitEvent(eventName: string, payload: unknown): void {
  const eventListeners = listeners.get(eventName);
  if (eventListeners !== undefined) {
    for (const callback of eventListeners) {
      callback({ payload });
    }
  }
}

describe('buildCanvasSnapshot', () => {
  it('builds snapshot with no tabs', () => {
    const snapshot = buildCanvasSnapshot({
      contexts: new Map(),
      templates: new Map(),
      contextOrder: [],
      activeContextId: null,
    });

    expect(snapshot).toEqual({
      tabs: [],
      activeTabIndex: null,
      templates: [],
    });
  });

  it('builds snapshot with request tabs', () => {
    const contexts = new Map([
      ['request-1', { id: 'request-1', label: 'GET /users', contextType: 'request' }],
      ['request-2', { id: 'request-2', label: 'POST /login', contextType: 'request' }],
    ]);

    const snapshot = buildCanvasSnapshot({
      contexts,
      templates: new Map(),
      contextOrder: ['request-1', 'request-2'],
      activeContextId: 'request-1',
    });

    expect(snapshot.tabs).toEqual([
      { id: 'request-1', label: 'GET /users', tabType: 'request' },
      { id: 'request-2', label: 'POST /login', tabType: 'request' },
    ]);
    expect(snapshot.activeTabIndex).toBe(0);
  });

  it('builds snapshot with templates', () => {
    const templates = new Map([
      ['blueprint', { id: 'blueprint', label: 'Blueprint' }],
      ['docs', { id: 'docs', label: 'Documentation' }],
    ]);

    const snapshot = buildCanvasSnapshot({
      contexts: new Map(),
      templates,
      contextOrder: [],
      activeContextId: null,
    });

    expect(snapshot.templates).toEqual([
      { id: 'blueprint', name: 'Blueprint', templateType: 'blueprint' },
      { id: 'docs', name: 'Documentation', templateType: 'docs' },
    ]);
  });

  it('builds snapshot with mixed static and request tabs', () => {
    const contexts = new Map([
      ['blueprint', { id: 'blueprint', label: 'Blueprint' }],
      ['request-1', { id: 'request-1', label: 'GET /users', contextType: 'request' }],
    ]);

    const snapshot = buildCanvasSnapshot({
      contexts,
      templates: new Map(),
      contextOrder: ['blueprint', 'request-1'],
      activeContextId: 'request-1',
    });

    expect(snapshot.tabs).toEqual([
      { id: 'blueprint', label: 'Blueprint', tabType: 'template' },
      { id: 'request-1', label: 'GET /users', tabType: 'request' },
    ]);
    expect(snapshot.activeTabIndex).toBe(1);
  });

  it('handles active tab not in order', () => {
    const contexts = new Map([['request-1', { id: 'request-1', label: 'GET /users' }]]);

    const snapshot = buildCanvasSnapshot({
      contexts,
      templates: new Map(),
      contextOrder: ['request-1'],
      activeContextId: 'request-2',
    });

    expect(snapshot.activeTabIndex).toBe(null);
  });
});

describe('useCanvasStateSync', () => {
  beforeEach(() => {
    listeners.clear();
    invokeCalls.length = 0;
    useCanvasStore.getState().reset();
    useSettingsStore.getState().setFollowAiMode(false);
    useActivityStore.getState().clear();
    __resetActivityIdCounter();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('backend sync', () => {
    it('syncs canvas state on mount', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      // Wait for debounce (100ms) + buffer
      await waitFor(
        () => {
          expect(invokeCalls.length).toBeGreaterThan(0);
        },
        { timeout: 500 }
      );

      const syncCall = invokeCalls.find((call) => call.command === 'sync_canvas_state');
      expect(syncCall).toBeDefined();
      expect(syncCall?.args.snapshot).toBeDefined();

      const snapshot = syncCall?.args.snapshot as CanvasStateSnapshot;
      expect(snapshot.tabs).toEqual([]);
      expect(snapshot.activeTabIndex).toBe(null);

      unmount();
    });

    it('syncs canvas state when store changes', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      // Wait for initial sync
      await waitFor(
        () => {
          expect(invokeCalls.length).toBeGreaterThan(0);
        },
        { timeout: 500 }
      );

      const initialCallCount = invokeCalls.length;

      // Open a new request tab
      act(() => {
        useCanvasStore.getState().openRequestTab({ url: 'https://api.example.com' });
      });

      // Wait for debounced sync
      await waitFor(
        () => {
          expect(invokeCalls.length).toBeGreaterThan(initialCallCount);
        },
        { timeout: 500 }
      );

      const syncCall = invokeCalls[invokeCalls.length - 1];
      expect(syncCall?.command).toBe('sync_canvas_state');

      const snapshot = syncCall?.args.snapshot as CanvasStateSnapshot;
      expect(snapshot.tabs.length).toBe(1);
      expect(snapshot.tabs[0]?.tabType).toBe('request');

      unmount();
    });

    it('debounces sync calls', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      // Wait for initial sync
      await waitFor(
        () => {
          expect(invokeCalls.length).toBeGreaterThan(0);
        },
        { timeout: 500 }
      );

      const initialCallCount = invokeCalls.length;

      // Make multiple rapid changes
      act(() => {
        useCanvasStore.getState().openRequestTab({ url: 'https://api.example.com/1' });
        useCanvasStore.getState().openRequestTab({ url: 'https://api.example.com/2' });
        useCanvasStore.getState().openRequestTab({ url: 'https://api.example.com/3' });
      });

      // Wait for debounced sync
      await waitFor(
        () => {
          expect(invokeCalls.length).toBeGreaterThan(initialCallCount);
        },
        { timeout: 500 }
      );

      // Should only sync once due to debouncing
      const newCallCount = invokeCalls.length - initialCallCount;
      expect(newCallCount).toBe(1);

      unmount();
    });
  });

  describe('MCP event listeners', () => {
    it('subscribes to canvas events on mount', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      await waitFor(() => {
        expect(listeners.has('canvas:switch_tab')).toBe(true);
        expect(listeners.has('canvas:open_request_tab')).toBe(true);
        expect(listeners.has('canvas:close_tab')).toBe(true);
      });

      unmount();
    });

    it('handles switch_tab event', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      // Open two tabs
      const contextId1 = useCanvasStore
        .getState()
        .openRequestTab({ url: 'https://api.example.com/1' });
      const contextId2 = useCanvasStore
        .getState()
        .openRequestTab({ url: 'https://api.example.com/2' });

      // Wait for listeners to be set up
      await waitFor(() => {
        expect(listeners.get('canvas:switch_tab')?.length).toBe(1);
      });

      // Emit switch_tab event (wrapped in envelope)
      act(() => {
        emitEvent('canvas:switch_tab', {
          actor: { type: 'user' },
          timestamp: new Date().toISOString(),
          correlation_id: null,
          lamport: null,
          payload: { contextId: contextId1 },
        });
      });

      // Verify active context changed
      expect(useCanvasStore.getState().activeContextId).toBe(contextId1);

      // Switch to second tab
      act(() => {
        emitEvent('canvas:switch_tab', {
          actor: { type: 'user' },
          timestamp: new Date().toISOString(),
          correlation_id: null,
          lamport: null,
          payload: { contextId: contextId2 },
        });
      });

      expect(useCanvasStore.getState().activeContextId).toBe(contextId2);

      unmount();
    });

    it('handles open_request_tab event', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      await waitFor(() => {
        expect(listeners.get('canvas:open_request_tab')?.length).toBe(1);
      });

      // Emit open_request_tab event (wrapped in envelope)
      act(() => {
        emitEvent('canvas:open_request_tab', {
          actor: { type: 'user' },
          timestamp: new Date().toISOString(),
          correlation_id: null,
          lamport: null,
          payload: { label: 'New Request' },
        });
      });

      // Verify tab was opened
      const { contextOrder } = useCanvasStore.getState();
      expect(contextOrder.length).toBe(1);

      unmount();
    });

    it('handles close_tab event', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      // Open a tab
      const contextId = useCanvasStore
        .getState()
        .openRequestTab({ url: 'https://api.example.com' });

      await waitFor(() => {
        expect(listeners.get('canvas:close_tab')?.length).toBe(1);
      });

      expect(useCanvasStore.getState().contextOrder.length).toBe(1);

      // Emit close_tab event (wrapped in envelope)
      act(() => {
        emitEvent('canvas:close_tab', {
          actor: { type: 'user' },
          timestamp: new Date().toISOString(),
          correlation_id: null,
          lamport: null,
          payload: { contextId },
        });
      });

      // Verify tab was closed
      expect(useCanvasStore.getState().contextOrder.length).toBe(0);

      unmount();
    });

    it('unsubscribes from events on unmount', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      await waitFor(() => {
        expect(listeners.get('canvas:switch_tab')?.length).toBe(1);
      });

      unmount();

      await waitFor(() => {
        expect(listeners.get('canvas:switch_tab')?.length ?? 0).toBe(0);
        expect(listeners.get('canvas:open_request_tab')?.length ?? 0).toBe(0);
        expect(listeners.get('canvas:close_tab')?.length ?? 0).toBe(0);
      });
    });
  });

  describe('Follow AI gating', () => {
    it('should activate tab and log activity when AI switches tab with Follow AI ON', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      // Enable Follow AI mode
      useSettingsStore.getState().setFollowAiMode(true);

      // Open two tabs
      const tab1 = useCanvasStore.getState().openRequestTab({ label: 'Tab 1' });
      const tab2 = useCanvasStore.getState().openRequestTab({ label: 'Tab 2' });

      // tab2 is currently active
      expect(useCanvasStore.getState().activeContextId).toBe(tab2);

      await waitFor(() => {
        expect(listeners.get('canvas:switch_tab')?.length).toBe(1);
      });

      // Emit AI-attributed switch_tab event
      act(() => {
        emitEvent('canvas:switch_tab', {
          actor: { type: 'ai', model: null, session_id: null },
          timestamp: new Date().toISOString(),
          correlation_id: null,
          lamport: null,
          payload: { contextId: tab1 },
        });
      });

      // Should switch to tab1
      expect(useCanvasStore.getState().activeContextId).toBe(tab1);

      // Should log activity entry
      const activities = useActivityStore.getState().entries;
      expect(activities.length).toBe(1);
      expect(activities[0]?.action).toBe('switched_tab');
      expect(activities[0]?.actor.type).toBe('ai');

      unmount();
    });

    it('should NOT activate tab but still log activity when AI switches tab with Follow AI OFF', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      // Disable Follow AI mode
      useSettingsStore.getState().setFollowAiMode(false);

      // Open two tabs
      const tab1 = useCanvasStore.getState().openRequestTab({ label: 'Tab 1' });
      const tab2 = useCanvasStore.getState().openRequestTab({ label: 'Tab 2' });

      // tab2 is currently active
      expect(useCanvasStore.getState().activeContextId).toBe(tab2);

      await waitFor(() => {
        expect(listeners.get('canvas:switch_tab')?.length).toBe(1);
      });

      // Emit AI-attributed switch_tab event
      act(() => {
        emitEvent('canvas:switch_tab', {
          actor: { type: 'ai', model: null, session_id: null },
          timestamp: new Date().toISOString(),
          correlation_id: null,
          lamport: null,
          payload: { contextId: tab1 },
        });
      });

      // Should NOT switch (tab2 still active)
      expect(useCanvasStore.getState().activeContextId).toBe(tab2);

      // Should still log activity entry
      const activities = useActivityStore.getState().entries;
      expect(activities.length).toBe(1);
      expect(activities[0]?.action).toBe('switched_tab');
      expect(activities[0]?.target).toBe(tab1);

      unmount();
    });

    it('should always activate tab when user switches tab (not AI)', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      // Disable Follow AI mode
      useSettingsStore.getState().setFollowAiMode(false);

      // Open two tabs
      const tab1 = useCanvasStore.getState().openRequestTab({ label: 'Tab 1' });
      useCanvasStore.getState().openRequestTab({ label: 'Tab 2' });

      await waitFor(() => {
        expect(listeners.get('canvas:switch_tab')?.length).toBe(1);
      });

      // Emit user-attributed switch_tab event
      act(() => {
        emitEvent('canvas:switch_tab', {
          actor: { type: 'user' },
          timestamp: new Date().toISOString(),
          correlation_id: null,
          lamport: null,
          payload: { contextId: tab1 },
        });
      });

      // Should switch even with Follow AI OFF (user actions always execute)
      expect(useCanvasStore.getState().activeContextId).toBe(tab1);

      unmount();
    });

    it('should activate new tab when AI opens tab with Follow AI ON', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      useSettingsStore.getState().setFollowAiMode(true);

      await waitFor(() => {
        expect(listeners.get('canvas:open_request_tab')?.length).toBe(1);
      });

      // Emit AI-attributed open_request_tab event
      act(() => {
        emitEvent('canvas:open_request_tab', {
          actor: { type: 'ai', model: null, session_id: null },
          timestamp: new Date().toISOString(),
          correlation_id: null,
          lamport: null,
          payload: { label: 'AI Tab' },
        });
      });

      // Should open and activate tab
      const { contextOrder, activeContextId } = useCanvasStore.getState();
      expect(contextOrder.length).toBe(1);
      expect(activeContextId).toBe(contextOrder[0]);

      // Should log activity
      const activities = useActivityStore.getState().entries;
      expect(activities.length).toBe(1);
      expect(activities[0]?.action).toBe('opened_tab');

      unmount();
    });

    it('should NOT activate new tab when AI opens tab with Follow AI OFF', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      useSettingsStore.getState().setFollowAiMode(false);

      // Open initial tab
      const initialTab = useCanvasStore.getState().openRequestTab({ label: 'Initial Tab' });
      expect(useCanvasStore.getState().activeContextId).toBe(initialTab);

      await waitFor(() => {
        expect(listeners.get('canvas:open_request_tab')?.length).toBe(1);
      });

      // Emit AI-attributed open_request_tab event
      act(() => {
        emitEvent('canvas:open_request_tab', {
          actor: { type: 'ai', model: null, session_id: null },
          timestamp: new Date().toISOString(),
          correlation_id: null,
          lamport: null,
          payload: { label: 'AI Tab' },
        });
      });

      // Should open tab but NOT activate it
      const { contextOrder, activeContextId } = useCanvasStore.getState();
      expect(contextOrder.length).toBe(2);
      expect(activeContextId).toBe(initialTab); // Still on initial tab

      // Should log activity
      const activities = useActivityStore.getState().entries;
      expect(activities.length).toBe(1);
      expect(activities[0]?.action).toBe('opened_tab');

      unmount();
    });

    it('should activate adjacent tab when AI closes active tab even with Follow AI OFF (edge case)', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      useSettingsStore.getState().setFollowAiMode(false);

      // Open two tabs
      const tab1 = useCanvasStore.getState().openRequestTab({ label: 'Tab 1' });
      const tab2 = useCanvasStore.getState().openRequestTab({ label: 'Tab 2' });

      // tab2 is currently active
      expect(useCanvasStore.getState().activeContextId).toBe(tab2);

      await waitFor(() => {
        expect(listeners.get('canvas:close_tab')?.length).toBe(1);
      });

      // Emit AI-attributed close_tab event for active tab
      act(() => {
        emitEvent('canvas:close_tab', {
          actor: { type: 'ai', model: null, session_id: null },
          timestamp: new Date().toISOString(),
          correlation_id: null,
          lamport: null,
          payload: { contextId: tab2 },
        });
      });

      // Should close tab AND activate adjacent (can't leave user on blank view)
      expect(useCanvasStore.getState().contextOrder.length).toBe(1);
      expect(useCanvasStore.getState().activeContextId).toBe(tab1);

      // Should log activity
      const activities = useActivityStore.getState().entries;
      expect(activities.length).toBe(1);
      expect(activities[0]?.action).toBe('closed_tab');

      unmount();
    });
  });

  describe('deriveEventHint', () => {
    const mockContexts = new Map([
      ['tab-1', { id: 'tab-1', label: 'Tab 1' }],
      ['tab-2', { id: 'tab-2', label: 'Tab 2' }],
      ['tab-3', { id: 'tab-3', label: 'Tab 3' }],
    ]);

    it('returns tab_opened when contextOrder grew', () => {
      const hint = deriveEventHint(
        { contextOrder: ['tab-1'], activeContextId: 'tab-1' },
        { contextOrder: ['tab-1', 'tab-2'], activeContextId: 'tab-2' },
        mockContexts
      );

      expect(hint).toEqual({ kind: 'tab_opened', tab_id: 'tab-2', label: 'Tab 2' });
    });

    it('returns tab_closed when contextOrder shrank', () => {
      const hint = deriveEventHint(
        { contextOrder: ['tab-1', 'tab-2'], activeContextId: 'tab-2' },
        { contextOrder: ['tab-1'], activeContextId: 'tab-1' },
        mockContexts
      );

      expect(hint).toEqual({ kind: 'tab_closed', tab_id: 'tab-2', label: 'Tab 2' });
    });

    it('returns tab_switched when activeContextId changed with same length', () => {
      const hint = deriveEventHint(
        { contextOrder: ['tab-1', 'tab-2'], activeContextId: 'tab-1' },
        { contextOrder: ['tab-1', 'tab-2'], activeContextId: 'tab-2' },
        mockContexts
      );

      expect(hint).toEqual({ kind: 'tab_switched', tab_id: 'tab-2', label: 'Tab 2' });
    });

    it('returns state_sync when nothing meaningful changed', () => {
      const hint = deriveEventHint(
        { contextOrder: ['tab-1'], activeContextId: 'tab-1' },
        { contextOrder: ['tab-1'], activeContextId: 'tab-1' },
        mockContexts
      );

      expect(hint).toEqual({ kind: 'state_sync' });
    });

    it('returns state_sync when previous state is null (initial mount)', () => {
      const hint = deriveEventHint(
        null,
        {
          contextOrder: ['tab-1'],
          activeContextId: 'tab-1',
        },
        mockContexts
      );

      expect(hint).toEqual({ kind: 'state_sync' });
    });

    it('identifies the correct new tab when multiple tabs exist', () => {
      const hint = deriveEventHint(
        { contextOrder: ['tab-1', 'tab-2'], activeContextId: 'tab-2' },
        { contextOrder: ['tab-1', 'tab-2', 'tab-3'], activeContextId: 'tab-3' },
        mockContexts
      );

      expect(hint).toEqual({ kind: 'tab_opened', tab_id: 'tab-3', label: 'Tab 3' });
    });

    it('identifies the correct removed tab', () => {
      const hint = deriveEventHint(
        { contextOrder: ['tab-1', 'tab-2', 'tab-3'], activeContextId: 'tab-2' },
        { contextOrder: ['tab-1', 'tab-3'], activeContextId: 'tab-3' },
        mockContexts
      );

      expect(hint).toEqual({ kind: 'tab_closed', tab_id: 'tab-2', label: 'Tab 2' });
    });
  });

  describe('event hint in sync calls', () => {
    it('sends state_sync hint on initial mount', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      await waitFor(
        () => {
          expect(invokeCalls.length).toBeGreaterThan(0);
        },
        { timeout: 500 }
      );

      const syncCall = invokeCalls.find((call) => call.command === 'sync_canvas_state');
      expect(syncCall).toBeDefined();
      expect(syncCall?.args.eventHint).toEqual({ kind: 'state_sync' });

      unmount();
    });

    it('sends tab_opened hint when a tab is added', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      // Wait for initial sync
      await waitFor(
        () => {
          expect(invokeCalls.length).toBeGreaterThan(0);
        },
        { timeout: 500 }
      );

      const initialCallCount = invokeCalls.length;

      // Open a tab
      let tabId = '';
      act(() => {
        tabId = useCanvasStore.getState().openRequestTab({ label: 'Test Tab' });
      });

      // Wait for debounced sync
      await waitFor(
        () => {
          expect(invokeCalls.length).toBeGreaterThan(initialCallCount);
        },
        { timeout: 500 }
      );

      const syncCall = invokeCalls[invokeCalls.length - 1];
      expect(syncCall?.command).toBe('sync_canvas_state');
      const hint = syncCall?.args.eventHint as CanvasEventHint;
      expect(hint.kind).toBe('tab_opened');
      if (hint.kind === 'tab_opened') {
        expect(hint.tab_id).toBe(tabId);
      }

      unmount();
    });

    it('sends tab_closed hint when a tab is removed', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      // Open a tab first
      let tabId = '';
      act(() => {
        tabId = useCanvasStore.getState().openRequestTab({ label: 'Tab to close' });
      });

      // Wait for sync after open to settle (any sync call with the tab present)
      await waitFor(
        () => {
          const syncCalls = invokeCalls.filter((c) => c.command === 'sync_canvas_state');
          const hasTabInSnapshot = syncCalls.some((c) => {
            const snapshot = c.args.snapshot as CanvasStateSnapshot;
            return snapshot.tabs.some((t) => t.id === tabId);
          });
          expect(hasTabInSnapshot).toBe(true);
        },
        { timeout: 500 }
      );

      const callCountBeforeClose = invokeCalls.length;

      // Close the tab
      act(() => {
        useCanvasStore.getState().closeContext(tabId);
      });

      // Wait for debounced sync
      await waitFor(
        () => {
          expect(invokeCalls.length).toBeGreaterThan(callCountBeforeClose);
        },
        { timeout: 500 }
      );

      const syncCall = invokeCalls[invokeCalls.length - 1];
      expect(syncCall?.command).toBe('sync_canvas_state');
      const hint = syncCall?.args.eventHint as CanvasEventHint;
      expect(hint.kind).toBe('tab_closed');
      if (hint.kind === 'tab_closed') {
        expect(hint.tab_id).toBe(tabId);
      }

      unmount();
    });

    it('sends tab_switched hint when active tab changes', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      // Open two tabs
      let tab1 = '';
      act(() => {
        tab1 = useCanvasStore.getState().openRequestTab({ label: 'Tab 1' });
        useCanvasStore.getState().openRequestTab({ label: 'Tab 2' });
      });

      // Wait for sync to settle
      await waitFor(
        () => {
          expect(invokeCalls.length).toBeGreaterThan(0);
        },
        { timeout: 500 }
      );

      const callCountBeforeSwitch = invokeCalls.length;

      // Switch to tab1
      act(() => {
        useCanvasStore.getState().setActiveContext(tab1);
      });

      // Wait for debounced sync
      await waitFor(
        () => {
          expect(invokeCalls.length).toBeGreaterThan(callCountBeforeSwitch);
        },
        { timeout: 500 }
      );

      const syncCall = invokeCalls[invokeCalls.length - 1];
      expect(syncCall?.command).toBe('sync_canvas_state');
      const hint = syncCall?.args.eventHint as CanvasEventHint;
      expect(hint.kind).toBe('tab_switched');
      if (hint.kind === 'tab_switched') {
        expect(hint.tab_id).toBe(tab1);
      }

      unmount();
    });
  });

  describe('actor tracking', () => {
    it('sends actor "user" for user-initiated changes', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      // Wait for initial sync
      await waitFor(
        () => {
          expect(invokeCalls.length).toBeGreaterThan(0);
        },
        { timeout: 500 }
      );

      const syncCall = invokeCalls.find((call) => call.command === 'sync_canvas_state');
      expect(syncCall?.args.actor).toBe('user');

      unmount();
    });

    it('sends actor "ai" when MCP event triggers a store mutation', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      // Wait for listeners
      await waitFor(() => {
        expect(listeners.get('canvas:open_request_tab')?.length).toBe(1);
      });

      // Wait for initial sync to settle
      await waitFor(
        () => {
          expect(invokeCalls.length).toBeGreaterThan(0);
        },
        { timeout: 500 }
      );

      const callCountBeforeAi = invokeCalls.length;

      // Emit AI-attributed open event
      act(() => {
        emitEvent('canvas:open_request_tab', {
          actor: { type: 'ai', model: null, session_id: null },
          timestamp: new Date().toISOString(),
          correlation_id: null,
          lamport: null,
          payload: { label: 'AI Tab' },
        });
      });

      // Wait for debounced sync
      await waitFor(
        () => {
          expect(invokeCalls.length).toBeGreaterThan(callCountBeforeAi);
        },
        { timeout: 500 }
      );

      const syncCall = invokeCalls[invokeCalls.length - 1];
      expect(syncCall?.command).toBe('sync_canvas_state');
      expect(syncCall?.args.actor).toBe('ai');

      unmount();
    });

    it('resets aiMutationRef after sync (subsequent user change reports "user")', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      // Wait for listeners and initial sync
      await waitFor(() => {
        expect(listeners.get('canvas:open_request_tab')?.length).toBe(1);
      });
      await waitFor(
        () => {
          expect(invokeCalls.length).toBeGreaterThan(0);
        },
        { timeout: 500 }
      );

      // Trigger AI mutation
      act(() => {
        emitEvent('canvas:open_request_tab', {
          actor: { type: 'ai', model: null, session_id: null },
          timestamp: new Date().toISOString(),
          correlation_id: null,
          lamport: null,
          payload: { label: 'AI Tab' },
        });
      });

      // Wait for AI sync
      await waitFor(
        () => {
          const aiCalls = invokeCalls.filter(
            (c) => c.command === 'sync_canvas_state' && c.args.actor === 'ai'
          );
          expect(aiCalls.length).toBeGreaterThan(0);
        },
        { timeout: 500 }
      );

      const callCountBeforeUser = invokeCalls.length;

      // Now do a user-initiated change
      act(() => {
        useCanvasStore.getState().openRequestTab({ label: 'User Tab' });
      });

      // Wait for user sync
      await waitFor(
        () => {
          expect(invokeCalls.length).toBeGreaterThan(callCountBeforeUser);
        },
        { timeout: 500 }
      );

      const lastCall = invokeCalls[invokeCalls.length - 1];
      expect(lastCall?.command).toBe('sync_canvas_state');
      expect(lastCall?.args.actor).toBe('user');

      unmount();
    });
  });

  describe('canvas:open_collection_request event', () => {
    it('subscribes to canvas:open_collection_request event on mount', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      await waitFor(() => {
        expect(listeners.has('canvas:open_collection_request')).toBe(true);
      });

      unmount();
    });

    it('opens a request tab with method, url, headers, body from event payload', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      await waitFor(() => {
        expect(listeners.get('canvas:open_collection_request')?.length).toBe(1);
      });

      act(() => {
        emitEvent('canvas:open_collection_request', {
          actor: { type: 'ai', model: 'claude', session_id: null },
          timestamp: new Date().toISOString(),
          correlation_id: null,
          lamport: null,
          payload: {
            collection_id: 'col-1',
            request_id: 'req-1',
            name: 'Get Users',
            method: 'GET',
            url: 'https://api.example.com/users',
            headers: { Authorization: 'Bearer token123' },
            body: null,
          },
        });
      });

      // Verify tab was opened
      const { contextOrder } = useCanvasStore.getState();
      expect(contextOrder.length).toBe(1);

      // Verify request store was populated with correct data
      const contextId = contextOrder[0]!;
      const requestState = useRequestStoreRaw.getState().contexts[contextId];
      expect(requestState).toBeDefined();
      expect(requestState?.method).toBe('GET');
      expect(requestState?.url).toBe('https://api.example.com/users');
      expect(requestState?.headers).toEqual({ Authorization: 'Bearer token123' });

      unmount();
    });

    it('tracks collection source (collectionId, requestId) in context state', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      await waitFor(() => {
        expect(listeners.get('canvas:open_collection_request')?.length).toBe(1);
      });

      act(() => {
        emitEvent('canvas:open_collection_request', {
          actor: { type: 'ai', model: null, session_id: null },
          timestamp: new Date().toISOString(),
          correlation_id: null,
          lamport: null,
          payload: {
            collection_id: 'col-1',
            request_id: 'req-1',
            name: 'Get Users',
            method: 'GET',
            url: 'https://api.example.com/users',
            headers: {},
            body: null,
          },
        });
      });

      const { contextOrder, getContextState } = useCanvasStore.getState();
      const contextId = contextOrder[0]!;
      const state = getContextState(contextId);
      const source = state.source as { type: string; collectionId: string; requestId: string };
      expect(source).toEqual({
        type: 'collection',
        collectionId: 'col-1',
        requestId: 'req-1',
      });

      unmount();
    });

    it('records activity for opened collection request', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      await waitFor(() => {
        expect(listeners.get('canvas:open_collection_request')?.length).toBe(1);
      });

      act(() => {
        emitEvent('canvas:open_collection_request', {
          actor: { type: 'ai', model: 'claude', session_id: null },
          timestamp: new Date().toISOString(),
          correlation_id: null,
          lamport: null,
          payload: {
            collection_id: 'col-1',
            request_id: 'req-1',
            name: 'Get Users',
            method: 'GET',
            url: 'https://api.example.com/users',
            headers: {},
            body: null,
          },
        });
      });

      const activities = useActivityStore.getState().entries;
      expect(activities.length).toBe(1);
      expect(activities[0]?.action).toBe('opened_tab');
      expect(activities[0]?.target).toBe('Get Users');
      expect(activities[0]?.actor.type).toBe('ai');

      unmount();
    });

    it('activates tab when AI opens with Follow AI ON', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      useSettingsStore.getState().setFollowAiMode(true);

      await waitFor(() => {
        expect(listeners.get('canvas:open_collection_request')?.length).toBe(1);
      });

      act(() => {
        emitEvent('canvas:open_collection_request', {
          actor: { type: 'ai', model: null, session_id: null },
          timestamp: new Date().toISOString(),
          correlation_id: null,
          lamport: null,
          payload: {
            collection_id: 'col-1',
            request_id: 'req-1',
            name: 'Get Users',
            method: 'GET',
            url: 'https://api.example.com/users',
            headers: {},
            body: null,
          },
        });
      });

      const { contextOrder, activeContextId } = useCanvasStore.getState();
      expect(contextOrder.length).toBe(1);
      expect(activeContextId).toBe(contextOrder[0]);

      unmount();
    });

    it('does NOT activate tab when AI opens with Follow AI OFF', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      useSettingsStore.getState().setFollowAiMode(false);

      // Open an initial tab first
      const initialTab = useCanvasStore.getState().openRequestTab({ label: 'Initial Tab' });
      expect(useCanvasStore.getState().activeContextId).toBe(initialTab);

      await waitFor(() => {
        expect(listeners.get('canvas:open_collection_request')?.length).toBe(1);
      });

      act(() => {
        emitEvent('canvas:open_collection_request', {
          actor: { type: 'ai', model: null, session_id: null },
          timestamp: new Date().toISOString(),
          correlation_id: null,
          lamport: null,
          payload: {
            collection_id: 'col-1',
            request_id: 'req-1',
            name: 'Get Users',
            method: 'GET',
            url: 'https://api.example.com/users',
            headers: {},
            body: null,
          },
        });
      });

      // Should open tab but NOT activate it
      const { contextOrder, activeContextId } = useCanvasStore.getState();
      expect(contextOrder.length).toBe(2);
      expect(activeContextId).toBe(initialTab); // Still on initial tab

      unmount();
    });

    it('reuses existing tab if same collection source already open', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      await waitFor(() => {
        expect(listeners.get('canvas:open_collection_request')?.length).toBe(1);
      });

      // Emit event twice for the same collection request
      act(() => {
        emitEvent('canvas:open_collection_request', {
          actor: { type: 'ai', model: null, session_id: null },
          timestamp: new Date().toISOString(),
          correlation_id: null,
          lamport: null,
          payload: {
            collection_id: 'col-1',
            request_id: 'req-1',
            name: 'Get Users',
            method: 'GET',
            url: 'https://api.example.com/users',
            headers: {},
            body: null,
          },
        });
      });

      act(() => {
        emitEvent('canvas:open_collection_request', {
          actor: { type: 'ai', model: null, session_id: null },
          timestamp: new Date().toISOString(),
          correlation_id: null,
          lamport: null,
          payload: {
            collection_id: 'col-1',
            request_id: 'req-1',
            name: 'Get Users',
            method: 'GET',
            url: 'https://api.example.com/users',
            headers: {},
            body: null,
          },
        });
      });

      // Should not create a duplicate tab
      const { contextOrder } = useCanvasStore.getState();
      expect(contextOrder.length).toBe(1);

      unmount();
    });

    it('populates body from event payload when present', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      await waitFor(() => {
        expect(listeners.get('canvas:open_collection_request')?.length).toBe(1);
      });

      act(() => {
        emitEvent('canvas:open_collection_request', {
          actor: { type: 'ai', model: null, session_id: null },
          timestamp: new Date().toISOString(),
          correlation_id: null,
          lamport: null,
          payload: {
            collection_id: 'col-1',
            request_id: 'req-1',
            name: 'Create User',
            method: 'POST',
            url: 'https://api.example.com/users',
            headers: { 'Content-Type': 'application/json' },
            body: '{"name": "John"}',
          },
        });
      });

      const { contextOrder } = useCanvasStore.getState();
      const contextId = contextOrder[0]!;
      const requestState = useRequestStoreRaw.getState().contexts[contextId];
      expect(requestState?.method).toBe('POST');
      expect(requestState?.body).toBe('{"name": "John"}');
      expect(requestState?.headers).toEqual({ 'Content-Type': 'application/json' });

      unmount();
    });
  });
});
