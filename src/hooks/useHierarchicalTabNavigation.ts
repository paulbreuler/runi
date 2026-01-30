/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file useHierarchicalTabNavigation hook
 * @description Hook for coordinating keyboard navigation between top-level and secondary tabs
 *
 * Supports hierarchical keyboard navigation:
 * - Arrow Down: Move from top-level to secondary tabs
 * - Arrow Up: Move from secondary to top-level tabs
 * - Arrow Left/Right: Navigate within current level
 * - Home/End: Navigate to first/last tab in current level
 */

import { useCallback, useState } from 'react';

import { focusWithVisibility } from '@/utils/focusVisibility';

export interface HierarchicalTabNavigationOptions {
  /** Top-level tab container element ref */
  topLevelContainerRef: React.RefObject<HTMLElement | null>;
  /** Secondary tab container element ref (optional) */
  secondaryContainerRef?: React.RefObject<HTMLElement | null>;
  /** Callback when focus moves to secondary tabs */
  onMoveToSecondary?: () => void;
  /** Callback when focus moves back to top-level tabs */
  onMoveToTopLevel?: () => void;
  /** Whether secondary tabs are currently visible */
  hasSecondaryTabs?: boolean;
}

export interface HierarchicalTabNavigationReturn {
  /** Keyboard event handler for top-level tabs */
  handleTopLevelKeyDown: (e: React.KeyboardEvent) => void;
  /** Keyboard event handler for secondary tabs */
  handleSecondaryKeyDown: (e: React.KeyboardEvent) => void;
  /** Whether focus is currently on secondary tabs */
  isSecondaryFocused: boolean;
}

/**
 * Hook for coordinating keyboard navigation between top-level and secondary tabs.
 *
 * Supports:
 * - Arrow Down: Move from top-level to secondary tabs
 * - Arrow Up: Move from secondary to top-level tabs
 * - Arrow Left/Right: Navigate within current level
 * - Home/End: Navigate to first/last tab in current level
 *
 * @example
 * ```tsx
 * const { handleTopLevelKeyDown, handleSecondaryKeyDown } = useHierarchicalTabNavigation({
 *   topLevelContainerRef,
 *   secondaryContainerRef,
 *   hasSecondaryTabs: activeTab === 'headers',
 * });
 * ```
 */
