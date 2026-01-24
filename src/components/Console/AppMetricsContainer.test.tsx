/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { AppMetricsContainer } from './AppMetricsContainer';
import { getConsoleService } from '@/services/console-service';

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

describe('AppMetricsContainer', () => {
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
  });

  afterEach(() => {
    vi.clearAllMocks();
    listeners.clear();
    unlistenFns.length = 0;
  });

  it('subscribes to memory:update events', async () => {
    render(<AppMetricsContainer />);

    // Wait for async effect to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(listeners.has('memory:update')).toBe(true);
  });

  it('creates console log when memory update event is received', async () => {
    const service = getConsoleService();
    render(<AppMetricsContainer />);

    // Wait for listener to be set up
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Emit memory update event
    await act(async () => {
      emitEvent('memory:update', {
        current: 245.5,
        average: 220.3,
        peak: 300.0,
        samplesCount: 10,
        thresholdExceeded: false,
        thresholdMb: 1536.0,
        thresholdPercent: 0.4,
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Check log was created
    const logs = service.getLogs();
    expect(logs.length).toBeGreaterThan(0);
    const metricsLog = logs.find((log) => log.id === 'memory-metrics');
    expect(metricsLog).toBeDefined();
    expect(metricsLog?.isUpdating).toBe(true);
  });

  it('sets log level to info when below threshold', async () => {
    const service = getConsoleService();
    render(<AppMetricsContainer />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Below threshold
    await act(async () => {
      emitEvent('memory:update', {
        current: 500.0, // Below 1536.0 threshold
        average: 450.0,
        peak: 600.0,
        samplesCount: 10,
        thresholdExceeded: false,
        thresholdMb: 1536.0,
        thresholdPercent: 0.4,
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const logs = service.getLogs();
    const metricsLog = logs.find((log) => log.id === 'memory-metrics');
    expect(metricsLog?.level).toBe('info');
  });

  it('sets log level to warn when threshold exceeded', async () => {
    const service = getConsoleService();
    render(<AppMetricsContainer />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // At threshold
    await act(async () => {
      emitEvent('memory:update', {
        current: 1536.0, // At threshold
        average: 1500.0,
        peak: 1600.0,
        samplesCount: 10,
        thresholdExceeded: true,
        thresholdMb: 1536.0,
        thresholdPercent: 0.4,
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const logs = service.getLogs();
    const metricsLog = logs.find((log) => log.id === 'memory-metrics');
    expect(metricsLog?.level).toBe('warn');
  });

  it('sets log level to error when critically high', async () => {
    const service = getConsoleService();
    render(<AppMetricsContainer />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Critically high (>= threshold * 1.5)
    await act(async () => {
      emitEvent('memory:update', {
        current: 2304.0, // >= 1536.0 * 1.5 = 2304.0
        average: 2200.0,
        peak: 2400.0,
        samplesCount: 10,
        thresholdExceeded: true,
        thresholdMb: 1536.0,
        thresholdPercent: 0.4,
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const logs = service.getLogs();
    const metricsLog = logs.find((log) => log.id === 'memory-metrics');
    expect(metricsLog?.level).toBe('error');
  });

  it('updates existing log when multiple events are received', async () => {
    const service = getConsoleService();
    render(<AppMetricsContainer />);

    // Wait for listener to be set up
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // First event
    await act(async () => {
      emitEvent('memory:update', {
        current: 245.5,
        average: 220.3,
        peak: 300.0,
        samplesCount: 10,
        thresholdExceeded: false,
        thresholdMb: 1536.0,
        thresholdPercent: 0.4,
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    let logs = service.getLogs();
    expect(logs.length).toBe(1);

    // Second event (should update, not create new)
    await act(async () => {
      emitEvent('memory:update', {
        current: 250.0,
        average: 225.0,
        peak: 300.0,
        samplesCount: 11,
        thresholdExceeded: false,
        thresholdMb: 1536.0,
        thresholdPercent: 0.4,
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    logs = service.getLogs();
    expect(logs.length).toBe(1); // Still only one log
    const metricsLog = logs.find((log) => log.id === 'memory-metrics');
    expect(metricsLog?.args[0]).toMatchObject({
      memory: {
        current: 250.0,
        average: 225.0,
      },
    });
  });

  it('cleans up event listener on unmount', async () => {
    const { unmount } = render(<AppMetricsContainer />);

    // Wait for listener to be set up
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const initialUnlistenCount = unlistenFns.length;
    expect(initialUnlistenCount).toBeGreaterThan(0);

    await act(async () => {
      unmount();
    });

    // Verify unlisten was called (listeners should be cleared)
    expect(listeners.get('memory:update')?.length).toBe(0);
  });

  it('handles non-Tauri environment gracefully', () => {
    // Mock window to not have __TAURI__
    // @ts-expect-error - intentionally modifying window for test
    delete global.window.__TAURI__;

    render(<AppMetricsContainer />);

    // Should not throw and should not set up listener
    expect(listeners.has('memory:update')).toBe(false);
  });
});
