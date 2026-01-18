import { useCallback, useEffect, useRef } from 'react';
import { usePanelStore } from '@/stores/usePanelStore';

/**
 * Hook for managing pop-out DevTools window.
 *
 * Uses Tauri WebviewWindow API to create and manage a separate window
 * for the DevTools panel.
 *
 * @returns Object with openPopout and closePopout functions
 */
export interface UsePopoutWindowReturn {
  /** Open the DevTools in a separate window */
  openPopout: () => Promise<void>;
  /** Close the popout window and re-dock the panel */
  closePopout: () => void;
  /** Whether a popout window is currently open */
  isPopoutOpen: boolean;
}

export const usePopoutWindow = (): UsePopoutWindowReturn => {
  const { isPopout, setPopout, setVisible } = usePanelStore();
  const popoutWindowRef = useRef<Window | null>(null);

  const openPopout = useCallback(async (): Promise<void> => {
    // Try Tauri first, fall back to regular window.open
    try {
      const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');

      const webview = new WebviewWindow('devtools-popout', {
        url: '/devtools-popout',
        title: 'DevTools - Network History',
        width: 800,
        height: 600,
        resizable: true,
        decorations: true,
        center: true,
      });

      // Listen for window close event
      void webview.once('tauri://close-requested', () => {
        setPopout(false);
        // Re-show the docked panel when popout closes
        setVisible(true);
      });

      // Listen for window creation success
      void webview.once('tauri://created', () => {
        setPopout(true);
        // Hide the docked panel while popout is open
        setVisible(false);
      });

      // Listen for window creation error
      void webview.once('tauri://error', (error) => {
        console.error('Failed to open DevTools popout window:', error);
      });
    } catch {
      // Fallback for non-Tauri environment (e.g., browser during dev)
      const newWindow = window.open(
        '/devtools-popout',
        'devtools-popout',
        'width=800,height=600,resizable=yes'
      );

      if (newWindow !== null) {
        popoutWindowRef.current = newWindow;
        setPopout(true);
        setVisible(false);

        // Poll to check if window was closed
        const checkClosed = setInterval(() => {
          if (newWindow.closed) {
            clearInterval(checkClosed);
            popoutWindowRef.current = null;
            setPopout(false);
            setVisible(true);
          }
        }, 500);
      }
    }
  }, [setPopout, setVisible]);

  const closePopout = useCallback((): void => {
    // Try Tauri first
    void (async (): Promise<void> => {
      try {
        const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
        const webview = await WebviewWindow.getByLabel('devtools-popout');
        if (webview !== null) {
          await webview.close();
        }
      } catch {
        // Fallback for non-Tauri environment
        if (popoutWindowRef.current !== null && !popoutWindowRef.current.closed) {
          popoutWindowRef.current.close();
          popoutWindowRef.current = null;
        }
      }
    })();

    setPopout(false);
    setVisible(true);
  }, [setPopout, setVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return (): void => {
      if (popoutWindowRef.current !== null && !popoutWindowRef.current.closed) {
        popoutWindowRef.current.close();
      }
    };
  }, []);

  return {
    openPopout,
    closePopout,
    isPopoutOpen: isPopout,
  };
};