export function useHierarchicalTabNavigation(
  options: HierarchicalTabNavigationOptions
): HierarchicalTabNavigationReturn {
  const {
    topLevelContainerRef,
    secondaryContainerRef,
    onMoveToSecondary,
    onMoveToTopLevel,
    hasSecondaryTabs = false,
  } = options;

  const [isSecondaryFocused, setIsSecondaryFocused] = useState(false);

  /**
   * Find all focusable tab elements in a container
   */
  const getTabs = useCallback((container: HTMLElement | null): HTMLElement[] => {
    if (container === null) {
      return [];
    }

    // Find all elements with role="tab" that are focusable
    return Array.from(
      container.querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])')
    ).filter((tab) => {
      const style = window.getComputedStyle(tab);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }, []);

  /**
   * Find the currently focused tab
   */
  const getFocusedTab = useCallback((): HTMLElement | null => {
    const activeElement = document.activeElement;
    if (activeElement?.getAttribute('role') !== 'tab') {
      return null;
    }
    return activeElement as HTMLElement;
  }, []);

  /**
   * Navigate to next/previous tab in a list
   * Ensures focus ring appears by simulating keyboard focus
   */
  const navigateTab = useCallback(
    (tabs: HTMLElement[], direction: 'next' | 'prev' | 'first' | 'last'): void => {
      if (tabs.length === 0) {
        return;
      }

      const focusedTab = getFocusedTab();
      let targetIndex = 0;

      if (focusedTab !== null && tabs.includes(focusedTab)) {
        const currentIndex = tabs.indexOf(focusedTab);
        if (direction === 'next') {
          targetIndex = (currentIndex + 1) % tabs.length;
        } else if (direction === 'prev') {
          targetIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
        } else if (direction === 'first') {
          targetIndex = 0;
        } else {
          // last
          targetIndex = tabs.length - 1;
        }
      } else {
        // No focused tab, go to first or last
        targetIndex = direction === 'last' ? tabs.length - 1 : 0;
      }

      const targetTab = tabs[targetIndex];
      if (targetTab !== undefined) {
        // Focus the tab with visibility to ensure focus ring appears
        // even when programmatically focused during arrow key navigation
        focusWithVisibility(targetTab);

        // Activate the tab if it's not already active
        // Check both Radix data-state and aria-selected attributes
        const isActive =
          targetTab.getAttribute('data-state') === 'active' ||
          targetTab.getAttribute('aria-selected') === 'true';
        if (!isActive) {
          targetTab.click();
        }
      }
    },
    [getFocusedTab]
  );

  /**
   * Handle keyboard events for top-level container.
   * Only handles ArrowDown (move to secondary tabs when focus is on a top-level tab).
   * Arrow Left/Right and Home/End are handled by Base UI Tabs on the tab list.
   */
  const handleTopLevelKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      const { key } = e;

      // Only handle ArrowDown when focus is on a top-level tab (don't steal from content)
      if (key !== 'ArrowDown' || !hasSecondaryTabs) {
        return;
      }

      const secondaryContainer = secondaryContainerRef?.current;
      if (secondaryContainer === null || secondaryContainer === undefined) {
        return;
      }

      const topLevelTabs = getTabs(topLevelContainerRef.current);
      const focusedTab = getFocusedTab();
      const focusIsOnTopLevelTab =
        focusedTab !== null && topLevelTabs.length > 0 && topLevelTabs.includes(focusedTab);

      if (!focusIsOnTopLevelTab) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      const secondaryTabs = getTabs(secondaryContainer);
      if (secondaryTabs.length > 0) {
        setIsSecondaryFocused(true);
        const firstTab = secondaryTabs[0];
        if (firstTab !== undefined) {
          focusWithVisibility(firstTab);
          const isActive =
            firstTab.getAttribute('data-state') === 'active' ||
            firstTab.getAttribute('aria-selected') === 'true';
          if (!isActive) {
            firstTab.click();
          }
          onMoveToSecondary?.();
        }
      }
    },
    [
      hasSecondaryTabs,
      secondaryContainerRef,
      getTabs,
      getFocusedTab,
      onMoveToSecondary,
      topLevelContainerRef,
    ]
  );

  /**
   * Handle keyboard events for secondary tabs
   */
  const handleSecondaryKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      const { key } = e;

      // Arrow Up: Move back to top-level tabs
      if (key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setIsSecondaryFocused(false);
        const topLevelTabs = getTabs(topLevelContainerRef.current);
        if (topLevelTabs.length > 0) {
          // Find the active top-level tab or focus the first one
          // Check both Radix data-state and aria-selected attributes
          const activeTab = topLevelTabs.find(
            (tab) =>
              tab.getAttribute('data-state') === 'active' ||
              tab.getAttribute('aria-selected') === 'true'
          );
          focusWithVisibility(activeTab ?? topLevelTabs[0] ?? null);
          onMoveToTopLevel?.();
        }
        return;
      }

      // Arrow Left/Right: Navigate within secondary tabs
      if (key === 'ArrowLeft' || key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        const secondaryTabs = getTabs(secondaryContainerRef?.current ?? null);
        navigateTab(secondaryTabs, key === 'ArrowRight' ? 'next' : 'prev');
        return;
      }

      // Home/End: Navigate to first/last secondary tab
      if (key === 'Home' || key === 'End') {
        e.preventDefault();
        e.stopPropagation();
        const secondaryTabs = getTabs(secondaryContainerRef?.current ?? null);
        navigateTab(secondaryTabs, key === 'Home' ? 'first' : 'last');
      }
    },
    [getTabs, navigateTab, onMoveToTopLevel, secondaryContainerRef, topLevelContainerRef]
  );

  return {
    handleTopLevelKeyDown,
    handleSecondaryKeyDown,
    isSecondaryFocused,
  };
}
