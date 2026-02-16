/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Default keybinding map and command metadata.
 *
 * Single source of truth for all keyboard shortcuts in runi.
 * Platform variants are separate entries with a `platform` field
 * rather than duplicated registration calls.
 *
 * To add a new shortcut:
 * 1. Add the CommandId to `src/types/keybinding.ts`
 * 2. Add binding(s) here with platform variants
 * 3. Add metadata entry here
 * 4. Register the command handler in the appropriate domain hook
 */

import type { Keybinding, CommandMeta } from '@/types/keybinding';

/**
 * Default keybinding map. Each entry maps a key combination to a command.
 * Platform-specific entries use the `platform` field to restrict to mac or other.
 * Cross-platform entries omit the `platform` field.
 */
export const DEFAULT_KEYBINDINGS: Keybinding[] = [
  // --- Tabs ---
  { commandId: 'tab.new', key: 't', modifier: 'meta', platform: 'mac' },
  { commandId: 'tab.new', key: 't', modifier: 'ctrl', platform: 'other' },
  { commandId: 'tab.close', key: 'w', modifier: 'meta', platform: 'mac' },
  { commandId: 'tab.close', key: 'w', modifier: 'ctrl', platform: 'other' },
  { commandId: 'tab.save', key: 's', modifier: 'meta', platform: 'mac' },
  { commandId: 'tab.save', key: 's', modifier: 'ctrl', platform: 'other' },
  { commandId: 'tab.next', key: 'Tab', modifier: 'ctrl' },
  { commandId: 'tab.previous', key: 'Tab', modifier: ['ctrl', 'shift'] },

  // --- View ---
  { commandId: 'sidebar.toggle', key: 'b', modifier: 'meta', platform: 'mac' },
  { commandId: 'sidebar.toggle', key: 'b', modifier: 'ctrl', platform: 'other' },
  { commandId: 'panel.toggle', key: 'i', modifier: ['meta', 'shift'], platform: 'mac' },
  { commandId: 'panel.toggle', key: 'i', modifier: ['ctrl', 'shift'], platform: 'other' },

  // --- Command ---
  { commandId: 'commandbar.toggle', key: 'k', modifier: 'meta', platform: 'mac' },
  { commandId: 'commandbar.toggle', key: 'k', modifier: 'ctrl', platform: 'other' },
  { commandId: 'settings.toggle', key: ',', modifier: 'meta', platform: 'mac' },
  { commandId: 'settings.toggle', key: ',', modifier: 'ctrl', platform: 'other' },

  // --- Canvas Layouts ---
  { commandId: 'canvas.layout.previous', key: '[', modifier: 'meta', platform: 'mac' },
  { commandId: 'canvas.layout.previous', key: '[', modifier: 'ctrl', platform: 'other' },
  { commandId: 'canvas.layout.next', key: ']', modifier: 'meta', platform: 'mac' },
  { commandId: 'canvas.layout.next', key: ']', modifier: 'ctrl', platform: 'other' },

  // --- Canvas Contexts ---
  { commandId: 'canvas.context.request', key: '1', modifier: 'meta', platform: 'mac' },
  { commandId: 'canvas.context.request', key: '1', modifier: 'ctrl', platform: 'other' },
  { commandId: 'canvas.context.next', key: ']', modifier: ['ctrl', 'shift'] },
  { commandId: 'canvas.context.previous', key: '[', modifier: ['ctrl', 'shift'] },
];

/**
 * Command metadata for UI display (command palette, settings, tooltips).
 * Every CommandId should have exactly one metadata entry.
 */
export const COMMAND_METADATA: CommandMeta[] = [
  { id: 'tab.new', title: 'New Tab', category: 'tabs' },
  { id: 'tab.close', title: 'Close Tab', category: 'tabs' },
  { id: 'tab.save', title: 'Save to Collection', category: 'tabs' },
  { id: 'tab.next', title: 'Next Tab', category: 'tabs' },
  { id: 'tab.previous', title: 'Previous Tab', category: 'tabs' },
  { id: 'sidebar.toggle', title: 'Toggle Sidebar', category: 'view' },
  { id: 'panel.toggle', title: 'Toggle DevTools', category: 'view' },
  { id: 'settings.toggle', title: 'Toggle Settings', category: 'view' },
  { id: 'commandbar.toggle', title: 'Toggle Command Bar', category: 'command' },
  { id: 'canvas.layout.previous', title: 'Previous Layout', category: 'view' },
  { id: 'canvas.layout.next', title: 'Next Layout', category: 'view' },
  { id: 'canvas.context.request', title: 'Switch to Request Context', category: 'view' },
  { id: 'canvas.context.next', title: 'Next Context', category: 'view' },
  { id: 'canvas.context.previous', title: 'Previous Context', category: 'view' },
];
