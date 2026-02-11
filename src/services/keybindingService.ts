/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Keybinding service.
 *
 * Single keydown listener that resolves keyboard events to commands.
 * Replaces all scattered `useKeyboardShortcuts` / `createKeyboardHandler`
 * calls with one central resolution path:
 *
 *   keydown event → serialize key → lookup in store → execute via registry
 *
 * This service is a plain class (not a React component) with start/stop
 * lifecycle methods. Mount it once in the root layout via useEffect.
 */

import { globalCommandRegistry } from '@/commands/registry';
import { useKeybindingStore } from '@/stores/useKeybindingStore';
import { isEditableElement } from '@/utils/focusVisibility';
import type { ModifierKey } from '@/utils/keyboard';

/**
 * Extract active modifiers from a keyboard event.
 */
function extractModifiers(e: KeyboardEvent): ModifierKey[] {
  const modifiers: ModifierKey[] = [];
  if (e.metaKey) {
    modifiers.push('meta');
  }
  if (e.ctrlKey) {
    modifiers.push('ctrl');
  }
  if (e.shiftKey) {
    modifiers.push('shift');
  }
  if (e.altKey) {
    modifiers.push('alt');
  }
  return modifiers;
}

/**
 * Central keybinding service. Attaches a single keydown listener
 * to the window, resolves keys via the keybinding store, and
 * executes commands via the global command registry.
 */
export class KeybindingService {
  private handler: ((e: KeyboardEvent) => void) | null = null;

  /**
   * Start listening for keyboard events.
   * Idempotent — calling start() twice has no effect.
   */
  public start(): void {
    if (this.handler !== null) {
      return;
    }

    this.handler = (e: KeyboardEvent): void => {
      this.handleKeydown(e);
    };

    window.addEventListener('keydown', this.handler);
  }

  /**
   * Stop listening for keyboard events.
   * Idempotent — calling stop() without start() is safe.
   */
  public stop(): void {
    if (this.handler === null) {
      return;
    }

    window.removeEventListener('keydown', this.handler);
    this.handler = null;
  }

  /**
   * Handle a keydown event: resolve to command and execute.
   */
  private handleKeydown(e: KeyboardEvent): void {
    // Don't intercept during IME composition (CJK input)
    if (e.isComposing) {
      return;
    }

    const modifiers = extractModifiers(e);

    // No modifiers → not a global shortcut, let it through
    if (modifiers.length === 0) {
      return;
    }

    // Don't intercept shortcuts when user is typing in an editable element
    // (checked early to avoid store lookup on every modified keypress in inputs)
    if (e.target instanceof Element && isEditableElement(e.target)) {
      return;
    }

    // Look up the command for this key combo
    const { getCommandForKey } = useKeybindingStore.getState();
    const commandId = getCommandForKey(e.key, modifiers);

    if (commandId === undefined) {
      return;
    }

    // Prevent browser default (e.g., Cmd+T opening new browser tab)
    e.preventDefault();

    // Execute the command via the registry
    globalCommandRegistry.execute(commandId).catch((error: unknown) => {
      console.error(`KeybindingService: failed to execute command '${commandId}'`, error);
    });
  }
}
