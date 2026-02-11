/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Keybinding system types.
 *
 * Defines the data model for the centralized keybinding system.
 * Keybindings map keyboard shortcuts to command IDs. Commands
 * are registered separately in the CommandRegistry.
 *
 * This separation enables:
 * - User-configurable keybindings (swap keys without touching handlers)
 * - Command palette (list all commands with their current bindings)
 * - Platform-aware defaults (Cmd on Mac, Ctrl elsewhere)
 * - Conflict detection (two commands bound to same key)
 */

import type { ModifierKey } from '@/utils/keyboard';

/**
 * Unique command identifier. Dot-namespaced by domain.
 *
 * Convention: `domain.action` (e.g., `tab.new`, `sidebar.toggle`)
 */
export type CommandId =
  | 'tab.new'
  | 'tab.close'
  | 'tab.next'
  | 'tab.previous'
  | 'sidebar.toggle'
  | 'panel.toggle';

/**
 * Platform discriminator for keybindings.
 * - `'mac'` — macOS only (uses Meta/Cmd key)
 * - `'other'` — Windows/Linux (uses Ctrl key)
 * - `undefined` — applies on all platforms
 */
export type KeybindingPlatform = 'mac' | 'other';

/**
 * A single keybinding: maps a key combination to a command.
 */
export interface Keybinding {
  /** The command this binding triggers */
  commandId: CommandId;
  /** The key to press (e.g., 't', 'Enter', 'Tab') */
  key: string;
  /** Required modifier key(s) */
  modifier?: ModifierKey | ModifierKey[];
  /** Platform restriction. Omit for cross-platform bindings. */
  platform?: KeybindingPlatform;
}

/**
 * Command metadata for display in UI (palette, settings, tooltips).
 * Separated from handlers — this is pure data.
 */
export interface CommandMeta {
  /** Command identifier, must match a CommandId */
  id: CommandId;
  /** Human-readable title (e.g., "New Tab") */
  title: string;
  /** Category for grouping in palette/settings */
  category: 'tabs' | 'view';
  /** Optional longer description */
  description?: string;
}
