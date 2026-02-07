/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useCallback } from 'react';
import { focusWithVisibility } from '@/utils/focusVisibility';

interface ListNavigationOptions {
  /** Selector to find focusable items within the container */
  itemSelector: string;
  /** Whether to loop from end to beginning */
  loop?: boolean;
}

/**
 * Hook for list-based keyboard navigation (ArrowUp/Down, Home/End).
 */
export function useListNavigation(options: ListNavigationOptions): {
  handleKeyDown: (e: React.KeyboardEvent) => void;
} {
  const { itemSelector, loop = true } = options;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const container = e.currentTarget as HTMLElement;
      const items = Array.from(container.querySelectorAll<HTMLElement>(itemSelector)).filter(
        (item) => {
          const style = window.getComputedStyle(item);
          return style.display !== 'none' && style.visibility !== 'hidden';
        }
      );

      if (items.length === 0) {
        return;
      }

      const activeElement = document.activeElement as HTMLElement;
      const currentIndex = items.indexOf(activeElement);

      let targetIndex = -1;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex === -1 || currentIndex === items.length - 1) {
            targetIndex = loop ? 0 : items.length - 1;
          } else {
            targetIndex = currentIndex + 1;
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex <= 0) {
            targetIndex = loop ? items.length - 1 : 0;
          } else {
            targetIndex = currentIndex - 1;
          }
          break;
        case 'Home':
          e.preventDefault();
          targetIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          targetIndex = items.length - 1;
          break;
        default:
          return;
      }

      if (targetIndex !== -1) {
        const targetItem = items[targetIndex];
        if (targetItem !== undefined) {
          focusWithVisibility(targetItem);
        }
      }
    },
    [itemSelector, loop]
  );

  return { handleKeyDown };
}
