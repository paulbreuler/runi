/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Tab command registration hook.
 *
 * Registers tab-related commands (new, close, next, previous) into the
 * global command registry on mount, unregisters on unmount.
 * Handlers reference useTabStore directly — they own the domain logic.
 */

import { useEffect } from 'react';
import { globalCommandRegistry } from '@/commands/registry';
import { useTabStore } from '@/stores/useTabStore';
import { globalEventBus } from '@/events/bus';

/**
 * Registers tab commands into the global command registry.
 * Call once in the root layout component.
 */
export function useTabCommands(): void {
  useEffect(() => {
    globalCommandRegistry.register({
      id: 'tab.new',
      title: 'New Tab',
      category: 'tabs',
      handler: () => {
        useTabStore.getState().openTab();
      },
    });

    globalCommandRegistry.register({
      id: 'tab.save',
      title: 'Save to Collection',
      category: 'tabs',
      handler: () => {
        globalEventBus.emit('tab.save-requested', {});
      },
    });

    globalCommandRegistry.register({
      id: 'tab.close',
      title: 'Close Tab',
      category: 'tabs',
      handler: () => {
        const { activeTabId, closeTab } = useTabStore.getState();
        if (activeTabId !== null) {
          closeTab(activeTabId);
        }
      },
    });

    globalCommandRegistry.register({
      id: 'tab.next',
      title: 'Next Tab',
      category: 'tabs',
      handler: () => {
        const { tabOrder, activeTabId, setActiveTab } = useTabStore.getState();
        if (tabOrder.length <= 1 || activeTabId === null) {
          return;
        }
        const idx = tabOrder.indexOf(activeTabId);
        const nextIdx = (idx + 1) % tabOrder.length;
        const nextTabId = tabOrder[nextIdx];
        if (nextTabId !== undefined) {
          setActiveTab(nextTabId);
        }
      },
    });

    globalCommandRegistry.register({
      id: 'tab.previous',
      title: 'Previous Tab',
      category: 'tabs',
      handler: () => {
        const { tabOrder, activeTabId, setActiveTab } = useTabStore.getState();
        if (tabOrder.length <= 1 || activeTabId === null) {
          return;
        }
        const idx = tabOrder.indexOf(activeTabId);
        const prevIdx = (idx - 1 + tabOrder.length) % tabOrder.length;
        const prevTabId = tabOrder[prevIdx];
        if (prevTabId !== undefined) {
          setActiveTab(prevTabId);
        }
      },
    });

    return (): void => {
      globalCommandRegistry.unregister('tab.new');
      globalCommandRegistry.unregister('tab.save');
      globalCommandRegistry.unregister('tab.close');
      globalCommandRegistry.unregister('tab.next');
      globalCommandRegistry.unregister('tab.previous');
    };
  }, []);
}
