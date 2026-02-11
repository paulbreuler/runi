/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * Keyboard shortcut utilities.
 *
 * Provides hooks and utilities for handling keyboard shortcuts
 * in a consistent, extensible way.
 */

/**
 * Modifier key type.
 */
export type ModifierKey = 'meta' | 'ctrl' | 'shift' | 'alt';

/**
 * Normalize modifier to an array.
 * Handles undefined, single modifier, or array of modifiers.
 */
function normalizeModifiers(modifier: ModifierKey | ModifierKey[] | undefined): ModifierKey[] {
  if (modifier === undefined) {
    return [];
  }
  if (Array.isArray(modifier)) {
    return modifier;
  }
  return [modifier];
}

/**
 * Keyboard shortcut configuration.
 */
export interface KeyboardShortcut {
  /** The key to press (e.g., 'b', 'Enter', 'Escape') */
  key: string;
  /** Optional modifier key(s) - single modifier or array for compound shortcuts */
  modifier?: ModifierKey | ModifierKey[];
  /** Handler function to execute when shortcut is triggered */
  handler: () => void;
  /** Optional description for accessibility/help */
  description?: string;
  /** Whether to prevent default behavior (default: true) */
  preventDefault?: boolean;
}

/**
 * Creates a keyboard event handler for a shortcut.
 *
 * This is a lower-level utility that can be used with React's useEffect.
 *
 * @param shortcut - The keyboard shortcut configuration
 * @returns A cleanup function to remove the event listener
 *
 * @example
 * ```tsx
 * import { createKeyboardHandler } from '@/utils/keyboard';
 * import { useEffect } from 'react';
 *
 * function MyComponent() {
 *   useEffect(() => {
 *     return createKeyboardHandler({
 *       key: 'b',
 *       modifier: 'meta',
 *       handler: () => toggleSidebar()
 *     });
 *   }, []);
 * }
 * ```
 */
/**
 * Checks if a specific modifier is pressed.
 */
function isModifierPressed(e: KeyboardEvent, mod: ModifierKey): boolean {
  switch (mod) {
    case 'meta':
      return e.metaKey;
    case 'ctrl':
      return e.ctrlKey;
    case 'shift':
      return e.shiftKey;
    case 'alt':
      return e.altKey;
  }
}

/**
 * Creates a keyboard event handler for a shortcut.
 *
 * Supports both single and compound modifiers (e.g., ['meta', 'shift']).
 */
export function createKeyboardHandler(shortcut: KeyboardShortcut): () => void {
  function handleKeyDown(e: KeyboardEvent): void {
    const { modifier, key } = shortcut;

    // Normalize modifier to array
    const requiredModifiers: ModifierKey[] = normalizeModifiers(modifier);

    // All modifier keys
    const allModifiers: ModifierKey[] = ['meta', 'ctrl', 'shift', 'alt'];

    // Check all required modifiers are pressed
    const requiredPressed = requiredModifiers.every((mod) => isModifierPressed(e, mod));

    // Check that no extra modifiers are pressed
    const extraModifiersPressed = allModifiers.some(
      (mod) => !requiredModifiers.includes(mod) && isModifierPressed(e, mod)
    );

    // Match key (case-insensitive for letter keys)
    const keyMatches = e.key.toLowerCase() === key.toLowerCase() || e.key === key;

    if (requiredPressed && !extraModifiersPressed && keyMatches) {
      if (shortcut.preventDefault !== false) {
        e.preventDefault();
      }
      shortcut.handler();
    }
  }

  window.addEventListener('keydown', handleKeyDown);
  return (): void => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}
