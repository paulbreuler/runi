/**
 * Tests for event bus.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus, type Event } from './bus';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  describe('emit', () => {
    it('calls registered handlers with event', () => {
      const handler = vi.fn();
      bus.on('request.send', handler);

      bus.emit('request.send', { url: 'https://example.com' });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'request.send',
          payload: { url: 'https://example.com' },
        })
      );
    });

    it('includes timestamp in event', () => {
      const handler = vi.fn();
      bus.on('response.received', handler);

      const before = Date.now();
      bus.emit('response.received', { status: 200 });
      const after = Date.now();

      const call = handler.mock.calls[0];
      expect(call).toBeDefined();
      const event = (call !== undefined ? call[0] : null) as Event;
      expect(event).not.toBeNull();
      expect(event.timestamp).toBeGreaterThanOrEqual(before);
      expect(event.timestamp).toBeLessThanOrEqual(after);
    });

    it('includes optional source in event', () => {
      const handler = vi.fn();
      bus.on('sidebar.toggled', handler);

      bus.emit('sidebar.toggled', { visible: true }, 'MainLayout');

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'MainLayout',
        })
      );
    });

    it('does nothing if no handlers registered', () => {
      expect(() => {
        bus.emit('request.send', {});
      }).not.toThrow();
    });

    it('catches and logs handler errors without breaking other handlers', () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const goodHandler = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      bus.on('request.send', errorHandler);
      bus.on('request.send', goodHandler);

      bus.emit('request.send', {});

      expect(errorHandler).toHaveBeenCalled();
      expect(goodHandler).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('on', () => {
    it('registers a handler', () => {
      const handler = vi.fn();
      bus.on('request.url-changed', handler);

      bus.emit('request.url-changed', { url: 'new-url' });

      expect(handler).toHaveBeenCalled();
    });

    it('returns unsubscribe function', () => {
      const handler = vi.fn();
      const unsubscribe = bus.on('request.method-changed', handler);

      bus.emit('request.method-changed', { method: 'POST' });
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      bus.emit('request.method-changed', { method: 'PUT' });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('allows multiple handlers for same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      bus.on('response.received', handler1);
      bus.on('response.received', handler2);

      bus.emit('response.received', { status: 200 });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('off', () => {
    it('removes a specific handler', () => {
      const handler = vi.fn();
      bus.on('response.error', handler);

      bus.off('response.error', handler);
      bus.emit('response.error', { message: 'error' });

      expect(handler).not.toHaveBeenCalled();
    });

    it('does nothing for non-existent handler', () => {
      const handler = vi.fn();
      expect(() => {
        bus.off('response.error', handler);
      }).not.toThrow();
    });

    it('cleans up empty handler sets', () => {
      const handler = vi.fn();
      bus.on('ai.suggestion-requested', handler);
      bus.off('ai.suggestion-requested', handler);

      expect(bus.listenerCount('ai.suggestion-requested')).toBe(0);
    });
  });

  describe('once', () => {
    it('removes handler after first event', () => {
      const handler = vi.fn();
      bus.once('ai.suggestion-available', handler);

      bus.emit('ai.suggestion-available', { suggestion: 'first' });
      bus.emit('ai.suggestion-available', { suggestion: 'second' });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { suggestion: 'first' },
        })
      );
    });

    it('returns unsubscribe function that works before first event', () => {
      const handler = vi.fn();
      const unsubscribe = bus.once('ai.error-analysis', handler);

      unsubscribe();
      bus.emit('ai.error-analysis', {});

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('removeAllListeners', () => {
    it('removes all listeners for a specific event type', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const otherHandler = vi.fn();

      bus.on('command.executed', handler1);
      bus.on('command.executed', handler2);
      bus.on('request.send', otherHandler);

      bus.removeAllListeners('command.executed');

      bus.emit('command.executed', {});
      bus.emit('request.send', {});

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(otherHandler).toHaveBeenCalled();
    });

    it('removes all listeners when no type specified', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      bus.on('request.send', handler1);
      bus.on('response.received', handler2);

      bus.removeAllListeners();

      bus.emit('request.send', {});
      bus.emit('response.received', {});

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('listenerCount', () => {
    it('returns number of listeners for an event type', () => {
      bus.on('sidebar.visible-changed', vi.fn());
      bus.on('sidebar.visible-changed', vi.fn());
      bus.on('sidebar.visible-changed', vi.fn());

      expect(bus.listenerCount('sidebar.visible-changed')).toBe(3);
    });

    it('returns 0 for event types with no listeners', () => {
      expect(bus.listenerCount('ai.suggestion-requested')).toBe(0);
    });

    it('updates when handlers are added and removed', () => {
      const handler = vi.fn();

      expect(bus.listenerCount('request.send')).toBe(0);

      bus.on('request.send', handler);
      expect(bus.listenerCount('request.send')).toBe(1);

      bus.off('request.send', handler);
      expect(bus.listenerCount('request.send')).toBe(0);
    });
  });
});
