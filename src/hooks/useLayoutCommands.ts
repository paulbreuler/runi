/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Layout command registration hook.
 *
 * Registers sidebar and panel toggle commands into the global command registry.
 * The panel toggle follows a three-state cycle: hidden → visible → collapsed → hidden.
 */

import { useEffect } from 'react';
import { globalCommandRegistry } from '@/commands/registry';
import { usePanelStore } from '@/stores/usePanelStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

/**
 * Registers layout commands (sidebar.toggle, panel.toggle) into the global
 * command registry. Call once in the root layout component.
 */
export function useLayoutCommands(): void {
  useEffect(() => {
    globalCommandRegistry.register({
      id: 'sidebar.toggle',
      title: 'Toggle Sidebar',
      category: 'view',
      handler: () => {
        useSettingsStore.getState().toggleSidebar();
      },
    });

    globalCommandRegistry.register({
      id: 'panel.toggle',
      title: 'Toggle DevTools',
      category: 'view',
      handler: () => {
        const { isVisible, isCollapsed, setVisible, setCollapsed } = usePanelStore.getState();

        if (!isVisible) {
          // Hidden → show and expand
          setVisible(true);
          setCollapsed(false);
        } else if (isCollapsed) {
          // Visible but collapsed → expand
          setCollapsed(false);
        } else {
          // Visible and expanded → hide
          setVisible(false);
        }
      },
    });

    return (): void => {
      globalCommandRegistry.unregister('sidebar.toggle');
      globalCommandRegistry.unregister('panel.toggle');
    };
  }, []);
}
