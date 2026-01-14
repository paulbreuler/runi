/**
 * Tests for command registry.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommandRegistry, type Command } from './registry';

describe('CommandRegistry', () => {
  let registry: CommandRegistry;

  beforeEach(() => {
    registry = new CommandRegistry();
  });

  describe('register', () => {
    it('registers a command', () => {
      const command: Command = {
        id: 'test.command',
        title: 'Test Command',
        handler: vi.fn(),
      };

      registry.register(command);

      expect(registry.has('test.command')).toBe(true);
    });

    it('throws if command ID already exists', () => {
      const command: Command = {
        id: 'duplicate.command',
        title: 'Duplicate',
        handler: vi.fn(),
      };

      registry.register(command);

      expect(() => {
        registry.register(command);
      }).toThrow("Command 'duplicate.command' is already registered");
    });
  });

  describe('unregister', () => {
    it('removes a registered command', () => {
      const command: Command = {
        id: 'removable.command',
        title: 'Removable',
        handler: vi.fn(),
      };

      registry.register(command);
      expect(registry.has('removable.command')).toBe(true);

      registry.unregister('removable.command');
      expect(registry.has('removable.command')).toBe(false);
    });

    it('does nothing for non-existent commands', () => {
      expect(() => {
        registry.unregister('nonexistent');
      }).not.toThrow();
    });
  });

  describe('execute', () => {
    it('executes a command handler', async () => {
      const handler = vi.fn();
      registry.register({
        id: 'executable.command',
        title: 'Executable',
        handler,
      });

      await registry.execute('executable.command');

      expect(handler).toHaveBeenCalled();
    });

    it('passes arguments to handler', async () => {
      const handler = vi.fn();
      registry.register({
        id: 'args.command',
        title: 'Args Command',
        handler,
      });

      await registry.execute('args.command', { foo: 'bar' });

      expect(handler).toHaveBeenCalledWith({ foo: 'bar' });
    });

    it('throws for non-existent commands', async () => {
      await expect(registry.execute('nonexistent')).rejects.toThrow(
        "Command 'nonexistent' not found"
      );
    });

    it('awaits async handlers', async () => {
      let resolved = false;
      const asyncHandler = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        resolved = true;
      });

      registry.register({
        id: 'async.command',
        title: 'Async',
        handler: asyncHandler,
      });

      await registry.execute('async.command');

      expect(resolved).toBe(true);
    });
  });

  describe('get', () => {
    it('returns a registered command', () => {
      const command: Command = {
        id: 'gettable.command',
        title: 'Gettable',
        handler: vi.fn(),
      };

      registry.register(command);

      const result = registry.get('gettable.command');
      expect(result).toEqual(command);
    });

    it('returns undefined for non-existent commands', () => {
      expect(registry.get('nonexistent')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('returns all registered commands', () => {
      const commands: Command[] = [
        { id: 'cmd.one', title: 'One', handler: vi.fn() },
        { id: 'cmd.two', title: 'Two', handler: vi.fn() },
        { id: 'cmd.three', title: 'Three', handler: vi.fn() },
      ];

      commands.forEach((cmd) => {
        registry.register(cmd);
      });

      const all = registry.getAll();
      expect(all).toHaveLength(3);
      expect(all.map((c) => c.id)).toEqual(['cmd.one', 'cmd.two', 'cmd.three']);
    });

    it('returns empty array when no commands registered', () => {
      expect(registry.getAll()).toEqual([]);
    });
  });

  describe('getByCategory', () => {
    it('returns commands filtered by category', () => {
      registry.register({ id: 'edit.cut', title: 'Cut', handler: vi.fn(), category: 'edit' });
      registry.register({ id: 'edit.copy', title: 'Copy', handler: vi.fn(), category: 'edit' });
      registry.register({ id: 'view.zoom', title: 'Zoom', handler: vi.fn(), category: 'view' });
      registry.register({ id: 'uncategorized', title: 'None', handler: vi.fn() });

      const editCommands = registry.getByCategory('edit');
      expect(editCommands).toHaveLength(2);
      expect(editCommands.map((c) => c.id)).toEqual(['edit.cut', 'edit.copy']);
    });

    it('returns empty array for non-existent category', () => {
      registry.register({ id: 'some.command', title: 'Some', handler: vi.fn(), category: 'other' });

      expect(registry.getByCategory('nonexistent')).toEqual([]);
    });
  });

  describe('getShortcut', () => {
    it('returns shortcut for a command with shortcut', () => {
      registry.register({
        id: 'shortcut.command',
        title: 'With Shortcut',
        handler: vi.fn(),
        shortcut: { key: 'b', modifier: 'meta', handler: vi.fn() },
      });

      const shortcut = registry.getShortcut('shortcut.command');
      expect(shortcut?.key).toBe('b');
      expect(shortcut?.modifier).toBe('meta');
    });

    it('returns undefined for command without shortcut', () => {
      registry.register({
        id: 'no.shortcut',
        title: 'No Shortcut',
        handler: vi.fn(),
      });

      expect(registry.getShortcut('no.shortcut')).toBeUndefined();
    });

    it('returns undefined for non-existent command', () => {
      expect(registry.getShortcut('nonexistent')).toBeUndefined();
    });
  });

  describe('has', () => {
    it('returns true for registered commands', () => {
      registry.register({ id: 'existing', title: 'Existing', handler: vi.fn() });

      expect(registry.has('existing')).toBe(true);
    });

    it('returns false for non-existent commands', () => {
      expect(registry.has('nonexistent')).toBe(false);
    });
  });
});
