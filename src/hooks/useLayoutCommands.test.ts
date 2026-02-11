/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { globalCommandRegistry } from '@/commands/registry';
import { useLayoutCommands } from './useLayoutCommands';

// Mock settings store
const mockToggleSidebar = vi.fn();

vi.mock('@/stores/useSettingsStore', () => ({
  useSettingsStore: Object.assign(
    (selector: (state: Record<string, unknown>) => unknown): unknown =>
      selector({ toggleSidebar: mockToggleSidebar }),
    {
      getState: () => ({ toggleSidebar: mockToggleSidebar }),
      setState: vi.fn(),
      subscribe: vi.fn(),
      destroy: vi.fn(),
    }
  ),
}));

// Mock panel store
const mockSetVisible = vi.fn();
const mockSetCollapsed = vi.fn();

let mockPanelState = { isVisible: false, isCollapsed: false };

vi.mock('@/stores/usePanelStore', () => ({
  usePanelStore: Object.assign(
    (selector: (state: Record<string, unknown>) => unknown): unknown =>
      selector({
        isVisible: mockPanelState.isVisible,
        isCollapsed: mockPanelState.isCollapsed,
        setVisible: mockSetVisible,
        setCollapsed: mockSetCollapsed,
      }),
    {
      getState: () => ({
        isVisible: mockPanelState.isVisible,
        isCollapsed: mockPanelState.isCollapsed,
        setVisible: mockSetVisible,
        setCollapsed: mockSetCollapsed,
      }),
      setState: vi.fn(),
      subscribe: vi.fn(),
      destroy: vi.fn(),
    }
  ),
}));

describe('useLayoutCommands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPanelState = { isVisible: false, isCollapsed: false };
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
  });

  it('unregisters layout commands on unmount', () => {
    const { unmount } = renderHook(() => {
      useLayoutCommands();
    });
    unmount();

    expect(globalCommandRegistry.has('sidebar.toggle')).toBe(false);
    expect(globalCommandRegistry.has('panel.toggle')).toBe(false);
  });

  it('sidebar.toggle handler calls toggleSidebar', async () => {
    renderHook(() => {
      useLayoutCommands();
    });
    await globalCommandRegistry.execute('sidebar.toggle');
    expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('panel.toggle shows hidden panel', async () => {
    mockPanelState = { isVisible: false, isCollapsed: false };
    renderHook(() => {
      useLayoutCommands();
    });
    await globalCommandRegistry.execute('panel.toggle');
    expect(mockSetVisible).toHaveBeenCalledWith(true);
    expect(mockSetCollapsed).toHaveBeenCalledWith(false);
  });

  it('panel.toggle expands collapsed panel', async () => {
    mockPanelState = { isVisible: true, isCollapsed: true };
    renderHook(() => {
      useLayoutCommands();
    });
    await globalCommandRegistry.execute('panel.toggle');
    expect(mockSetCollapsed).toHaveBeenCalledWith(false);
  });

  it('panel.toggle hides visible expanded panel', async () => {
    mockPanelState = { isVisible: true, isCollapsed: false };
    renderHook(() => {
      useLayoutCommands();
    });
    await globalCommandRegistry.execute('panel.toggle');
    expect(mockSetVisible).toHaveBeenCalledWith(false);
  });
});
