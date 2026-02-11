/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, useReducedMotion, useTransform, type MotionValue } from 'motion/react';
import { Tabs } from '@base-ui/react/tabs';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { BaseTabsList } from '@/components/ui/BaseTabsList';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import { isMacSync } from '@/utils/platform';

interface ContextTabsProps {
  /** Sidebar width (MotionValue) for aligning tabs with canvas area */
  sidebarWidth?: MotionValue<number>;
}

// Approximate offset of title bar elements before tabs (Mac controls + drag handle + gaps)
const TITLEBAR_LEFT_OFFSET_MAC = 98; // 8px padding + 58px controls + 8px gap + 16px drag + 8px gap
const TITLEBAR_LEFT_OFFSET_OTHER = 32; // 8px padding + 16px drag + 8px gap

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

  const { contexts, contextOrder, activeContextId, setActiveContext } = useCanvasStore();

  // Calculate smooth margin offset to align tabs with canvas
  const isMac = isMacSync();
  const titleBarOffset = isMac ? TITLEBAR_LEFT_OFFSET_MAC : TITLEBAR_LEFT_OFFSET_OTHER;
  const tabsMarginLeft = useTransform(sidebarWidth ?? null, (width) =>
    width !== null ? Math.max(0, width - titleBarOffset) : 0
  );

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
    scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const handleScrollRight = (): void => {
    scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  const handleTabChange = (contextId: string): void => {
    setActiveContext(contextId);
  };

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
      style={sidebarWidth !== undefined ? { marginLeft: tabsMarginLeft } : undefined}
    >
      {/* Arrow buttons */}
      {hasOverflow && canScrollLeft && (
        <motion.button
          type="button"
          onClick={handleScrollLeft}
          className={cn(
            focusRingClasses,
            'flex h-6 w-6 items-center justify-center rounded hover:bg-bg-raised/50 transition-colors shrink-0'
          )}
          aria-label="Scroll tabs left"
          data-test-id="context-tabs-arrow-left"
          whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
        >
          <ChevronLeft size={14} className="text-text-secondary" />
        </motion.button>
      )}

      {/* Scrollable tabs container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hidden touch-pan-x min-w-0"
        data-test-id="context-tabs-scroll"
      >
        <Tabs.Root value={activeContextId ?? tabs[0]?.value ?? ''}>
          <BaseTabsList
            activeTab={activeContextId ?? tabs[0]?.value ?? ''}
            onTabChange={handleTabChange}
            tabs={tabs}
            listClassName="flex items-end h-full gap-0 px-1"
            tabClassName="relative px-4 py-2 text-xs font-medium transition-colors border-r border-border-subtle/50 mb-[-1px]"
            activeTabClassName="bg-bg-app rounded-t-md border-b-2 border-b-bg-app text-text-primary shadow-sm"
            inactiveTabClassName="text-text-secondary hover:text-text-primary bg-transparent"
            indicatorLayoutId="context-tabs-indicator"
            indicatorClassName="hidden"
            listTestId="context-tabs-list"
            activateOnFocus={false}
          />
        </Tabs.Root>
      </div>

      {hasOverflow && canScrollRight && (
        <motion.button
          type="button"
          onClick={handleScrollRight}
          className={cn(
            focusRingClasses,
            'flex h-6 w-6 items-center justify-center rounded hover:bg-bg-raised/50 transition-colors shrink-0'
          )}
          aria-label="Scroll tabs right"
          data-test-id="context-tabs-arrow-right"
          whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
        >
          <ChevronRight size={14} className="text-text-secondary" />
        </motion.button>
      )}
    </motion.div>
  );
};
