/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';
import {
  motion,
  useReducedMotion,
  useTransform,
  useMotionValue,
  type MotionValue,
} from 'motion/react';
import { Tabs } from '@base-ui/react/tabs';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import type { RequestTabState } from '@/types/canvas';
import {
  globalEventBus,
  type ContextActivatePayload,
  type ContextClosePayload,
  type RequestOpenPayload,
} from '@/events/bus';

interface ContextTabsProps {
  /** Sidebar width (MotionValue) for aligning tabs with canvas area */
  sidebarWidth?: MotionValue<number>;
}

/**
 * ContextTabs - Manila folder tabs for TitleBar
 *
 * Features:
 * - Manila folder effect: active tab blends into canvas below
 * - Horizontal scroll with arrow buttons on overflow
 * - Keyboard navigation via BaseTabsList
 * - Trackpad scroll support
 * - Aligns with canvas area when sidebar is visible (smooth spring animation)
 */
export const ContextTabs = ({ sidebarWidth }: ContextTabsProps): React.JSX.Element | null => {
  const prefersReducedMotion = useReducedMotion() === true;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { contexts, contextOrder, activeContextId, contextState } = useCanvasStore();

  // Create a fallback MotionValue if sidebarWidth is undefined
  const fallbackWidth = useMotionValue(0);
  const effectiveWidth = sidebarWidth ?? fallbackWidth;

  // Align with canvas area
  const tabsMarginLeft = useTransform(effectiveWidth, (width) => width);

  // Update scroll state
  const updateScrollState = useCallback((): void => {
    if (scrollRef.current === null) {
      return;
    }
    const container = scrollRef.current;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const hasScrollableOverflow = maxScroll > 4;
    setHasOverflow(hasScrollableOverflow);
    setCanScrollLeft(container.scrollLeft > 2);
    setCanScrollRight(container.scrollLeft < maxScroll - 2);
  }, []);

  // Setup scroll detection
  useEffect(() => {
    if (scrollRef.current === null) {
      return;
    }

    updateScrollState();
    const container = scrollRef.current;

    const handleScroll = (): void => {
      updateScrollState();
    };

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });

    container.addEventListener('scroll', handleScroll, { passive: true });
    resizeObserver.observe(container);

    return (): void => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [updateScrollState]);

  const handleScrollLeft = (): void => {
    scrollRef.current?.scrollBy({ left: -200, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  };

  const handleScrollRight = (): void => {
    scrollRef.current?.scrollBy({ left: 200, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  };

  const handleTabChange = (contextId: string): void => {
    globalEventBus.emit<ContextActivatePayload>('context.activate', {
      contextId,
      actor: 'human',
    });
  };

  const handleCloseTab = (e: React.MouseEvent, contextId: string): void => {
    e.stopPropagation(); // Prevent tab activation
    globalEventBus.emit<ContextClosePayload>('context.close', {
      contextId,
      actor: 'human',
    });
  };

  const handleNewTab = (): void => {
    globalEventBus.emit<RequestOpenPayload>('request.open', {
      actor: 'human',
    });
  };

  // Keep the active tab visible when selection changes (including when a
  // sidebar request maps to an already-open tab off-screen).
  useEffect((): void => {
    const container = scrollRef.current;
    if (container === null || activeContextId === null) {
      return;
    }

    const expectedTestId = `context-tab-${activeContextId}`;
    const tabElement = Array.from(
      container.querySelectorAll<HTMLElement>('[data-test-id^="context-tab-"]')
    ).find((element) => element.dataset.testId === expectedTestId);

    if (tabElement === undefined) {
      return;
    }

    if (typeof tabElement.scrollIntoView === 'function') {
      tabElement.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }
  }, [activeContextId, contextOrder, prefersReducedMotion]);

  // Return null if no contexts registered
  if (contextOrder.length === 0) {
    return null;
  }

  const tabs = contextOrder
    .map((id) => {
      const context = contexts.get(id);
      if (context === undefined) {
        return null;
      }
      return {
        value: id,
        label: context.label,
        testId: `context-tab-${id}`,
      };
    })
    .filter((tab): tab is NonNullable<typeof tab> => tab !== null);

  return (
    <motion.div
      className="flex items-center gap-2 h-full min-w-0 flex-1"
      style={{ marginLeft: tabsMarginLeft }}
    >
      {/* Arrow buttons */}
      {hasOverflow && canScrollLeft && (
        <div className="flex items-center h-full shrink-0">
          <motion.button
            type="button"
            onClick={handleScrollLeft}
            className={cn(
              focusRingClasses,
              'flex h-6 w-6 items-center justify-center rounded hover:bg-bg-raised/50 transition-colors'
            )}
            aria-label="Scroll tabs left"
            data-test-id="context-tabs-arrow-left"
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
          >
            <span className="sr-only">Scroll left</span>
            <ChevronLeft size={14} className="text-text-secondary" />
          </motion.button>
        </div>
      )}

      {/* Scrollable tabs container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hidden touch-pan-x min-w-0 h-full"
        data-test-id="context-tabs-scroll"
      >
        <Tabs.Root value={activeContextId ?? tabs[0]?.value ?? ''} className="h-full">
          <Tabs.List className="flex items-end h-full gap-0 px-1" data-test-id="context-tabs-list">
            {tabs.map((tab) => {
              const isActive = activeContextId === tab.value;
              const isRequestTab = tab.value.startsWith('request-');

              // Get saved state for visual distinction
              const tabState = isRequestTab
                ? (contextState.get(tab.value) as unknown as RequestTabState | undefined)
                : undefined;
              const isSaved = tabState?.isSaved ?? false;

              return (
                <div key={tab.value} className="group relative flex h-full items-end">
                  <Tabs.Tab
                    value={tab.value}
                    onClick={() => {
                      handleTabChange(tab.value);
                    }}
                    className={cn(
                      focusRingClasses,
                      'relative px-4 py-2.5 text-xs font-medium transition-colors mb-[-1px] flex items-center gap-3 rounded-none',
                      'max-w-[240px] min-w-[120px] h-[calc(100%+1px)]', // Match height to list + overlap
                      isActive
                        ? 'bg-bg-app rounded-t-lg text-text-primary border-x border-t border-border-subtle shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.5)]'
                        : 'text-text-secondary hover:text-text-primary bg-transparent border-r border-border-subtle/30',
                      isRequestTab && 'pr-9' // Leave explicit room for the close button
                    )}
                    data-test-id={tab.testId}
                    title={tab.label} // Tooltip shows full name on hover
                  >
                    <span className={cn('relative z-10 truncate', !isSaved && 'italic opacity-75')}>
                      {tab.label}
                    </span>
                  </Tabs.Tab>
                  {isRequestTab && (
                    <button
                      type="button"
                      onClick={(e) => {
                        handleCloseTab(e, tab.value);
                      }}
                      className={cn(
                        focusRingClasses,
                        'absolute right-2 bottom-2.5 opacity-40 hover:opacity-100 transition-opacity rounded p-1 hover:bg-bg-raised/80 z-20',
                        isActive && 'opacity-60' // More visible when active
                      )}
                      aria-label={`Close ${tab.label}`}
                      data-test-id={`close-tab-${tab.value}`}
                    >
                      <X size={14} strokeWidth={2.5} className="text-text-primary" />
                    </button>
                  )}
                </div>
              );
            })}
          </Tabs.List>
        </Tabs.Root>
      </div>

      {/* New Request Button */}
      <div className="flex items-center h-full shrink-0 pr-2">
        <button
          type="button"
          onClick={handleNewTab}
          className={cn(
            focusRingClasses,
            'flex h-6 w-6 items-center justify-center rounded hover:bg-bg-raised/80 transition-colors text-text-secondary hover:text-text-primary'
          )}
          aria-label="New Request"
          data-test-id="context-tabs-new-request"
        >
          <Plus size={16} />
        </button>
      </div>

      {hasOverflow && canScrollRight && (
        <div className="flex items-center h-full shrink-0">
          <motion.button
            type="button"
            onClick={handleScrollRight}
            className={cn(
              focusRingClasses,
              'flex h-6 w-6 items-center justify-center rounded hover:bg-bg-raised/50 transition-colors'
            )}
            aria-label="Scroll tabs right"
            data-test-id="context-tabs-arrow-right"
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
          >
            <span className="sr-only">Scroll right</span>
            <ChevronRight size={14} className="text-text-secondary" />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};
