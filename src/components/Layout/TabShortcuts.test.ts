/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { useTabStore } from '@/stores/useTabStore';
import { createKeyboardHandler } from '@/utils/keyboard';
import type { ModifierKey } from '@/utils/keyboard';

/**
 * Tests for tab keyboard shortcuts as registered by MainLayout.
 *
 * Uses createKeyboardHandler directly (same as useKeyboardShortcuts hook)
 * to validate shortcut behavior without rendering the full MainLayout tree.
 */
describe('Tab keyboard shortcuts', (): void => {
  const cleanups: Array<() => void> = [];

  function registerShortcuts(): void {
    const openTab = (): void => {
      useTabStore.getState().openTab();
    };

    const closeActiveTab = (): void => {
      const activeId = useTabStore.getState().activeTabId;
      if (activeId !== null) {
        useTabStore.getState().closeTab(activeId);
      }
    };

    const nextTab = (): void => {
      const { tabOrder, activeTabId } = useTabStore.getState();
      if (tabOrder.length <= 1 || activeTabId === null) {
        return;
      }
      const idx = tabOrder.indexOf(activeTabId);
      const nextIdx = (idx + 1) % tabOrder.length;
      const nextTabId = tabOrder[nextIdx];
      if (nextTabId !== undefined) {
        useTabStore.getState().setActiveTab(nextTabId);
      }
    };

    const prevTab = (): void => {
      const { tabOrder, activeTabId } = useTabStore.getState();
      if (tabOrder.length <= 1 || activeTabId === null) {
        return;
      }
      const idx = tabOrder.indexOf(activeTabId);
      const prevIdx = (idx - 1 + tabOrder.length) % tabOrder.length;
      const prevTabId = tabOrder[prevIdx];
      if (prevTabId !== undefined) {
        useTabStore.getState().setActiveTab(prevTabId);
      }
    };

    cleanups.push(
      createKeyboardHandler({ key: 't', modifier: 'meta', handler: openTab }),
      createKeyboardHandler({ key: 't', modifier: 'ctrl', handler: openTab }),
      createKeyboardHandler({ key: 'w', modifier: 'meta', handler: closeActiveTab }),
      createKeyboardHandler({ key: 'w', modifier: 'ctrl', handler: closeActiveTab }),
      createKeyboardHandler({ key: 'Tab', modifier: 'ctrl', handler: nextTab }),
      createKeyboardHandler({
        key: 'Tab',
        modifier: ['ctrl', 'shift'] as ModifierKey[],
        handler: prevTab,
      })
    );
  }

  beforeEach((): void => {
    useTabStore.setState({ tabs: {}, tabOrder: [], activeTabId: null });
    registerShortcuts();
  });

  afterEach((): void => {
    for (const cleanup of cleanups) {
      cleanup();
    }
    cleanups.length = 0;
  });

  it('Cmd+T creates a new tab', (): void => {
    fireEvent.keyDown(window, { key: 't', metaKey: true });
    expect(useTabStore.getState().tabOrder).toHaveLength(1);
  });

  it('Ctrl+T creates a new tab', (): void => {
    fireEvent.keyDown(window, { key: 't', ctrlKey: true });
    expect(useTabStore.getState().tabOrder).toHaveLength(1);
  });

  it('Cmd+W closes the active tab', (): void => {
    const id = useTabStore.getState().openTab({ url: 'https://one.com' });
    useTabStore.getState().openTab({ url: 'https://two.com' });
    useTabStore.getState().setActiveTab(id);

    fireEvent.keyDown(window, { key: 'w', metaKey: true });
    expect(useTabStore.getState().tabs[id]).toBeUndefined();
  });

  it('Ctrl+W closes the active tab', (): void => {
    const id = useTabStore.getState().openTab({ url: 'https://one.com' });
    useTabStore.getState().openTab({ url: 'https://two.com' });
    useTabStore.getState().setActiveTab(id);

    fireEvent.keyDown(window, { key: 'w', ctrlKey: true });
    expect(useTabStore.getState().tabs[id]).toBeUndefined();
  });

  it('Ctrl+Tab cycles to next tab', (): void => {
    const id1 = useTabStore.getState().openTab({ url: 'https://one.com' });
    const id2 = useTabStore.getState().openTab({ url: 'https://two.com' });
    useTabStore.getState().openTab({ url: 'https://three.com' });
    useTabStore.getState().setActiveTab(id1);

    fireEvent.keyDown(window, { key: 'Tab', ctrlKey: true });
    expect(useTabStore.getState().activeTabId).toBe(id2);
  });

  it('Ctrl+Shift+Tab cycles to previous tab', (): void => {
    const id1 = useTabStore.getState().openTab({ url: 'https://one.com' });
    const id2 = useTabStore.getState().openTab({ url: 'https://two.com' });
    useTabStore.getState().openTab({ url: 'https://three.com' });
    useTabStore.getState().setActiveTab(id2);

    fireEvent.keyDown(window, { key: 'Tab', ctrlKey: true, shiftKey: true });
    expect(useTabStore.getState().activeTabId).toBe(id1);
  });

  it('Ctrl+Tab wraps from last to first', (): void => {
    const id1 = useTabStore.getState().openTab({ url: 'https://one.com' });
    const id2 = useTabStore.getState().openTab({ url: 'https://two.com' });
    useTabStore.getState().setActiveTab(id2);

    fireEvent.keyDown(window, { key: 'Tab', ctrlKey: true });
    expect(useTabStore.getState().activeTabId).toBe(id1);
  });
});
