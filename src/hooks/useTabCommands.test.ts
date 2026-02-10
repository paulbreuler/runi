/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { globalCommandRegistry } from '@/commands/registry';
import { useTabCommands } from './useTabCommands';

// Mock useTabStore
const mockOpenTab = vi.fn().mockReturnValue('new-tab-id');
const mockCloseTab = vi.fn();
const mockSetActiveTab = vi.fn();

vi.mock('@/stores/useTabStore', () => ({
  useTabStore: Object.assign(
    // Selector-based access
    (selector: (state: Record<string, unknown>) => unknown): unknown =>
      selector({
        openTab: mockOpenTab,
        closeTab: mockCloseTab,
        setActiveTab: mockSetActiveTab,
        activeTabId: 'tab-1',
        tabOrder: ['tab-1', 'tab-2', 'tab-3'],
        tabs: {},
      }),
    {
      getState: () => ({
        openTab: mockOpenTab,
        closeTab: mockCloseTab,
        setActiveTab: mockSetActiveTab,
        activeTabId: 'tab-1',
        tabOrder: ['tab-1', 'tab-2', 'tab-3'],
        tabs: {},
      }),
      setState: vi.fn(),
      subscribe: vi.fn(),
      destroy: vi.fn(),
    }
  ),
}));

describe('useTabCommands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clean the registry
    for (const cmd of globalCommandRegistry.getAll()) {
      globalCommandRegistry.unregister(cmd.id);
    }
  });

  afterEach(() => {
    for (const cmd of globalCommandRegistry.getAll()) {
      globalCommandRegistry.unregister(cmd.id);
    }
  });

  it('registers tab commands on mount', () => {
    renderHook(() => {
      useTabCommands();
    });

    expect(globalCommandRegistry.has('tab.new')).toBe(true);
    expect(globalCommandRegistry.has('tab.close')).toBe(true);
    expect(globalCommandRegistry.has('tab.next')).toBe(true);
    expect(globalCommandRegistry.has('tab.previous')).toBe(true);
  });

  it('unregisters tab commands on unmount', () => {
    const { unmount } = renderHook(() => {
      useTabCommands();
    });
    unmount();

    expect(globalCommandRegistry.has('tab.new')).toBe(false);
    expect(globalCommandRegistry.has('tab.close')).toBe(false);
    expect(globalCommandRegistry.has('tab.next')).toBe(false);
    expect(globalCommandRegistry.has('tab.previous')).toBe(false);
  });

  it('tab.new handler calls openTab', async () => {
    renderHook(() => {
      useTabCommands();
    });
    await globalCommandRegistry.execute('tab.new');
    expect(mockOpenTab).toHaveBeenCalledTimes(1);
  });

  it('tab.close handler calls closeTab with active tab ID', async () => {
    renderHook(() => {
      useTabCommands();
    });
    await globalCommandRegistry.execute('tab.close');
    expect(mockCloseTab).toHaveBeenCalledWith('tab-1');
  });

  it('tab.next handler cycles to next tab', async () => {
    renderHook(() => {
      useTabCommands();
    });
    await globalCommandRegistry.execute('tab.next');
    expect(mockSetActiveTab).toHaveBeenCalledWith('tab-2');
  });

  it('tab.previous handler cycles to previous tab (wraps around)', async () => {
    renderHook(() => {
      useTabCommands();
    });
    await globalCommandRegistry.execute('tab.previous');
    // tab-1 is index 0, previous wraps to index 2 = tab-3
    expect(mockSetActiveTab).toHaveBeenCalledWith('tab-3');
  });
});
