/**
 * @file Accessibility utilities
 * @description Reusable utilities for consistent accessibility patterns across custom components
 *
 * Provides:
 * - Standard focus ring classes (blue, 2px, with offset)
 * - Focus visibility hook for hover-only elements
 * - Focus management helpers
 */

import * as React from 'react';

/**
 * Standard focus ring classes for interactive elements.
 *
 * Follows WCAG 2.1 AA requirements:
 * - 2px ring width for visibility
 * - Blue accent color (accent-blue) for consistency
 * - 2px offset for better visibility on dark backgrounds
 * - Uses :focus-visible (only shows on keyboard focus, not mouse clicks)
 *
 * @example
 * ```tsx
 * <button className={cn(focusRingClasses, 'px-4 py-2')}>
 *   Click me
 * </button>
 * ```
 */
export const focusRingClasses =
  'outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app';

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
