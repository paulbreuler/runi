/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Focus visibility utilities for programmatic focus management
 * @module utils/focusVisibility
 *
 * Solves the browser inconsistency where :focus-visible may not activate
 * for programmatic .focus() calls. Uses a data-attribute approach that
 * CSS can target alongside :focus-visible.
 *
 * The `:focus-visible` pseudo-class is heuristic-based:
 * - Tab key: Always triggers :focus-visible
 * - Programmatic .focus(): May NOT trigger :focus-visible
 * - Mouse click: Never triggers :focus-visible
 *
 * This module provides `focusWithVisibility()` which adds a
 * `data-focus-visible-added` attribute that CSS can target to show
 * the same focus ring as :focus-visible.
 */

/**
 * Focus an element and ensure the focus ring is visible.
 *
 * This handles the browser inconsistency where :focus-visible may not
 * activate on programmatic .focus() calls during arrow key navigation.
 *
 * @param element - Element to focus (null-safe)
 * @param options - Standard FocusOptions (preventScroll, etc.)
 *
 * @example
 * ```tsx
 * // Instead of:
 * element.focus();
 *
 * // Use:
 * focusWithVisibility(element);
 * ```
 *
 * @behavior
 * 1. Removes `data-focus-visible-added` from any previously focused element
 * 2. Calls `element.focus(options)`
 * 3. Adds `data-focus-visible-added` attribute to element
 * 4. Registers blur listener to clean up attribute
 */
export function focusWithVisibility(element: HTMLElement | null, options?: FocusOptions): void {
  if (element === null) {
    return;
  }

  // Remove attribute from any previously focused element
  const previous = document.querySelector('[data-focus-visible-added]');
  if (previous !== null && previous !== element) {
    previous.removeAttribute('data-focus-visible-added');
  }

  // Focus the element
  element.focus(options);

  // Add data attribute to ensure visibility
  element.setAttribute('data-focus-visible-added', '');

  // Clean up on blur
  const cleanup = (): void => {
    element.removeAttribute('data-focus-visible-added');
    element.removeEventListener('blur', cleanup);
  };
  element.addEventListener('blur', cleanup, { once: true });
}

/**
 * Check if an element is editable (input, textarea, contenteditable).
 *
 * Use this to prevent keyboard navigation from interfering with text editing.
 * Arrow keys should work normally in editable fields for cursor movement.
 *
 * @param element - Element to check (null-safe)
 * @returns true if element is an input, textarea, or has contenteditable="true"
 *
 * @example
 * ```tsx
 * const handleKeyDown = (e: React.KeyboardEvent) => {
 *   if (isEditableElement(document.activeElement)) {
 *     return; // Don't intercept arrow keys in editable fields
 *   }
 *   // Handle navigation...
 * };
 * ```
 */
export function isEditableElement(element: Element | null): boolean {
  if (element === null) {
    return false;
  }

  const tagName = element.tagName.toUpperCase();
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
    return true;
  }

  // Check contentEditable attribute (works in both browser and JSDOM)
  const htmlElement = element as HTMLElement;
  if (
    htmlElement.isContentEditable ||
    htmlElement.contentEditable === 'true' ||
    htmlElement.getAttribute('contenteditable') === 'true'
  ) {
    return true;
  }

  return false;
}
