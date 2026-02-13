/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
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

/**
 * ContextTabs - Manila folder tabs for TitleBar
 *
 * Features:
 * - Manila folder effect: active tab blends into canvas below
 * - Horizontal scroll with arrow buttons on overflow
 * - Keyboard navigation via BaseTabsList
 * - Trackpad scroll support
 */
export const ContextTabs = (): React.JSX.Element | null => {
  const prefersReducedMotion = useReducedMotion() === true;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { contexts, templates, contextOrder, activeContextId, contextState } = useCanvasStore();

  // Update scroll state
  const updateScrollState = useCallback((): void => {
    if (scrollRef.current === null) {
      return;
    }
    const container = scrollRef.current;
    const maxScroll = container.scrollWidth - container.clientWidth;
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

  // Recalculate scroll state when tabs change (scrollWidth can increase without resize)
  useEffect(() => {
    updateScrollState();
  }, [contextOrder.length, updateScrollState]);

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

  // Recalculate overflow when contextOrder changes (tabs added/removed/reordered)
  useEffect(() => {
    updateScrollState();
  }, [contextOrder, updateScrollState]);

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
      // Belt-and-suspenders: filter out templates (shouldn't appear in contextOrder, but guard anyway)
      if (context.contextType !== undefined && templates.has(context.id)) {
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
    <motion.div className="flex items-end gap-1 h-full min-w-0 flex-1">
      {/* Arrow buttons - both on the left for ergonomics, centered to tab height */}
      <div className="flex items-center h-[25px] shrink-0 gap-0.5 px-1">
        <motion.button
          type="button"
          onClick={handleScrollLeft}
          disabled={!canScrollLeft}
          className={cn(
            focusRingClasses,
            'flex h-6 w-6 items-center justify-center rounded hover:bg-bg-raised/50 transition-colors disabled:opacity-10 disabled:cursor-not-allowed'
          )}
          aria-label="Scroll tabs left"
          data-test-id="context-tabs-arrow-left"
          whileHover={prefersReducedMotion || !canScrollLeft ? undefined : { scale: 1.05 }}
          whileTap={prefersReducedMotion || !canScrollLeft ? undefined : { scale: 0.95 }}
        >
          <span className="sr-only">Scroll left</span>
          <ChevronLeft size={14} className="text-text-secondary" />
        </motion.button>
        <motion.button
          type="button"
          onClick={handleScrollRight}
          disabled={!canScrollRight}
          className={cn(
            focusRingClasses,
            'flex h-6 w-6 items-center justify-center rounded hover:bg-bg-raised/50 transition-colors disabled:opacity-10 disabled:cursor-not-allowed'
          )}
          aria-label="Scroll tabs right"
          data-test-id="context-tabs-arrow-right"
          whileHover={prefersReducedMotion || !canScrollRight ? undefined : { scale: 1.05 }}
          whileTap={prefersReducedMotion || !canScrollRight ? undefined : { scale: 0.95 }}
        >
          <span className="sr-only">Scroll right</span>
          <ChevronRight size={14} className="text-text-secondary" />
        </motion.button>
      </div>

      {/* Scrollable tabs container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-visible scrollbar-hidden touch-pan-x min-w-0 h-full relative"
        data-test-id="context-tabs-scroll"
      >
        <Tabs.Root
          value={activeContextId ?? tabs[0]?.value ?? ''}
          onValueChange={(value: string) => {
            handleTabChange(value);
          }}
          className="h-full"
        >
          <Tabs.List
            className="flex items-end h-full gap-0 px-1 pt-1.5 border-b border-border-subtle/30"
            data-test-id="context-tabs-list"
          >
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
                      'relative py-1.5 text-[11px] font-medium transition-colors flex items-center justify-center gap-2 rounded-t-lg',
                      'max-w-[180px] min-w-[80px] h-[25px]', // Shorter height (TabBar h-8 = 32px)
                      isRequestTab ? 'px-7' : 'px-3', // Balanced padding for request tabs to keep text centered
                      isActive
                        ? 'bg-bg-app text-text-primary border-x border-t border-border-subtle shadow-[0_-1px_3px_rgba(0,0,0,0.1)] z-30'
                        : 'text-text-secondary hover:text-text-primary bg-bg-app/40 border-r border-border-subtle/10',
                      isActive &&
                        'after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[1px] after:bg-bg-app after:z-40'
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
                        'absolute right-1.5 top-1/2 -translate-y-[calc(50%-1px)] opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 hover:bg-bg-raised/80 z-50',
                        isActive && 'opacity-0 group-hover:opacity-100'
                      )}
                      aria-label={`Close ${tab.label}`}
                      data-test-id={`close-tab-${tab.value}`}
                    >
                      <X size={12} strokeWidth={2} className="text-text-primary" />
                    </button>
                  )}
                </div>
              );
            })}
          </Tabs.List>
        </Tabs.Root>
      </div>

      {/* New Request Button - Centered to tab height */}
      <div className="flex items-center h-[25px] shrink-0 pr-2 border-b border-border-subtle/30">
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
    </motion.div>
  );
};
