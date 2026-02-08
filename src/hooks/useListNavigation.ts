/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useCallback } from 'react';
import { useReducedMotion } from 'motion/react';
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
 * Hook for list-based keyboard navigation (ArrowUp/Down, Home/End, Tab).
 */
export function useListNavigation(options: ListNavigationOptions): {
  handleKeyDown: (e: React.KeyboardEvent) => void;
} {
  const { itemSelector, activeItemSelector, loop = true } = options;
  const prefersReducedMotion = useReducedMotion() === true;

  /**
   * Helper to focus an item and scroll it naturally into view.
   */
  const navigateToIndex = useCallback(
    (items: HTMLElement[], index: number) => {
      const targetItem = items[index];
      if (targetItem === undefined) {
        return;
      }

      // Use preventScroll to stop the browser from jarringly jumping to the element
      focusWithVisibility(targetItem, { preventScroll: true });

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

        const scrollBehavior = prefersReducedMotion ? 'instant' : 'smooth';

        if (isAbove) {
          const delta = itemRect.top - (containerRect.top + padding);
          scrollContainer.scrollBy({ top: delta, behavior: scrollBehavior });
        } else if (isBelow) {
          const delta = itemRect.bottom - (containerRect.bottom - padding - preview);
          scrollContainer.scrollBy({ top: delta, behavior: scrollBehavior });
        }
      }
    },
    [prefersReducedMotion]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
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
        case 'Tab':
          // Intercept Tab to follow our natural scrolling driver
          if (e.shiftKey) {
            // Previous
            if (currentIndex <= 0) {
              if (loop) {
                e.preventDefault();
                targetIndex = items.length - 1;
              }
              // If not looping, let default Tab behavior handle focus exit
            } else {
              e.preventDefault();
              targetIndex = currentIndex - 1;
            }
          } else {
            // Next
            if (currentIndex === -1) {
              e.preventDefault();
              targetIndex = 0;
            } else if (currentIndex === items.length - 1) {
              if (loop) {
                e.preventDefault();
                targetIndex = 0;
              }
              // If not looping, let default Tab behavior handle focus exit
            } else {
              e.preventDefault();
              targetIndex = currentIndex + 1;
            }
          }
          break;
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
        navigateToIndex(items, targetIndex);
      }
    },
    [itemSelector, activeItemSelector, loop, navigateToIndex]
  );

  return { handleKeyDown };
}
