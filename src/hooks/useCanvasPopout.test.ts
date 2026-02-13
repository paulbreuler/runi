/**
 * Canvas Popout Hook Tests
 *
 * Tests for the canvas popout window functionality.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasPopout } from './useCanvasPopout';
import { useCanvasStore } from '@/stores/useCanvasStore';
import type { CanvasContextDescriptor } from '@/types/canvas';
import { Square } from 'lucide-react';
import { globalEventBus } from '@/events/bus';

// Mock window.open
const mockWindow = {
  closed: false,
  close: vi.fn(),
  postMessage: vi.fn(),
  document: {
    title: '',
  },
  addEventListener: vi.fn(),
  focus: vi.fn(),
  screenX: 0,
  screenY: 0,
  outerWidth: 1920,
  outerHeight: 1080,
  name: 'test-window',
};

// Test panel component
const TestPanel = (): null => null;

describe('useCanvasPopout', () => {
  const mockDescriptor: CanvasContextDescriptor = {
    id: 'test-context',
    label: 'Test Context',
    icon: Square,
    panels: {
      panel1: TestPanel,
    },
    layouts: [
      {
        id: 'single',
        label: 'Single',
        description: 'Single panel layout',
        icon: Square,
        category: 'generic',
        arrangement: { type: 'single', panel: '$first' },
      },
    ],
    popoutEnabled: true,
    popoutDefaults: {
      width: 800,
      height: 600,
      title: 'Test Popout',
    },
  };

  beforeEach(() => {
    // Reset canvas store
    useCanvasStore.setState({
      contexts: new Map(),
      activeContextId: null,
    });

    // Register test context
    useCanvasStore.getState().registerContext(mockDescriptor);

    vi.stubGlobal(
      'open',
      vi.fn(() => mockWindow)
    );
    mockWindow.closed = false;
    mockWindow.close.mockClear();
    mockWindow.postMessage.mockClear();
    mockWindow.addEventListener.mockClear();
    mockWindow.focus.mockClear();
    mockWindow.document.title = '';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return openPopout function and isSupported', () => {
    const { result } = renderHook(() => useCanvasPopout());

    expect(result.current.openPopout).toBeInstanceOf(Function);
    expect(result.current.isSupported).toBe(true);
  });

  it('should open popout window with correct URL', () => {
    const { result } = renderHook(() => useCanvasPopout());

    act(() => {
      result.current.openPopout('test-context');
    });

    expect(window.open).toHaveBeenCalledWith(
      '/canvas-popout/test-context',
      expect.any(String),
      expect.stringContaining('width=800')
    );
  });

  it('should use default dimensions if not specified', () => {
    const descriptorWithoutDefaults: CanvasContextDescriptor = {
      ...mockDescriptor,
      popoutDefaults: undefined,
    };

    // Re-register with new descriptor
    useCanvasStore.getState().registerContext(descriptorWithoutDefaults);

    const { result } = renderHook(() => useCanvasPopout());

    act(() => {
      result.current.openPopout('test-context');
    });

    expect(window.open).toHaveBeenCalledWith(
      '/canvas-popout/test-context',
      expect.any(String),
      expect.stringContaining('width=1024')
    );
  });

  it('should emit canvas.popout-requested event', () => {
    const eventSpy = vi.fn();
    globalEventBus.on('canvas.popout-requested', eventSpy);

    const { result } = renderHook(() => useCanvasPopout());

    act(() => {
      result.current.openPopout('test-context');
    });

    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'canvas.popout-requested',
        payload: { contextId: 'test-context' },
      })
    );

    globalEventBus.off('canvas.popout-requested', eventSpy);
  });

  it('should handle window open failure', () => {
    vi.stubGlobal(
      'open',
      vi.fn(() => null)
    );

    const { result } = renderHook(() => useCanvasPopout());

    act(() => {
      result.current.openPopout('test-context');
    });

    // Should not throw, just fail silently
    expect(window.open).toHaveBeenCalled();
  });

  it('should prevent opening multiple popouts for same context', () => {
    const { result } = renderHook(() => useCanvasPopout());

    act(() => {
      result.current.openPopout('test-context');
      result.current.openPopout('test-context');
    });

    // Should only open once
    expect(window.open).toHaveBeenCalledTimes(1);
  });

  it('should allow reopening after window is closed', () => {
    const { result } = renderHook(() => useCanvasPopout());

    act(() => {
      result.current.openPopout('test-context');
    });

    // Simulate window close
    mockWindow.closed = true;

    act(() => {
      result.current.openPopout('test-context');
    });

    expect(window.open).toHaveBeenCalledTimes(2);
  });

  it('should focus existing window if already open', () => {
    const { result } = renderHook(() => useCanvasPopout());

    act(() => {
      result.current.openPopout('test-context');
    });

    mockWindow.focus.mockClear();

    act(() => {
      result.current.openPopout('test-context');
    });

    expect(mockWindow.focus).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalledTimes(1); // Should not open a new window
  });

  it('should handle unknown context ID gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useCanvasPopout());

    act(() => {
      result.current.openPopout('unknown-context');
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Context "unknown-context" not found');
    expect(window.open).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
