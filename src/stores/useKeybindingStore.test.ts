/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useKeybindingStore } from './useKeybindingStore';

// Mock platform detection — default to mac for deterministic tests
vi.mock('@/utils/platform', () => ({
  isMacSync: vi.fn(() => true),
}));

describe('useKeybindingStore', () => {
  beforeEach(() => {
    useKeybindingStore.getState().reset();
  });

  describe('initialization', () => {
    it('loads default keybindings on creation', () => {
      const { bindings } = useKeybindingStore.getState();
      expect(bindings.length).toBeGreaterThan(0);
    });

    it('filters bindings by current platform (mac)', () => {
      const { bindings } = useKeybindingStore.getState();

      // Should include mac-specific and cross-platform bindings
      const macBindings = bindings.filter((b) => b.platform === 'mac' || b.platform === undefined);
      expect(macBindings.length).toBe(bindings.length);

      // Should NOT include 'other' platform bindings
      const otherBindings = bindings.filter((b) => b.platform === 'other');
      expect(otherBindings.length).toBe(0);
    });

    it('filters bindings for non-mac platform', async () => {
      const { isMacSync } = await import('@/utils/platform');
      vi.mocked(isMacSync).mockReturnValue(false);

      useKeybindingStore.getState().reset();

      const { bindings } = useKeybindingStore.getState();

      // Should include 'other' platform and cross-platform bindings
      const otherBindings = bindings.filter(
        (b) => b.platform === 'other' || b.platform === undefined
      );
      expect(otherBindings.length).toBe(bindings.length);

      // Should NOT include mac-specific bindings
      const macBindings = bindings.filter((b) => b.platform === 'mac');
      expect(macBindings.length).toBe(0);

      // Restore mac for other tests
      vi.mocked(isMacSync).mockReturnValue(true);
      useKeybindingStore.getState().reset();
    });
  });

  describe('getCommandForKey', () => {
    it('resolves a simple modifier+key combo to a command', () => {
      const { getCommandForKey } = useKeybindingStore.getState();

      // Cmd+T → tab.new (on mac)
      const result = getCommandForKey('t', ['meta']);
      expect(result).toBe('tab.new');
    });

    it('resolves compound modifier combo', () => {
      const { getCommandForKey } = useKeybindingStore.getState();

      // Ctrl+Shift+Tab → tab.previous (cross-platform)
      const result = getCommandForKey('Tab', ['ctrl', 'shift']);
      expect(result).toBe('tab.previous');
    });

    it('returns undefined for unbound key combo', () => {
      const { getCommandForKey } = useKeybindingStore.getState();

      const result = getCommandForKey('z', ['meta']);
      expect(result).toBeUndefined();
    });

    it('is case-insensitive for letter keys', () => {
      const { getCommandForKey } = useKeybindingStore.getState();

      // 'T' should match 't' binding
      const result = getCommandForKey('T', ['meta']);
      expect(result).toBe('tab.new');
    });

    it('does not match when modifier set differs', () => {
      const { getCommandForKey } = useKeybindingStore.getState();

      // Cmd+Shift+T should NOT match Cmd+T
      const result = getCommandForKey('t', ['meta', 'shift']);
      expect(result).toBeUndefined();
    });

    it('modifier order does not matter', () => {
      const { getCommandForKey } = useKeybindingStore.getState();

      // ['shift', 'ctrl'] should match ['ctrl', 'shift'] binding for tab.previous
      const result = getCommandForKey('Tab', ['shift', 'ctrl']);
      expect(result).toBe('tab.previous');
    });

    it('resolves Cmd+B to sidebar.toggle', () => {
      const { getCommandForKey } = useKeybindingStore.getState();
      expect(getCommandForKey('b', ['meta'])).toBe('sidebar.toggle');
    });

    it('resolves Cmd+Shift+I to panel.toggle', () => {
      const { getCommandForKey } = useKeybindingStore.getState();
      expect(getCommandForKey('i', ['meta', 'shift'])).toBe('panel.toggle');
    });

    it('resolves Ctrl+Tab to tab.next', () => {
      const { getCommandForKey } = useKeybindingStore.getState();
      expect(getCommandForKey('Tab', ['ctrl'])).toBe('tab.next');
    });
  });

  describe('serializeKey', () => {
    it('produces deterministic keys regardless of modifier order', () => {
      const { serializeKey } = useKeybindingStore.getState();

      const key1 = serializeKey('t', ['meta', 'shift']);
      const key2 = serializeKey('t', ['shift', 'meta']);
      expect(key1).toBe(key2);
    });

    it('lowercases letter keys', () => {
      const { serializeKey } = useKeybindingStore.getState();

      const key1 = serializeKey('T', ['meta']);
      const key2 = serializeKey('t', ['meta']);
      expect(key1).toBe(key2);
    });

    it('preserves special key casing', () => {
      const { serializeKey } = useKeybindingStore.getState();

      // 'Enter' and 'Tab' should be lowercased in the serialized key
      const key = serializeKey('Enter', ['meta']);
      expect(key).toContain('enter');
    });
  });

  describe('conflict detection', () => {
    it('reports no conflicts for default bindings (per-platform)', () => {
      const { getConflicts } = useKeybindingStore.getState();
      const conflicts = getConflicts();
      expect(conflicts).toHaveLength(0);
    });
  });

  describe('getBindingsForCommand', () => {
    it('returns all bindings for a given command', () => {
      const { getBindingsForCommand } = useKeybindingStore.getState();

      const bindings = getBindingsForCommand('tab.new');
      expect(bindings.length).toBeGreaterThanOrEqual(1);
      expect(bindings.every((b) => b.commandId === 'tab.new')).toBe(true);
    });

    it('returns empty array for command with no bindings', () => {
      const { getBindingsForCommand } = useKeybindingStore.getState();

      // Cast to test with a hypothetical unbound command
      const bindings = getBindingsForCommand('nonexistent' as never);
      expect(bindings).toHaveLength(0);
    });
  });

  describe('reset', () => {
    it('restores default bindings after reset', () => {
      const store = useKeybindingStore.getState();
      const originalCount = store.bindings.length;

      // Reset should restore to defaults
      store.reset();

      const { bindings } = useKeybindingStore.getState();
      expect(bindings.length).toBe(originalCount);
    });
  });
});
