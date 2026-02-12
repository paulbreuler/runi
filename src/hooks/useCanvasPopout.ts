/**
 * Canvas Popout Hook
 *
 * Provides functionality for popping out canvas contexts into separate windows.
 */

import { useRef, useCallback, useEffect } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { globalEventBus } from '@/events/bus';

interface UseCanvasPopoutReturn {
  /** Open the popout window for a given context ID */
  openPopout: (contextId: string) => void;
  /** Whether popout windows are supported */
  isSupported: boolean;
}

/**
 * Hook for managing canvas context popout windows.
 *
 * @returns Popout control functions
 */
export const useCanvasPopout = (): UseCanvasPopoutReturn => {
  const popoutWindowsRef = useRef<Map<string, Window>>(new Map());
  const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const { contexts } = useCanvasStore();

  // Check if popout is supported (Tauri webview context detection)
  const isSupported = typeof window !== 'undefined' && typeof window.open === 'function';

  const openPopout = useCallback(
    (contextId: string): void => {
      // Check if window already exists and is still open
      const existingWindow = popoutWindowsRef.current.get(contextId);
      if (existingWindow !== undefined && !existingWindow.closed) {
        // Focus existing window
        existingWindow.focus();
        return;
      }

      // Get context descriptor
      const descriptor = contexts.get(contextId);
      if (descriptor === undefined) {
        console.error(`Context "${contextId}" not found`);
        return;
      }

      // Emit popout requested event
      globalEventBus.emit('canvas.popout-requested', {
        contextId,
      });

      // Get dimensions from descriptor or use defaults
      const width = descriptor.popoutDefaults?.width ?? 1024;
      const height = descriptor.popoutDefaults?.height ?? 768;
      const title = descriptor.popoutDefaults?.title ?? descriptor.label;

      // Calculate position to center the window
      const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
      const top = Math.round(window.screenY + (window.outerHeight - height) / 2);

      // Window features
      const features = [
        `width=${width.toString()}`,
        `height=${height.toString()}`,
        `left=${left.toString()}`,
        `top=${top.toString()}`,
        'menubar=no',
        'toolbar=no',
        'location=no',
        'status=no',
        'resizable=yes',
        'scrollbars=yes',
      ].join(',');

      // Open the window
      const popoutWindow = window.open(
        `/canvas-popout/${contextId}`,
        `canvas-popout-${contextId}`,
        features
      );

      if (popoutWindow !== null) {
        popoutWindowsRef.current.set(contextId, popoutWindow);

        // Set window title when document is ready
        popoutWindow.document.title = title;

        // Listen for window close
        const checkClosed = setInterval(() => {
          if (popoutWindow.closed) {
            clearInterval(checkClosed);
            intervalsRef.current.delete(checkClosed);
            popoutWindowsRef.current.delete(contextId);
          }
        }, 500);
        intervalsRef.current.add(checkClosed);
      }
    },
    [contexts]
  );

  // Cleanup all intervals on unmount
  useEffect(() => {
    const intervals = intervalsRef.current;
    return (): void => {
      intervals.forEach((interval) => {
        clearInterval(interval);
      });
      intervals.clear();
    };
  }, []);

  return {
    openPopout,
    isSupported,
  };
};
