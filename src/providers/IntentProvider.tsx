/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect } from 'react';

/**
 * IntentProvider tracks whether the user is currently using a mouse or keyboard.
 * It applies a `data-intent` attribute to document.documentElement (html).
 *
 * CSS can then use this attribute to suppress focus rings for mouse users:
 * html[data-intent="mouse"] *:focus { outline: none; }
 */
export const IntentProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  useEffect(() => {
    const root = document.documentElement;

    const handlePointerDown = (): void => {
      root.setAttribute('data-intent', 'mouse');
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
      // Treat any non-modifier key press as keyboard intent.
      // This covers navigation keys (Tab, arrows, Home/End, PageUp/PageDown),
      // activation keys (Enter, Space, Escape), character keys, and shortcuts
      // involving Ctrl/Cmd/Alt that may move focus or open focusable UI.
      const modifierKeys = [
        'Shift',
        'Control',
        'Alt',
        'Meta',
        'AltGraph',
        'CapsLock',
        'NumLock',
        'ScrollLock',
      ];

      if (!modifierKeys.includes(e.key)) {
        root.setAttribute('data-intent', 'keyboard');
      }
    };

    // Set initial intent
    root.setAttribute('data-intent', 'mouse');

    window.addEventListener('pointerdown', handlePointerDown, { capture: true, passive: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true, passive: true });

    return (): void => {
      window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);

  return <>{children}</>;
};
