/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from 'vitest';
import { DEFAULT_KEYBINDINGS, COMMAND_METADATA } from './defaultKeybindings';
import type { CommandId } from '@/types/keybinding';

/** All command IDs that must have bindings and metadata. */
const ALL_COMMAND_IDS: CommandId[] = [
  'tab.new',
  'tab.close',
  'tab.next',
  'tab.previous',
  'sidebar.toggle',
  'panel.toggle',
];

describe('defaultKeybindings', () => {
  describe('completeness', () => {
    it('every CommandId has at least one keybinding', () => {
      for (const id of ALL_COMMAND_IDS) {
        const bindings = DEFAULT_KEYBINDINGS.filter((b) => b.commandId === id);
        expect(bindings.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('every CommandId has metadata', () => {
      for (const id of ALL_COMMAND_IDS) {
        const meta = COMMAND_METADATA.find((m) => m.id === id);
        expect(meta).toBeDefined();
        expect(meta?.title).toBeTruthy();
        expect(meta?.category).toBeTruthy();
      }
    });

    it('no metadata for unknown command IDs', () => {
      const knownIds = new Set<string>(ALL_COMMAND_IDS);
      for (const meta of COMMAND_METADATA) {
        expect(knownIds.has(meta.id)).toBe(true);
      }
    });

    it('no bindings for unknown command IDs', () => {
      const knownIds = new Set<string>(ALL_COMMAND_IDS);
      for (const binding of DEFAULT_KEYBINDINGS) {
        expect(knownIds.has(binding.commandId)).toBe(true);
      }
    });
  });

  describe('platform coverage', () => {
    it('platform-specific bindings cover both mac and other', () => {
      // Group bindings by commandId
      const byCommand = new Map<string, typeof DEFAULT_KEYBINDINGS>();
      for (const b of DEFAULT_KEYBINDINGS) {
        const list = byCommand.get(b.commandId) ?? [];
        list.push(b);
        byCommand.set(b.commandId, list);
      }

      for (const [commandId, bindings] of byCommand) {
        const hasMac = bindings.some((b) => b.platform === 'mac');
        const hasOther = bindings.some((b) => b.platform === 'other');
        const hasCrossPlatform = bindings.some((b) => b.platform === undefined);

        // Either cross-platform OR both mac and other
        const covered = hasCrossPlatform || (hasMac && hasOther);
        expect(covered, `${commandId} missing platform coverage`).toBe(true);
      }
    });
  });

  describe('no conflicts', () => {
    it('no duplicate key+modifier+platform combinations', () => {
      const seen = new Set<string>();
      for (const b of DEFAULT_KEYBINDINGS) {
        const modStr = Array.isArray(b.modifier)
          ? b.modifier.sort().join('+')
          : (b.modifier ?? 'none');
        const key = `${b.key}|${modStr}|${b.platform ?? 'all'}`;
        expect(seen.has(key), `Duplicate binding: ${key}`).toBe(false);
        seen.add(key);
      }
    });
  });

  describe('structure', () => {
    it('all bindings have a key', () => {
      for (const b of DEFAULT_KEYBINDINGS) {
        expect(b.key).toBeTruthy();
      }
    });

    it('all metadata has a title and category', () => {
      for (const m of COMMAND_METADATA) {
        expect(m.title).toBeTruthy();
        expect(m.category).toBeTruthy();
      }
    });
  });
});
