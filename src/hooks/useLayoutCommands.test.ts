/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { globalCommandRegistry } from '@/commands/registry';
import { globalEventBus } from '@/events/bus';
import { useCanvasStore } from '@/stores/useCanvasStore';
import type { CanvasContextDescriptor } from '@/types/canvas';
import { useLayoutCommands } from './useLayoutCommands';

// Mock event bus
vi.mock('@/events/bus', () => ({
  globalEventBus: {
    emit: vi.fn(),
  },
}));

describe('useLayoutCommands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(globalEventBus, 'emit');

    for (const cmd of globalCommandRegistry.getAll()) {
      globalCommandRegistry.unregister(cmd.id);
    }

    // Reset canvas store
    useCanvasStore.getState().reset();
  });

  afterEach(() => {
    for (const cmd of globalCommandRegistry.getAll()) {
      globalCommandRegistry.unregister(cmd.id);
    }
  });

  it('registers layout commands on mount', () => {
    renderHook(() => {
      useLayoutCommands();
    });

    expect(globalCommandRegistry.has('sidebar.toggle')).toBe(true);
    expect(globalCommandRegistry.has('panel.toggle')).toBe(true);
    expect(globalCommandRegistry.has('settings.toggle')).toBe(true);
    expect(globalCommandRegistry.has('commandbar.toggle')).toBe(true);
  });

  it('unregisters layout commands on unmount', () => {
    const { unmount } = renderHook(() => {
      useLayoutCommands();
    });
    unmount();

    expect(globalCommandRegistry.has('sidebar.toggle')).toBe(false);
    expect(globalCommandRegistry.has('panel.toggle')).toBe(false);
    expect(globalCommandRegistry.has('settings.toggle')).toBe(false);
    expect(globalCommandRegistry.has('commandbar.toggle')).toBe(false);
  });

  it('sidebar.toggle handler emits sidebar.toggle event', async () => {
    renderHook(() => {
      useLayoutCommands();
    });
    await globalCommandRegistry.execute('sidebar.toggle');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(globalEventBus.emit).toHaveBeenCalledWith('sidebar.toggle', {});
  });

  it('panel.toggle handler emits panel.toggle event', async () => {
    renderHook(() => {
      useLayoutCommands();
    });
    await globalCommandRegistry.execute('panel.toggle');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(globalEventBus.emit).toHaveBeenCalledWith('panel.toggle', {});
  });

  it('settings.toggle handler emits settings.toggle event', async () => {
    renderHook(() => {
      useLayoutCommands();
    });
    await globalCommandRegistry.execute('settings.toggle');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(globalEventBus.emit).toHaveBeenCalledWith('settings.toggle', {});
  });

  it('commandbar.toggle handler emits commandbar.toggle event', async () => {
    renderHook(() => {
      useLayoutCommands();
    });
    await globalCommandRegistry.execute('commandbar.toggle');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(globalEventBus.emit).toHaveBeenCalledWith('commandbar.toggle', {});
  });

  describe('context navigation commands', () => {
    it('registers context navigation commands on mount', () => {
      renderHook(() => {
        useLayoutCommands();
      });

      expect(globalCommandRegistry.has('canvas.context.next')).toBe(true);
      expect(globalCommandRegistry.has('canvas.context.previous')).toBe(true);
    });

    it('canvas.context.next cycles to next context', async () => {
      const { registerContext } = useCanvasStore.getState();

      const context1: CanvasContextDescriptor = {
        id: 'context-1',
        label: 'Context 1',
        order: 0,
        layouts: [],
      };
      const context2: CanvasContextDescriptor = {
        id: 'context-2',
        label: 'Context 2',
        order: 1,
        layouts: [],
      };

      registerContext(context1);
      registerContext(context2);
      useCanvasStore.getState().setActiveContext('context-1');

      renderHook(() => {
        useLayoutCommands();
      });

      await globalCommandRegistry.execute('canvas.context.next');

      expect(useCanvasStore.getState().activeContextId).toBe('context-2');
    });

    it('canvas.context.next wraps around to first context', async () => {
      const { registerContext } = useCanvasStore.getState();

      registerContext({
        id: 'context-1',
        label: 'Context 1',
        order: 0,
        layouts: [],
      });
      registerContext({
        id: 'context-2',
        label: 'Context 2',
        order: 1,
        layouts: [],
      });
      useCanvasStore.getState().setActiveContext('context-2');

      renderHook(() => {
        useLayoutCommands();
      });

      await globalCommandRegistry.execute('canvas.context.next');

      expect(useCanvasStore.getState().activeContextId).toBe('context-1');
    });

    it('canvas.context.previous cycles to previous context', async () => {
      const { registerContext } = useCanvasStore.getState();

      registerContext({
        id: 'context-1',
        label: 'Context 1',
        order: 0,
        layouts: [],
      });
      registerContext({
        id: 'context-2',
        label: 'Context 2',
        order: 1,
        layouts: [],
      });
      useCanvasStore.getState().setActiveContext('context-2');

      renderHook(() => {
        useLayoutCommands();
      });

      await globalCommandRegistry.execute('canvas.context.previous');

      expect(useCanvasStore.getState().activeContextId).toBe('context-1');
    });

    it('canvas.context.previous wraps around to last context', async () => {
      const { registerContext } = useCanvasStore.getState();

      registerContext({
        id: 'context-1',
        label: 'Context 1',
        order: 0,
        layouts: [],
      });
      registerContext({
        id: 'context-2',
        label: 'Context 2',
        order: 1,
        layouts: [],
      });
      useCanvasStore.getState().setActiveContext('context-1');

      renderHook(() => {
        useLayoutCommands();
      });

      await globalCommandRegistry.execute('canvas.context.previous');

      expect(useCanvasStore.getState().activeContextId).toBe('context-2');
    });

    it('context navigation does nothing when no contexts registered', async () => {
      renderHook(() => {
        useLayoutCommands();
      });

      await globalCommandRegistry.execute('canvas.context.next');
      expect(useCanvasStore.getState().activeContextId).toBeNull();

      await globalCommandRegistry.execute('canvas.context.previous');
      expect(useCanvasStore.getState().activeContextId).toBeNull();
    });
  });
});
