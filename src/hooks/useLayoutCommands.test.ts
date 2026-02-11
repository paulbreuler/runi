/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { globalCommandRegistry } from '@/commands/registry';
import { globalEventBus } from '@/events/bus';
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
});
