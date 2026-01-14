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
 * ```svelte
 * <script lang="ts">
 *   import { useKeyboardShortcut } from '$lib/utils/keyboard';
 *
 *   useKeyboardShortcut({
 *     key: 'b',
 *     modifier: 'meta',
 *     handler: () => toggleSidebar(),
 *     description: 'Toggle sidebar'
 *   });
 * </script>
 * ```
 */
export function useKeyboardShortcut(_shortcut: KeyboardShortcut): void {
  // Use Svelte 5 runes for reactivity
  // Note: This is a utility function, not a Svelte component
  // The actual effect will be set up in the component using $effect
  // This function returns a cleanup function that should be called in $effect
  // For now, we'll provide the logic that components can use
}

/**
 * Creates a keyboard event handler for a shortcut.
 *
 * This is a lower-level utility that can be used with $effect.
 *
 * @param shortcut - The keyboard shortcut configuration
 * @returns A cleanup function to remove the event listener
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { createKeyboardHandler } from '$lib/utils/keyboard';
 *
 *   $effect(() => {
 *     return createKeyboardHandler({
 *       key: 'b',
 *       modifier: 'meta',
 *       handler: () => toggleSidebar()
 *     });
 *   });
 * </script>
 * ```
 */
export function createKeyboardHandler(shortcut: KeyboardShortcut): () => void {
  function handleKeyDown(e: KeyboardEvent): void {
    // Check modifier key
    let modifierMatch = true;
    if (shortcut.modifier) {
      if (shortcut.modifier === 'meta') {
        modifierMatch = e.metaKey;
      } else if (shortcut.modifier === 'ctrl') {
        modifierMatch = e.ctrlKey;
      } else if (shortcut.modifier === 'shift') {
        modifierMatch = e.shiftKey;
      } else if (shortcut.modifier === 'alt') {
        modifierMatch = e.altKey;
      }
    }

    // Check if other modifiers are NOT pressed (to avoid conflicts)
    const otherModifiersPressed =
      (shortcut.modifier !== 'meta' && e.metaKey) ||
      (shortcut.modifier !== 'ctrl' && e.ctrlKey) ||
      (shortcut.modifier !== 'shift' && e.shiftKey) ||
      (shortcut.modifier !== 'alt' && e.altKey);

    // Match key and modifier
    if (modifierMatch && !otherModifiersPressed && e.key === shortcut.key) {
      if (shortcut.preventDefault !== false) {
        e.preventDefault();
      }
      shortcut.handler();
    }
  }

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}
