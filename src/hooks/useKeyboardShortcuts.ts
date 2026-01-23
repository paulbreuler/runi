/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useEffect } from 'react';
import { createKeyboardHandler } from '@/utils/keyboard';
import type { KeyboardShortcut } from '@/utils/keyboard';

export function useKeyboardShortcuts(shortcut: KeyboardShortcut): void {
  useEffect(() => {
    return createKeyboardHandler(shortcut);
  }, [shortcut]);
}
