/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { globalCommandRegistry } from '@/commands/registry';
import { KeybindingService } from './keybindingService';

// Mock platform detection — default to mac
vi.mock('@/utils/platform', () => ({
  isMacSync: vi.fn(() => true),
}));

/**
 * Helper: dispatch a synthetic keydown event on window.
 */
function fireKeydown(opts: {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: opts.key,
    metaKey: opts.metaKey ?? false,
    ctrlKey: opts.ctrlKey ?? false,
    shiftKey: opts.shiftKey ?? false,
    altKey: opts.altKey ?? false,
    bubbles: true,
    cancelable: true,
  });
  window.dispatchEvent(event);
  return event;
}

describe('KeybindingService', () => {
  let service: KeybindingService;

  beforeEach(() => {
    service = new KeybindingService();
  });

  afterEach(() => {
    service.stop();
    // Unregister test commands
    for (const cmd of globalCommandRegistry.getAll()) {
      globalCommandRegistry.unregister(cmd.id);
    }
  });

  describe('lifecycle', () => {
    it('attaches a keydown listener on start()', () => {
      const spy = vi.spyOn(window, 'addEventListener');
      service.start();
      expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function));
      spy.mockRestore();
    });

    it('removes the keydown listener on stop()', () => {
      const spy = vi.spyOn(window, 'removeEventListener');
      service.start();
      service.stop();
      expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function));
      spy.mockRestore();
    });

    it('is idempotent — calling start() twice does not add duplicate listeners', () => {
      const spy = vi.spyOn(window, 'addEventListener');
      service.start();
      service.start();
      const keydownCalls = spy.mock.calls.filter(([type]) => type === 'keydown');
      expect(keydownCalls).toHaveLength(1);
      spy.mockRestore();
    });

    it('is idempotent — calling stop() without start() does not throw', () => {
      expect(() => {
        service.stop();
      }).not.toThrow();
    });
  });

  describe('key resolution and command execution', () => {
    it('executes the correct command for a matching keydown', async () => {
      const handler = vi.fn();
      globalCommandRegistry.register({
        id: 'tab.new',
        title: 'New Tab',
        handler,
      });

      service.start();
      fireKeydown({ key: 't', metaKey: true });

      // Command execution is async
      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledTimes(1);
      });
    });

    it('does not execute any command for an unmatched key', () => {
      const handler = vi.fn();
      globalCommandRegistry.register({
        id: 'tab.new',
        title: 'New Tab',
        handler,
      });

      service.start();
      fireKeydown({ key: 'z', metaKey: true });

      expect(handler).not.toHaveBeenCalled();
    });

    it('matches modifier-exact (Cmd+B fires, Cmd+Shift+B does not)', async () => {
      const handler = vi.fn();
      globalCommandRegistry.register({
        id: 'sidebar.toggle',
        title: 'Toggle Sidebar',
        handler,
      });

      service.start();

      // Cmd+B should fire
      fireKeydown({ key: 'b', metaKey: true });
      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledTimes(1);
      });

      handler.mockClear();

      // Cmd+Shift+B should NOT fire (different modifier set)
      fireKeydown({ key: 'b', metaKey: true, shiftKey: true });
      expect(handler).not.toHaveBeenCalled();
    });

    it('handles compound modifiers (Cmd+Shift+I)', async () => {
      const handler = vi.fn();
      globalCommandRegistry.register({
        id: 'panel.toggle',
        title: 'Toggle DevTools',
        handler,
      });

      service.start();
      fireKeydown({ key: 'i', metaKey: true, shiftKey: true });

      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledTimes(1);
      });
    });

    it('prevents default on matched keybinding', () => {
      globalCommandRegistry.register({
        id: 'tab.new',
        title: 'New Tab',
        handler: vi.fn(),
      });

      service.start();
      const event = fireKeydown({ key: 't', metaKey: true });

      expect(event.defaultPrevented).toBe(true);
    });

    it('does not prevent default on unmatched key', () => {
      service.start();
      const event = fireKeydown({ key: 'z', metaKey: true });

      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('ignores keydown events when target is an input element', () => {
      const handler = vi.fn();
      globalCommandRegistry.register({
        id: 'tab.new',
        title: 'New Tab',
        handler,
      });

      service.start();

      // Create an input element and dispatch event on it
      const input = document.createElement('input');
      document.body.appendChild(input);
      const event = new KeyboardEvent('keydown', {
        key: 't',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });
      input.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
      document.body.removeChild(input);
    });

    it('ignores keydown events when target is a textarea element', () => {
      const handler = vi.fn();
      globalCommandRegistry.register({
        id: 'tab.new',
        title: 'New Tab',
        handler,
      });

      service.start();

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      const event = new KeyboardEvent('keydown', {
        key: 't',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });
      textarea.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
      document.body.removeChild(textarea);
    });

    it('ignores keydown events when target has contenteditable', () => {
      const handler = vi.fn();
      globalCommandRegistry.register({
        id: 'tab.new',
        title: 'New Tab',
        handler,
      });

      service.start();

      const div = document.createElement('div');
      div.contentEditable = 'true';
      document.body.appendChild(div);
      const event = new KeyboardEvent('keydown', {
        key: 't',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });
      div.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
      document.body.removeChild(div);
    });

    it('allows commandbar.toggle even when focused in an input element', async () => {
      const handler = vi.fn();
      globalCommandRegistry.register({
        id: 'commandbar.toggle',
        title: 'Toggle Command Bar',
        handler,
      });

      service.start();

      const input = document.createElement('input');
      document.body.appendChild(input);
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });
      input.dispatchEvent(event);

      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledTimes(1);
      });
      expect(event.defaultPrevented).toBe(true);
      document.body.removeChild(input);
    });

    it('allows settings.toggle even when focused in an input element', async () => {
      const handler = vi.fn();
      globalCommandRegistry.register({
        id: 'settings.toggle',
        title: 'Toggle Settings',
        handler,
      });

      service.start();

      const input = document.createElement('input');
      document.body.appendChild(input);
      const event = new KeyboardEvent('keydown', {
        key: ',',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });
      input.dispatchEvent(event);

      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledTimes(1);
      });
      expect(event.defaultPrevented).toBe(true);
      document.body.removeChild(input);
    });

    it('handles command execution errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      globalCommandRegistry.register({
        id: 'tab.new',
        title: 'New Tab',
        handler: () => {
          throw new Error('Test error');
        },
      });

      service.start();
      fireKeydown({ key: 't', metaKey: true });

      await vi.waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('tab.new'),
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
