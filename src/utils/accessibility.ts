/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Accessibility utilities
 * @description Reusable utilities for consistent accessibility patterns across custom components
 *
 * Provides:
 * - Standard focus ring classes (blue, 1.5px, with offset)
 * - Focus visibility hook for hover-only elements
 * - Focus management helpers
 */

import * as React from 'react';

/**
 * Standard focus ring classes for interactive elements.
 *
 * Follows WCAG 2.1 AA requirements:
 * - 1.5px ring width for visibility (Zen aesthetic)
 * - Theme accent color token (--accent-a8) for consistency
 * - 2px offset for better visibility on dark backgrounds
 * - Uses :focus-visible (only shows on keyboard focus, not mouse clicks)
 *
 * Supports BOTH:
 * - Native :focus-visible (Tab key, some programmatic focus)
 * - Programmatic focus via [data-focus-visible-added] attribute
 *
 * This ensures arrow key navigation shows the same focus ring as Tab navigation.
 * Use `focusWithVisibility()` from `@/utils/focusVisibility` for programmatic focus.
 *
 * @example
 * ```tsx
 * <button className={cn(focusRingClasses, 'px-4 py-2')}>
 *   Click me
 * </button>
 * ```
 *
 * @see focusWithVisibility - Use this when calling .focus() programmatically
 */
export const focusRingClasses = [
  'outline-none',
  // Native :focus-visible (Tab key, some browsers handle programmatic focus)
  'focus-visible:ring-[1.5px]',
  'focus-visible:ring-[color:var(--accent-a8)]',
  'focus-visible:ring-offset-2',
  'focus-visible:ring-offset-bg-app',
  // Programmatic focus visibility (arrow key navigation)
  // Uses attribute selector with :focus to ensure element is actually focused
  '[&[data-focus-visible-added]:focus]:ring-[1.5px]',
  '[&[data-focus-visible-added]:focus]:ring-[color:var(--accent-a8)]',
  '[&[data-focus-visible-added]:focus]:ring-offset-2',
  '[&[data-focus-visible-added]:focus]:ring-offset-bg-app',
].join(' ');

/**
 * Focus ring classes for controls rendered inside clipped/overflow containers.
 *
 * Uses inset ring and zero offset to avoid focus clipping when parent containers
 * use overflow constraints (common in tab strips, list rows, and compact headers).
 */
export const containedFocusRingClasses = [
  'outline-none',
  'focus-visible:outline-[1.5px]',
  'focus-visible:outline-[color:var(--accent-a8)]',
  'focus-visible:outline-offset-[-1.5px]',
  'focus-visible:ring-[1.5px]',
  'focus-visible:ring-[color:var(--accent-a8)]',
  'focus-visible:!ring-offset-0',
  'focus-visible:ring-inset',
  'focus-visible:shadow-[inset_1.5px_0_0_var(--accent-a8),inset_-1.5px_0_0_var(--accent-a8)]',
  '[&[data-focus-visible-added]:focus]:outline-[1.5px]',
  '[&[data-focus-visible-added]:focus]:outline-[color:var(--accent-a8)]',
  '[&[data-focus-visible-added]:focus]:outline-offset-[-1.5px]',
  '[&[data-focus-visible-added]:focus]:ring-[1.5px]',
  '[&[data-focus-visible-added]:focus]:ring-[color:var(--accent-a8)]',
  '[&[data-focus-visible-added]:focus]:!ring-offset-0',
  '[&[data-focus-visible-added]:focus]:ring-inset',
  '[&[data-focus-visible-added]:focus]:shadow-[inset_1.5px_0_0_var(--accent-a8),inset_-1.5px_0_0_var(--accent-a8)]',
].join(' ');

/**
 * Muted focus treatment for composite containers.
 *
 * Use on the parent wrapper of grouped interactive controls
 * (e.g. method select + URL input + send button) so users can
 * see focus is within the composite without overpowering the
 * active child control indicator.
 */
export const compositeFocusContainerClasses = [
  'focus-within:border-border-default',
  'focus-within:ring-1',
  'focus-within:ring-[color:var(--color-border-default)]',
].join(' ');

/**
 * Primary focus treatment for an active item inside a composite control.
 *
 * Keeps Base UI's focus semantics while tuning visuals for grouped controls:
 * - ring offset is removed so focus stays within tight composite bounds
 * - inset ring prevents clipping when parent uses overflow-hidden
 * - z-index lifts focused item above separators/siblings
 */
export const compositeFocusItemClasses = [
  'focus-visible:ring-[1.5px]',
  'focus-visible:ring-[color:var(--accent-a8)]',
  'focus-visible:!ring-offset-0',
  'focus-visible:ring-inset',
  'focus-visible:shadow-[inset_1.5px_0_0_var(--accent-a8),inset_-1.5px_0_0_var(--accent-a8)]',
  'focus-visible:z-10',
  '[&[data-focus-visible-added]:focus]:ring-[1.5px]',
  '[&[data-focus-visible-added]:focus]:ring-[color:var(--accent-a8)]',
  '[&[data-focus-visible-added]:focus]:!ring-offset-0',
  '[&[data-focus-visible-added]:focus]:ring-inset',
  '[&[data-focus-visible-added]:focus]:shadow-[inset_1.5px_0_0_var(--accent-a8),inset_-1.5px_0_0_var(--accent-a8)]',
  '[&[data-focus-visible-added]:focus]:z-10',
].join(' ');

/**
 * Hook for hover-only elements that need to show on focus.
 *
 * Tracks focus within a container element and returns visibility state.
 * Useful for action buttons that are hidden by default and shown on hover,
 * but also need to be visible when focused via keyboard navigation.
 *
 * @param containerRef - Ref to the container element that contains interactive children
 * @returns Boolean indicating if any child element within the container has focus
 *
 * @example
 * ```tsx
 * const containerRef = React.useRef<HTMLDivElement>(null);
 * const isVisible = useFocusVisible(containerRef);
 *
 * return (
 *   <div
 *     ref={containerRef}
 *     className={cn(
 *       'transition-opacity',
 *       isVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
 *     )}
 *   >
 *     <button>Action</button>
 *   </div>
 * );
 * ```
 */
export function useFocusVisible<T extends HTMLElement = HTMLElement>(
  containerRef: React.RefObject<T | null>
): boolean {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const container = containerRef.current;

    if (container === null) {
      return;
    }

    const handleFocusIn = (): void => {
      setIsVisible(true);
    };

    const handleFocusOut = (e: FocusEvent): void => {
      // Check if focus is moving to another element within the container
      const relatedTarget = e.relatedTarget as Node | null;
      if (relatedTarget !== null && container.contains(relatedTarget)) {
        return; // Focus is still within the container
      }
      setIsVisible(false);
    };

    container.addEventListener('focusin', handleFocusIn);
    container.addEventListener('focusout', handleFocusOut);

    return (): void => {
      container.removeEventListener('focusin', handleFocusIn);
      container.removeEventListener('focusout', handleFocusOut);
    };
  }, [containerRef]);

  return isVisible;
}
