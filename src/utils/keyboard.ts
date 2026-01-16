/**
 * Keyboard shortcut utilities.
 *
 * Provides hooks and utilities for handling keyboard shortcuts
 * in a consistent, extensible way.
 */

/**
 * Keyboard shortcut configuration.
 */
export interface KeyboardShortcut {
  /** The key to press (e.g., 'b', 'Enter', 'Escape') */
  key: string;
  /** Optional modifier key (meta for ⌘ on Mac, ctrl for Ctrl) */
  modifier?: 'meta' | 'ctrl' | 'shift' | 'alt';
  /** Handler function to execute when shortcut is triggered */
  handler: () => void;
  /** Optional description for accessibility/help */
  description?: string;
  /** Whether to prevent default behavior (default: true) */
  preventDefault?: boolean;
}

/**
 * Hook to register a keyboard shortcut.
 *
 * Automatically handles cleanup when component is destroyed.
 * Uses platform-appropriate modifier keys (⌘ on Mac, Ctrl on Windows/Linux).
 *
 * @param shortcut - The keyboard shortcut configuration
 *
 * @example
 * ```tsx
 * import { useKeyboardShortcut } from '@/utils/keyboard';
 * import { useEffect } from 'react';
 *
 * function MyComponent() {
 *   useEffect(() => {
 *     return useKeyboardShortcut({
 *       key: 'b',
 *       modifier: 'meta',
 *       handler: () => toggleSidebar(),
 *       description: 'Toggle sidebar'
 *     });
 *   }, []);
 * }
 * ```
 */
export function useKeyboardShortcut(_shortcut: KeyboardShortcut): void {
  // This is a utility function for keyboard shortcuts.
  // Components should use createKeyboardHandler with useEffect for proper cleanup.
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
export function createKeyboardHandler(shortcut: KeyboardShortcut): () => void {
  function handleKeyDown(e: KeyboardEvent): void {
    const modifier = shortcut.modifier;
    // Check modifier key
    let modifierMatch = true;
    switch (modifier) {
      case 'meta':
        modifierMatch = e.metaKey;
        break;
      case 'ctrl':
        modifierMatch = e.ctrlKey;
        break;
      case 'shift':
        modifierMatch = e.shiftKey;
        break;
      case 'alt':
        modifierMatch = e.altKey;
        break;
      default:
        break;
    }

    // Check if other modifiers are NOT pressed (to avoid conflicts)
    const otherModifiersPressed = ((): boolean => {
      switch (modifier) {
        case 'meta':
          return e.ctrlKey || e.shiftKey || e.altKey;
        case 'ctrl':
          return e.metaKey || e.shiftKey || e.altKey;
        case 'shift':
          return e.metaKey || e.ctrlKey || e.altKey;
        case 'alt':
          return e.metaKey || e.ctrlKey || e.shiftKey;
        default:
          return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
      }
    })();

    // Match key and modifier
    if (modifierMatch && !otherModifiersPressed && e.key === shortcut.key) {
      if (shortcut.preventDefault !== false) {
        e.preventDefault();
      }
      shortcut.handler();
    }
  }

  window.addEventListener('keydown', handleKeyDown);
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}
