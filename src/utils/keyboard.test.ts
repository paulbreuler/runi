import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createKeyboardHandler, type KeyboardShortcut } from './keyboard';

describe('keyboard utilities', () => {
  let handler: (() => void) | null = null;

  beforeEach(() => {
    handler = null;
  });

  afterEach(() => {
    if (handler !== null) {
      handler();
    }
  });

  describe('createKeyboardHandler', () => {
    it('calls handler when key and modifier match', () => {
      const mockHandler = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifier: 'meta',
        handler: mockHandler,
      };

      handler = createKeyboardHandler(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        metaKey: true,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
      });

      window.dispatchEvent(event);

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('does not call handler when key does not match', () => {
      const mockHandler = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifier: 'meta',
        handler: mockHandler,
      };

      handler = createKeyboardHandler(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        metaKey: true,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
      });

      window.dispatchEvent(event);

      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('does not call handler when modifier does not match', () => {
      const mockHandler = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifier: 'meta',
        handler: mockHandler,
      };

      handler = createKeyboardHandler(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        metaKey: false,
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
      });

      window.dispatchEvent(event);

      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('does not call handler when other modifiers are pressed', () => {
      const mockHandler = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifier: 'meta',
        handler: mockHandler,
      };

      handler = createKeyboardHandler(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        metaKey: true,
        ctrlKey: true, // Other modifier pressed
        shiftKey: false,
        altKey: false,
      });

      window.dispatchEvent(event);

      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('works with ctrl modifier', () => {
      const mockHandler = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 's',
        modifier: 'ctrl',
        handler: mockHandler,
      };

      handler = createKeyboardHandler(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: false,
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
      });

      window.dispatchEvent(event);

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('works with shift modifier', () => {
      const mockHandler = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'S',
        modifier: 'shift',
        handler: mockHandler,
      };

      handler = createKeyboardHandler(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'S',
        metaKey: false,
        ctrlKey: false,
        shiftKey: true,
        altKey: false,
      });

      window.dispatchEvent(event);

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('works without modifier', () => {
      const mockHandler = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'Escape',
        handler: mockHandler,
      };

      handler = createKeyboardHandler(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
      });

      window.dispatchEvent(event);

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('prevents default by default', () => {
      const mockHandler = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifier: 'meta',
        handler: mockHandler,
      };

      handler = createKeyboardHandler(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        metaKey: true,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
      });

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('does not prevent default when preventDefault is false', () => {
      const mockHandler = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifier: 'meta',
        handler: mockHandler,
        preventDefault: false,
      };

      handler = createKeyboardHandler(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        metaKey: true,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
      });

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      window.dispatchEvent(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('returns cleanup function that removes event listener', () => {
      const mockHandler = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: 'b',
        modifier: 'meta',
        handler: mockHandler,
      };

      handler = createKeyboardHandler(shortcut);

      // Cleanup
      handler();

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        metaKey: true,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
      });

      window.dispatchEvent(event);

      expect(mockHandler).not.toHaveBeenCalled();
      handler = null; // Already cleaned up
    });
  });
});
