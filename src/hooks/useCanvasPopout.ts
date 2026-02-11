/**
 * Canvas Popout Hook
 *
 * Provides functionality for popping out canvas contexts into separate windows.
 */

import { useRef, useCallback } from 'react';
import type { CanvasContextDescriptor } from '@/types/canvas';
import { globalEventBus } from '@/events/bus';

interface UseCanvasPopoutReturn {
  /** Open the popout window */
  openPopout: () => void;
  /** Whether popout windows are supported */
  isSupported: boolean;
}

/**
 * Hook for managing canvas context popout windows.
 *
 * @param descriptor - The canvas context descriptor
 * @param currentState - Current state to pass to the popout window
 * @returns Popout control functions
 */
export const useCanvasPopout = (
  descriptor: CanvasContextDescriptor,
  currentState: Record<string, unknown>
): UseCanvasPopoutReturn => {
  const popoutWindowRef = useRef<Window | null>(null);
  const windowIdRef = useRef<string | null>(null);

  // Check if popout is supported
  const isSupported = typeof window !== 'undefined' && typeof window.open === 'function';

  const openPopout = useCallback((): void => {
    // Check if window already exists and is still open
    if (popoutWindowRef.current !== null && !popoutWindowRef.current.closed) {
      // Focus existing window
      popoutWindowRef.current.focus();
      return;
    }

    // Emit popout requested event
    globalEventBus.emit('canvas.popout-requested', {
      contextId: descriptor.id,
    });

    // Get dimensions from descriptor or use defaults
    const width = descriptor.popoutDefaults?.width ?? 1024;
    const height = descriptor.popoutDefaults?.height ?? 768;
    const title = descriptor.popoutDefaults?.title ?? descriptor.label;

    // Calculate position to center the window
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // Window features
    const features = [
      `width=${String(width)}`,
      `height=${String(height)}`,
      `left=${String(left)}`,
      `top=${String(top)}`,
      'menubar=no',
      'toolbar=no',
      'location=no',
      'status=no',
      'resizable=yes',
      'scrollbars=yes',
    ].join(',');

    // Open the window
    const popoutWindow = window.open(
      `/canvas-popout/${descriptor.id}`,
      `canvas-popout-${descriptor.id}`,
      features
    );

    if (popoutWindow !== null) {
      popoutWindowRef.current = popoutWindow;
      windowIdRef.current = `canvas-popout-${descriptor.id}-${String(Date.now())}`;

      // Set window title when document is ready
      popoutWindow.document.title = title;

      // Emit popout opened event
      globalEventBus.emit('canvas.popout-opened', {
        contextId: descriptor.id,
        windowId: windowIdRef.current,
      });

      // Listen for window close
      const checkClosed = setInterval(() => {
        if (popoutWindow.closed) {
          clearInterval(checkClosed);
          const currentWindowId = windowIdRef.current;
          if (currentWindowId !== null) {
            globalEventBus.emit('canvas.popout-closed', {
              contextId: descriptor.id,
              windowId: currentWindowId,
            });
          }
          popoutWindowRef.current = null;
          windowIdRef.current = null;
        }
      }, 500);

      // Pass current state to popout window when it loads
      popoutWindow.addEventListener('load', () => {
        popoutWindow.postMessage(
          {
            type: 'canvas-state',
            contextId: descriptor.id,
            state: currentState,
          },
          window.location.origin
        );
      });
    }
  }, [descriptor, currentState]);

  return {
    openPopout,
    isSupported,
  };
};
