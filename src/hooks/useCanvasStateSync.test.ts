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
import { buildCanvasSnapshot, useCanvasStateSync } from './useCanvasStateSync';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useActivityStore, __resetActivityIdCounter } from '@/stores/useActivityStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { CanvasStateSnapshot } from '@/types/generated';

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
    beforeEach(() => {
      __resetActivityIdCounter();
      useActivityStore.getState().clear();
    });

    it('should activate tab and log activity when AI switches tab with Follow AI ON', async () => {
      const { unmount } = renderHook(() => {
        useCanvasStateSync();
      });

      // Enable Follow AI mode
      useSettingsStore.getState().setFollowAiMode(true);

      // Open two tabs
      const tab1 = useCanvasStore.getState().openRequestTab({ label: 'Tab 1' });
      const _tab2 = useCanvasStore.getState().openRequestTab({ label: 'Tab 2' });

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
      const _tab2 = useCanvasStore.getState().openRequestTab({ label: 'Tab 2' });

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
      const _tab2 = useCanvasStore.getState().openRequestTab({ label: 'Tab 2' });

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
      const _tab2 = useCanvasStore.getState().openRequestTab({ label: 'Tab 2' });

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
});
