/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useState, useEffect } from 'react';
import { getCurrentWindow, type Window } from '@tauri-apps/api/window';

/**
 * Hook to track whether the current Tauri window has focus.
 * Useful for dimmed/muted UI states when the app is in the background.
 */
export const useWindowFocus = (): boolean => {
  const [isFocused, setIsFocused] = useState(() =>
    typeof document !== 'undefined' && typeof document.hasFocus === 'function'
      ? document.hasFocus()
      : true
  );

  useEffect(() => {
    let appWindow: Window | null = null;
    try {
      appWindow = getCurrentWindow();
    } catch {
      // Not in Tauri context
    }

    const handleFocus = (): void => {
      setIsFocused(true);
    };

    const handleBlur = (): void => {
      setIsFocused(false);
    };

    // Fallback listeners for web context or if Tauri listener fails
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Listen to Tauri window focus/blur events if available
    let cleanupFocus: (() => void) | undefined;
    let cleanupBlur: (() => void) | undefined;
    let isMounted = true;

    if (appWindow !== null) {
      void appWindow.listen('tauri://focus', handleFocus).then((unsubscribe: () => void) => {
        if (isMounted) {
          cleanupFocus = unsubscribe;
        } else {
          unsubscribe();
        }
      });

      void appWindow.listen('tauri://blur', handleBlur).then((unsubscribe: () => void) => {
        if (isMounted) {
          cleanupBlur = unsubscribe;
        } else {
          unsubscribe();
        }
      });
    }

    return (): void => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      cleanupFocus?.();
      cleanupBlur?.();
    };
  }, []);

  return isFocused;
};
