/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { MemoryWarningListener } from './MemoryWarningListener';
import { getConsoleService } from '@/services/console-service';
import * as ToasterModule from '@/components/ui/Toaster';

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

// Track showToast calls
interface ShowToastCall {
  payload: {
    type: string;
    message: string;
    details?: string;
    duration?: number;
    correlationId?: string;
    testId?: string;
  };
  options?: {
    onDismiss?: () => void;
  };
}

const showToastCalls: ShowToastCall[] = [];
let capturedOnDismiss: (() => void) | undefined;

// Mock showToast to capture calls
vi.mock('@/components/ui/Toaster', async () => {
  const actual = await vi.importActual('@/components/ui/Toaster');
  return {
    ...actual,
    showToast: vi.fn((payload: ShowToastCall['payload'], options?: ShowToastCall['options']) => {
      showToastCalls.push({ payload, options });
      if (options?.onDismiss) {
        capturedOnDismiss = options.onDismiss;
      }
    }),
  };
});

describe('MemoryWarningListener', () => {
  beforeEach(() => {
    // Mock Tauri environment
    // @ts-expect-error - intentionally adding __TAURI__ for test
    global.window = {
      __TAURI__: {},
    } as Window & { __TAURI__?: unknown };

    // Reset console service
    const service = getConsoleService();
    service.clear();

    // Clear listeners
    listeners.clear();
    unlistenFns.length = 0;

    // Clear showToast calls
    showToastCalls.length = 0;
    capturedOnDismiss = undefined;

    // Clear dedup cache
    ToasterModule.clearDedupCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
    listeners.clear();
    unlistenFns.length = 0;
    showToastCalls.length = 0;
    capturedOnDismiss = undefined;
  });

  it('subscribes to memory:threshold-exceeded events', async () => {
    render(<MemoryWarningListener />);

    // Wait for async effect to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(listeners.has('memory:threshold-exceeded')).toBe(true);
  });

  it('calls showToast when threshold exceeded and not dismissed', async () => {
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

    // Check showToast was called
    expect(showToastCalls.length).toBe(1);
    const call = showToastCalls[0];
    expect(call?.payload.type).toBe('warning');
    expect(call?.payload.message).toBe('High Memory Usage Detected');
    expect(call?.payload.details).toContain('2000.5MB');
    expect(call?.payload.details).toContain('1536.0MB');
    expect(call?.payload.duration).toBe(10000);
    expect(call?.options?.onDismiss).toBeDefined();
  });

  it('does not show toast when not in Tauri environment', async () => {
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

  it('does not show toast after dismissal', async () => {
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

    expect(showToastCalls.length).toBe(1);

    // Simulate dismissal via onDismiss callback
    expect(capturedOnDismiss).toBeDefined();
    await act(async () => {
      capturedOnDismiss?.();
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    // Clear calls to track new ones
    showToastCalls.length = 0;

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

    // Should not have called showToast again
    expect(showToastCalls.length).toBe(0);

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

    // Simulate dismissal via onDismiss callback
    expect(capturedOnDismiss).toBeDefined();
    await act(async () => {
      capturedOnDismiss?.();
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

    // Check testId was included
    expect(showToastCalls.length).toBe(1);
    expect(showToastCalls[0]?.payload.testId).toBe('memory-warning-toast');
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
