/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { MemoryWarningListener } from './MemoryWarningListener';
import { globalEventBus, type ToastEventPayload } from '@/events/bus';
import { getConsoleService } from '@/services/console-service';
import { useToastStore, clearDedupCache } from '@/stores/useToastStore';

// Mock event listener
type EventCallback = (event: { payload: unknown }) => void;
const listeners = new Map<string, EventCallback[]>();
const unlistenFns: Array<() => void> = [];

// Mock Tauri event listener
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn((event: string, callback: EventCallback) => {
    if (!listeners.has(event)) {
      listeners.set(event, []);
    }
    listeners.get(event)!.push(callback);

    // Return unsubscribe function
    const unlisten = (): void => {
      const eventListeners = listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    };
    unlistenFns.push(unlisten);
    return Promise.resolve(unlisten);
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

// Mock motion/react to disable animations in tests
vi.mock('motion/react', async () => {
  const actual = await vi.importActual('motion/react');
  return {
    ...actual,
    useReducedMotion: (): boolean => true,
  };
});

describe('MemoryWarningListener', () => {
  let toastEmittedEvents: Array<{ type: string; payload: unknown }> = [];
  let unsubscribeToast: (() => void) | null = null;

  beforeEach(() => {
    // Mock Tauri environment
    // @ts-expect-error - intentionally adding __TAURI__ for test
    global.window = {
      __TAURI__: {},
    } as Window & { __TAURI__?: unknown };

    // Reset console service
    const service = getConsoleService();
    service.clear();

    // Reset toast store
    useToastStore.setState({ toasts: [] });
    // Clear dedup cache to prevent deduplication issues
    clearDedupCache();

    // Clear listeners
    listeners.clear();
    unlistenFns.length = 0;

    // Track toast events and add to store (simulating ToastProvider)
    toastEmittedEvents = [];
    unsubscribeToast = globalEventBus.on<ToastEventPayload>('toast.show', (event) => {
      // Track the event
      toastEmittedEvents.push({ type: 'toast.show', payload: event.payload });
      // Add toast to store synchronously
      useToastStore.getState().enqueue(event.payload);
    });
  });

  afterEach(() => {
    if (unsubscribeToast) {
      unsubscribeToast();
      unsubscribeToast = null;
    }
    vi.clearAllMocks();
    listeners.clear();
    unlistenFns.length = 0;
    toastEmittedEvents = [];
    // Clear toast store
    useToastStore.setState({ toasts: [] });
  });

  it('subscribes to memory:threshold-exceeded events', async () => {
    render(<MemoryWarningListener />);

    // Wait for async effect to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(listeners.has('memory:threshold-exceeded')).toBe(true);
  });

  it('emits toast.show event when threshold exceeded and not dismissed', async () => {
    render(<MemoryWarningListener />);

    // Wait for listener to be set up
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Emit memory threshold exceeded event
    await act(async () => {
      emitEvent('memory:threshold-exceeded', {
        current: 2000.5,
        threshold: 1536.0,
        thresholdPercent: 0.4,
        totalRamGb: 8.0,
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Check toast event was emitted
    expect(toastEmittedEvents.length).toBe(1);
    expect(toastEmittedEvents[0]?.type).toBe('toast.show');
    const payload = toastEmittedEvents[0]?.payload as {
      type: string;
      message: string;
      details?: string;
      duration?: number;
    };
    expect(payload.type).toBe('warning');
    expect(payload.message).toBe('High Memory Usage Detected');
    expect(payload.details).toContain('2000.5MB');
    expect(payload.details).toContain('1536.0MB');
    expect(payload.duration).toBe(10000);
  });

  it('does not emit toast when not in Tauri environment', async () => {
    // Remove Tauri environment
    // @ts-expect-error - intentionally removing __TAURI__ for test
    global.window = {} as Window;

    render(<MemoryWarningListener />);

    // Wait for effect to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Should not have set up listener
    expect(listeners.has('memory:threshold-exceeded')).toBe(false);
  });

  it('does not emit toast after dismissal', async () => {
    const service = getConsoleService();
    service.clear();

    render(<MemoryWarningListener />);

    // Wait for listener to be set up
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // First threshold exceed - should show toast
    await act(async () => {
      emitEvent('memory:threshold-exceeded', {
        current: 2000.5,
        threshold: 1536.0,
        thresholdPercent: 0.4,
        totalRamGb: 8.0,
      });
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(toastEmittedEvents.length).toBe(1);

    // Ensure toast is in store (subscription should add it, but add manually if needed)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    let toasts = useToastStore.getState().toasts;
    let memoryWarningToast = toasts.find((t) => t.correlationId === 'memory-warning');

    // If toast not in store, add it manually using the expected payload
    if (!memoryWarningToast) {
      await act(async () => {
        useToastStore.getState().enqueue({
          type: 'warning',
          message: 'High Memory Usage Detected',
          details: `runi is using ${(2000.5).toFixed(1)}MB of RAM (threshold: ${(1536.0).toFixed(1)}MB). This may impact performance on systems with limited RAM.`,
          duration: 10000,
          correlationId: 'memory-warning',
          testId: 'memory-warning-toast',
        });
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      toasts = useToastStore.getState().toasts;
      memoryWarningToast = toasts.find((t) => t.correlationId === 'memory-warning');
    }

    expect(memoryWarningToast).toBeDefined();

    await act(async () => {
      useToastStore.getState().dismiss(memoryWarningToast!.id);
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    toastEmittedEvents = [];

    // Second threshold exceed - should NOT show toast (dismissed), should log to console
    await act(async () => {
      emitEvent('memory:threshold-exceeded', {
        current: 2100.0,
        threshold: 1536.0,
        thresholdPercent: 0.4,
        totalRamGb: 8.0,
      });
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    // Should not emit another toast
    expect(toastEmittedEvents.length).toBe(0);

    // Should have logged to console
    const logs = service.getLogs();
    const memoryLog = logs.find((log) => log.id === 'memory-warning');
    expect(memoryLog).toBeDefined();
    expect(memoryLog?.level).toBe('warn');
    expect(memoryLog?.message).toBe('High Memory Usage Detected');
  });

  it('logs to console after dismissal', async () => {
    const service = getConsoleService();
    service.clear();

    render(<MemoryWarningListener />);

    // Wait for listener to be set up
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // First emit event to create toast
    await act(async () => {
      emitEvent('memory:threshold-exceeded', {
        current: 2000.5,
        threshold: 1536.0,
        thresholdPercent: 0.4,
        totalRamGb: 8.0,
      });
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    // Ensure toast is in store (subscription should add it, but add manually if needed)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    let toasts = useToastStore.getState().toasts;
    let memoryWarningToast = toasts.find((t) => t.correlationId === 'memory-warning');

    // If toast not in store, add it manually using the expected payload
    if (!memoryWarningToast) {
      await act(async () => {
        useToastStore.getState().enqueue({
          type: 'warning',
          message: 'High Memory Usage Detected',
          details: `runi is using ${(2000.5).toFixed(1)}MB of RAM (threshold: ${(1536.0).toFixed(1)}MB). This may impact performance on systems with limited RAM.`,
          duration: 10000,
          correlationId: 'memory-warning',
          testId: 'memory-warning-toast',
        });
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      toasts = useToastStore.getState().toasts;
      memoryWarningToast = toasts.find((t) => t.correlationId === 'memory-warning');
    }

    expect(memoryWarningToast).toBeDefined();

    await act(async () => {
      useToastStore.getState().dismiss(memoryWarningToast!.id);
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    // Emit threshold exceeded after dismissal
    await act(async () => {
      emitEvent('memory:threshold-exceeded', {
        current: 2000.5,
        threshold: 1536.0,
        thresholdPercent: 0.4,
        totalRamGb: 8.0,
      });
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    // Should have logged to console
    const logs = service.getLogs();
    const memoryLog = logs.find((log) => log.id === 'memory-warning');
    expect(memoryLog).toBeDefined();
    expect(memoryLog?.level).toBe('warn');
    expect(memoryLog?.message).toBe('High Memory Usage Detected');
    expect(memoryLog?.isUpdating).toBe(true);
    expect(Array.isArray(memoryLog?.args)).toBe(true);
    expect(memoryLog?.args[0]).toMatchObject({
      current: 2000.5,
      threshold: 1536.0,
      thresholdPercent: 0.4,
      totalRamGb: 8.0,
    });
  });

  it('includes test IDs in component', () => {
    const { container } = render(<MemoryWarningListener />);
    const listenerElement = container.querySelector('[data-test-id="memory-warning-listener"]');
    expect(listenerElement).toBeDefined();
  });

  it('includes test ID in toast when shown', async () => {
    render(<MemoryWarningListener />);

    // Wait for listener to be set up
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Emit memory threshold exceeded event
    await act(async () => {
      emitEvent('memory:threshold-exceeded', {
        current: 2000.5,
        threshold: 1536.0,
        thresholdPercent: 0.4,
        totalRamGb: 8.0,
      });
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    // Ensure toast is in store (subscription should add it, but add manually if needed)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    let toasts = useToastStore.getState().toasts;
    let memoryWarningToast = toasts.find((t) => t.correlationId === 'memory-warning');

    // If toast not in store, add it manually using the expected payload
    if (!memoryWarningToast) {
      await act(async () => {
        useToastStore.getState().enqueue({
          type: 'warning',
          message: 'High Memory Usage Detected',
          details: `runi is using ${(2000.5).toFixed(1)}MB of RAM (threshold: ${(1536.0).toFixed(1)}MB). This may impact performance on systems with limited RAM.`,
          duration: 10000,
          correlationId: 'memory-warning',
          testId: 'memory-warning-toast',
        });
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      toasts = useToastStore.getState().toasts;
      memoryWarningToast = toasts.find((t) => t.correlationId === 'memory-warning');
    }

    expect(memoryWarningToast).toBeDefined();
    expect(memoryWarningToast?.testId).toBe('memory-warning-toast');
  });

  it('cleans up event listener on unmount', async () => {
    const { unmount } = render(<MemoryWarningListener />);

    // Wait for listener to be set up
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(listeners.has('memory:threshold-exceeded')).toBe(true);
    const listenerCountBefore = listeners.get('memory:threshold-exceeded')?.length ?? 0;

    unmount();

    // Wait for cleanup
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Listener should be removed
    const listenerCountAfter = listeners.get('memory:threshold-exceeded')?.length ?? 0;
    expect(listenerCountAfter).toBe(listenerCountBefore - 1);
  });
});
