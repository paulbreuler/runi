/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useCallback } from 'react';
import { focusWithVisibility } from '@/utils/focusVisibility';

interface ListNavigationOptions {
  /** Selector to find focusable items within the container */
  itemSelector: string;
  /** Optional selector to find the "active" or "selected" item if nothing is focused */
  activeItemSelector?: string;
  /** Whether to loop from end to beginning */
  loop?: boolean;
}

/**
 * Hook for list-based keyboard navigation (ArrowUp/Down, Home/End).
 */
export function useListNavigation(options: ListNavigationOptions): {
  handleKeyDown: (e: React.KeyboardEvent) => void;
} {
  const { itemSelector, activeItemSelector, loop = true } = options;

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

      // 1. Try to find focus via e.target (more robust than document.activeElement)
      const target = e.target as HTMLElement;
      const focusedItem = items.includes(target)
        ? target
        : target.closest<HTMLElement>(itemSelector);

      let currentIndex = focusedItem !== null ? items.indexOf(focusedItem) : -1;

      // 2. If nothing focused, try to find the "active" or "selected" item
      if (currentIndex === -1 && activeItemSelector !== undefined && activeItemSelector !== '') {
        const activeItem = container.querySelector<HTMLElement>(activeItemSelector);
        if (activeItem !== null) {
          currentIndex = items.indexOf(activeItem);
        }
      }

      let targetIndex = -1;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex === -1) {
            targetIndex = 0;
          } else if (currentIndex === items.length - 1) {
            targetIndex = loop ? 0 : items.length - 1;
          } else {
            targetIndex = currentIndex + 1;
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex === -1) {
            targetIndex = items.length - 1;
          } else if (currentIndex <= 0) {
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

          // Find the scroll container (closest element with data-scroll-container or overflow)
          const scrollContainer = targetItem.closest<HTMLElement>(
            '[data-scroll-container], [style*="overflow: auto"], [style*="overflow: scroll"]'
          );

          if (scrollContainer !== null) {
            const itemRect = targetItem.getBoundingClientRect();
            const containerRect = scrollContainer.getBoundingClientRect();

            // Padding to ensure item isn't flush with edges
            const padding = 12;
            // Preview height to show part of the next item
            const preview = 24;

            const isAbove = itemRect.top < containerRect.top + padding;
            const isBelow = itemRect.bottom > containerRect.bottom - padding - preview;

            if (isAbove) {
              scrollContainer.scrollTop -= containerRect.top + padding - itemRect.top;
            } else if (isBelow) {
              scrollContainer.scrollTop +=
                itemRect.bottom - (containerRect.bottom - padding - preview);
            }
          }
        }
      }
    },
    [itemSelector, activeItemSelector, loop]
  );

  return { handleKeyDown };
}
