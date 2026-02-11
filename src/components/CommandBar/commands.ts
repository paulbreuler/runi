/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { globalEventBus } from '@/events/bus';

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
      globalEventBus.emit('request.new', {});
    },
  },
  {
    id: 'toggle-sidebar',
    label: 'Toggle Sidebar',
    handler: (): void => {
      globalEventBus.emit('sidebar.toggle', {});
    },
  },
  {
    id: 'toggle-devtools',
    label: 'Toggle DevTools',
    handler: (): void => {
      globalEventBus.emit('panel.toggle', {});
    },
  },
  {
    id: 'open-settings',
    label: 'Open Settings',
    handler: (): void => {
      globalEventBus.emit('settings.toggle', {});
    },
  },
];
