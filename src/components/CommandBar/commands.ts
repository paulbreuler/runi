/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useTabStore } from '@/stores/useTabStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { usePanelStore } from '@/stores/usePanelStore';

/**
 * Available command actions in the command bar.
 */
export interface CommandAction {
  /** Unique identifier for the action */
  id: string;
  /** Display label for the action */
  label: string;
  /** Handler function to execute the action */
  handler: () => void;
}

/**
 * Execute a command action.
 */
export const executeAction = (action: CommandAction): void => {
  action.handler();
};

/**
 * All available command actions.
 */
export const COMMAND_ACTIONS: CommandAction[] = [
  {
    id: 'new-request',
    label: 'New Request',
    handler: (): void => {
      useTabStore.getState().openTab();
    },
  },
  {
    id: 'toggle-sidebar',
    label: 'Toggle Sidebar',
    handler: (): void => {
      useSettingsStore.getState().toggleSidebar();
    },
  },
  {
    id: 'toggle-devtools',
    label: 'Toggle DevTools',
    handler: (): void => {
      usePanelStore.getState().toggleVisibility();
    },
  },
  {
    id: 'open-settings',
    label: 'Open Settings',
    handler: (): void => {
      // TODO: Implement settings panel opening
      // eslint-disable-next-line no-console
      console.log('Open settings');
    },
  },
];
