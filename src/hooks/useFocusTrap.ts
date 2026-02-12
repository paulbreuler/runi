/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useEffect, type RefObject } from 'react';
import { focusWithVisibility } from '@/utils/focusVisibility';

/**
 * Hook to trap focus within a container element.
 * Useful for modals, dialogs, and overlays.
 *
 * @param containerRef - Ref to the container element
 * @param active - Whether the focus trap is active
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    if (!active || containerRef.current === null) {
      return;
    }

    const container = containerRef.current;

    const getFocusableElements = (): HTMLElement[] => {
      return Array.from(
        container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab: wrap from first to last
        if (document.activeElement === firstElement) {
          e.preventDefault();
          if (lastElement !== undefined) {
            focusWithVisibility(lastElement);
          }
        }
      } else {
        // Tab: wrap from last to first
        if (document.activeElement === lastElement) {
          e.preventDefault();
          if (firstElement !== undefined) {
            focusWithVisibility(firstElement);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return (): void => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, containerRef]);
}
