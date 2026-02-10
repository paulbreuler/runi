/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Keybinding store.
 *
 * Zustand store that manages the effective keybinding list:
 * - Filters defaults by current platform
 * - Builds a serialized key → CommandId lookup index for O(1) resolution
 * - Detects binding conflicts (two commands on same key)
 * - Exposes `getCommandForKey()` — the hot path used by KeybindingService
 *
 * This store holds **data only** (what key maps to what command).
 * Command handlers live in the CommandRegistry. Clean separation.
 */

import { create } from 'zustand';

import { DEFAULT_KEYBINDINGS } from '@/commands/defaultKeybindings';
import type { CommandId, Keybinding } from '@/types/keybinding';
import type { ModifierKey } from '@/utils/keyboard';
import { isMacSync } from '@/utils/platform';

/**
 * A conflict: two commands bound to the same key combination.
 */
export interface KeybindingConflict {
  serializedKey: string;
  commands: CommandId[];
}

interface KeybindingState {
  /** Effective bindings (defaults filtered by platform + user overrides) */
  bindings: Keybinding[];
  /** Serialized key → CommandId lookup index */
  lookupIndex: Map<string, CommandId>;
}

interface KeybindingActions {
  /** Resolve a key + modifiers to a command. Returns undefined if unbound. */
  getCommandForKey: (key: string, modifiers: ModifierKey[]) => CommandId | undefined;
  /** Serialize a key + modifiers into a deterministic lookup string. */
  serializeKey: (key: string, modifiers: ModifierKey[]) => string;
  /** Get all bindings for a specific command. */
  getBindingsForCommand: (commandId: CommandId) => Keybinding[];
  /** Detect conflicting bindings (same key, different commands). */
  getConflicts: () => KeybindingConflict[];
  /** Reset to platform-filtered defaults. */
  reset: () => void;
}

type KeybindingStore = KeybindingState & KeybindingActions;

/**
 * Serialize a key + modifiers into a deterministic lookup string.
 * Modifiers are sorted alphabetically so order doesn't matter.
 * Key is lowercased for case-insensitive matching.
 */
function serializeKeyCombo(key: string, modifiers: ModifierKey[]): string {
  const sortedMods = [...modifiers].sort();
  const normalizedKey = key.toLowerCase();
  if (sortedMods.length === 0) {
    return normalizedKey;
  }
  return `${sortedMods.join('+')}+${normalizedKey}`;
}

/**
 * Normalize a binding's modifier field to a ModifierKey array.
 */
function normalizeModifiers(modifier: ModifierKey | ModifierKey[] | undefined): ModifierKey[] {
  if (modifier === undefined) {
    return [];
  }
  if (Array.isArray(modifier)) {
    return modifier;
  }
  return [modifier];
}

/**
 * Filter default keybindings by current platform.
 * Keeps bindings where platform matches or is undefined (cross-platform).
 */
function getFilteredBindings(): Keybinding[] {
  const mac = isMacSync();
  const currentPlatform = mac ? 'mac' : 'other';

  return DEFAULT_KEYBINDINGS.filter(
    (b) => b.platform === undefined || b.platform === currentPlatform
  );
}

/**
 * Build the serialized key → CommandId lookup index from bindings.
 */
function buildLookupIndex(bindings: Keybinding[]): Map<string, CommandId> {
  const index = new Map<string, CommandId>();
  for (const binding of bindings) {
    const modifiers = normalizeModifiers(binding.modifier);
    const serialized = serializeKeyCombo(binding.key, modifiers);
    index.set(serialized, binding.commandId);
  }
  return index;
}

/**
 * Compute initial state from platform-filtered defaults.
 */
function computeInitialState(): KeybindingState {
  const bindings = getFilteredBindings();
  const lookupIndex = buildLookupIndex(bindings);
  return { bindings, lookupIndex };
}

export const useKeybindingStore = create<KeybindingStore>()((set, get) => ({
  ...computeInitialState(),

  getCommandForKey: (key: string, modifiers: ModifierKey[]): CommandId | undefined => {
    const serialized = serializeKeyCombo(key, modifiers);
    return get().lookupIndex.get(serialized);
  },

  serializeKey: (key: string, modifiers: ModifierKey[]): string => {
    return serializeKeyCombo(key, modifiers);
  },

  getBindingsForCommand: (commandId: CommandId): Keybinding[] => {
    return get().bindings.filter((b) => b.commandId === commandId);
  },

  getConflicts: (): KeybindingConflict[] => {
    const { bindings } = get();
    const keyToCommands = new Map<string, Set<CommandId>>();

    for (const binding of bindings) {
      const modifiers = normalizeModifiers(binding.modifier);
      const serialized = serializeKeyCombo(binding.key, modifiers);
      const existing = keyToCommands.get(serialized);
      if (existing !== undefined) {
        existing.add(binding.commandId);
      } else {
        keyToCommands.set(serialized, new Set([binding.commandId]));
      }
    }

    const conflicts: KeybindingConflict[] = [];
    for (const [serializedKey, commands] of keyToCommands) {
      if (commands.size > 1) {
        conflicts.push({
          serializedKey,
          commands: [...commands],
        });
      }
    }
    return conflicts;
  },

  reset: (): void => {
    set(computeInitialState());
  },
}));
