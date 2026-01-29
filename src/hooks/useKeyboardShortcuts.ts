/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useRef } from 'react';
import { createKeyboardHandler } from '@/utils/keyboard';
import type { KeyboardShortcut } from '@/utils/keyboard';

export function useKeyboardShortcuts(shortcut: KeyboardShortcut): void {
  const handlerRef = useRef<(() => void) | null>(null);
  const shortcutRef = useRef(shortcut);

  // Update ref when shortcut changes
  useEffect(() => {
    shortcutRef.current = shortcut;
  }, [shortcut]);

  useEffect(() => {
    // Cleanup previous handler
    if (handlerRef.current !== null) {
      handlerRef.current();
    }

    // Create new handler with current shortcut
    handlerRef.current = createKeyboardHandler(shortcutRef.current);

    // Return cleanup function
    return (): void => {
      if (handlerRef.current !== null) {
        handlerRef.current();
        handlerRef.current = null;
      }
    };
  }, [shortcut.key, shortcut.modifier, shortcut.handler]);
}
