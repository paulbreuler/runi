/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Layout command registration hook.
 *
 * Registers sidebar, panel, and command bar toggle commands into the global command registry.
 * The panel toggle follows a three-state cycle: hidden → visible → collapsed → hidden.
 */

import { useEffect } from 'react';
import { globalCommandRegistry } from '@/commands/registry';
import { globalEventBus } from '@/events/bus';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { GENERIC_LAYOUTS } from '@/components/Layout/layouts';

/**
 * Registers layout commands (sidebar.toggle, panel.toggle, commandbar.toggle) into the global
 * command registry. Call once in the root layout component.
 */
export function useLayoutCommands(): void {
  useEffect((): (() => void) => {
    globalCommandRegistry.register({
      id: 'sidebar.toggle',
      title: 'Toggle Sidebar',
      category: 'view',
      handler: (): void => {
        globalEventBus.emit('sidebar.toggle', {});
      },
    });

    globalCommandRegistry.register({
      id: 'panel.toggle',
      title: 'Toggle DevTools',
      category: 'view',
      handler: (): void => {
        globalEventBus.emit('panel.toggle', {});
      },
    });

    globalCommandRegistry.register({
      id: 'commandbar.toggle',
      title: 'Toggle Command Bar',
      category: 'command',
      handler: (): void => {
        // Emit event to toggle command bar (handled in App.tsx)
        globalEventBus.emit('commandbar.toggle', {});
      },
    });

    globalCommandRegistry.register({
      id: 'settings.toggle',
      title: 'Toggle Settings',
      category: 'view',
      handler: (): void => {
        globalEventBus.emit('settings.toggle', {});
      },
    });

    globalCommandRegistry.register({
      id: 'canvas.layout.previous',
      title: 'Previous Layout',
      category: 'view',
      handler: (): void => {
        const { activeContextId, getActiveLayout, setLayout, contexts } = useCanvasStore.getState();
        if (activeContextId === null) {
          return;
        }

        const context = contexts.get(activeContextId);
        if (context === undefined) {
          return;
        }

        const allLayouts = [...context.layouts, ...GENERIC_LAYOUTS];
        const activeLayout = getActiveLayout();
        const currentIndex = allLayouts.findIndex((l) => l.id === activeLayout?.id);
        const nextIndex = (currentIndex - 1 + allLayouts.length) % allLayouts.length;

        setLayout(allLayouts[nextIndex].id);
      },
    });

    globalCommandRegistry.register({
      id: 'canvas.layout.next',
      title: 'Next Layout',
      category: 'view',
      handler: (): void => {
        const { activeContextId, getActiveLayout, setLayout, contexts } = useCanvasStore.getState();
        if (activeContextId === null) {
          return;
        }

        const context = contexts.get(activeContextId);
        if (context === undefined) {
          return;
        }

        const allLayouts = [...context.layouts, ...GENERIC_LAYOUTS];
        const activeLayout = getActiveLayout();
        const currentIndex = allLayouts.findIndex((l) => l.id === activeLayout?.id);
        const nextIndex = (currentIndex + 1) % allLayouts.length;

        setLayout(allLayouts[nextIndex].id);
      },
    });

    globalCommandRegistry.register({
      id: 'canvas.context.request',
      title: 'Switch to Request Context',
      category: 'view',
      handler: (): void => {
        useCanvasStore.getState().setActiveContext('request');
      },
    });

    globalCommandRegistry.register({
      id: 'canvas.context.next',
      title: 'Next Context',
      category: 'view',
      handler: (): void => {
        const { contextOrder, activeContextId, setActiveContext } = useCanvasStore.getState();
        if (contextOrder.length === 0 || activeContextId === null) {
          return;
        }

        const currentIndex = contextOrder.indexOf(activeContextId);
        const nextIndex = (currentIndex + 1) % contextOrder.length;
        const nextContextId = contextOrder[nextIndex];

        if (nextContextId !== undefined) {
          setActiveContext(nextContextId);
        }
      },
    });

    globalCommandRegistry.register({
      id: 'canvas.context.previous',
      title: 'Previous Context',
      category: 'view',
      handler: (): void => {
        const { contextOrder, activeContextId, setActiveContext } = useCanvasStore.getState();
        if (contextOrder.length === 0 || activeContextId === null) {
          return;
        }

        const currentIndex = contextOrder.indexOf(activeContextId);
        const previousIndex = (currentIndex - 1 + contextOrder.length) % contextOrder.length;
        const previousContextId = contextOrder[previousIndex];

        if (previousContextId !== undefined) {
          setActiveContext(previousContextId);
        }
      },
    });

    return (): void => {
      globalCommandRegistry.unregister('sidebar.toggle');
      globalCommandRegistry.unregister('panel.toggle');
      globalCommandRegistry.unregister('commandbar.toggle');
      globalCommandRegistry.unregister('settings.toggle');
      globalCommandRegistry.unregister('canvas.layout.previous');
      globalCommandRegistry.unregister('canvas.layout.next');
      globalCommandRegistry.unregister('canvas.context.request');
      globalCommandRegistry.unregister('canvas.context.next');
      globalCommandRegistry.unregister('canvas.context.previous');
    };
  }, []);
}
