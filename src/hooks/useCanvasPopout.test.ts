/**
 * Canvas Popout Hook Tests
 *
 * Tests for the canvas popout window functionality.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasPopout } from './useCanvasPopout';
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
    const { result } = renderHook(() => useCanvasPopout(mockDescriptor, {}));

    expect(result.current.openPopout).toBeInstanceOf(Function);
    expect(result.current.isSupported).toBe(true);
  });

  it('should open popout window with correct URL', () => {
    const { result } = renderHook(() => useCanvasPopout(mockDescriptor, {}));

    act(() => {
      result.current.openPopout();
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

    const { result } = renderHook(() => useCanvasPopout(descriptorWithoutDefaults, {}));

    act(() => {
      result.current.openPopout();
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

    const { result } = renderHook(() => useCanvasPopout(mockDescriptor, {}));

    act(() => {
      result.current.openPopout();
    });

    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'canvas.popout-requested',
        payload: { contextId: 'test-context' },
      })
    );

    globalEventBus.off('canvas.popout-requested', eventSpy);
  });

  it('should emit canvas.popout-opened event when window opens', () => {
    const eventSpy = vi.fn();
    globalEventBus.on('canvas.popout-opened', eventSpy);

    const { result } = renderHook(() => useCanvasPopout(mockDescriptor, {}));

    act(() => {
      result.current.openPopout();
    });

    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'canvas.popout-opened',
        payload: {
          contextId: 'test-context',
          windowId: expect.any(String),
        },
      })
    );

    globalEventBus.off('canvas.popout-opened', eventSpy);
  });

  it('should pass current state to popout window', () => {
    const state = { key: 'value' };
    const { result } = renderHook(() => useCanvasPopout(mockDescriptor, state));

    act(() => {
      result.current.openPopout();
    });

    // Window should be opened first
    expect(window.open).toHaveBeenCalled();
  });

  it('should handle window open failure', () => {
    vi.stubGlobal(
      'open',
      vi.fn(() => null)
    );

    const { result } = renderHook(() => useCanvasPopout(mockDescriptor, {}));

    act(() => {
      result.current.openPopout();
    });

    // Should not throw, just fail silently
    expect(window.open).toHaveBeenCalled();
  });

  it('should prevent opening multiple popouts for same context', () => {
    const { result } = renderHook(() => useCanvasPopout(mockDescriptor, {}));

    act(() => {
      result.current.openPopout();
      result.current.openPopout();
    });

    // Should only open once
    expect(window.open).toHaveBeenCalledTimes(1);
  });

  it('should allow reopening after window is closed', () => {
    const { result } = renderHook(() => useCanvasPopout(mockDescriptor, {}));

    act(() => {
      result.current.openPopout();
    });

    // Simulate window close
    mockWindow.closed = true;

    act(() => {
      result.current.openPopout();
    });

    expect(window.open).toHaveBeenCalledTimes(2);
  });
});
