/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { motion, useReducedMotion } from 'motion/react';
import { HeaderEditor } from './HeaderEditor';
import { ParamsEditor } from './ParamsEditor';
import { AuthEditor } from './AuthEditor';
import { CodeEditor } from '@/components/CodeHighlighting/CodeEditor';
import { BaseTabsList } from '@/components/ui/BaseTabsList';
import { useRequestStore } from '@/stores/useRequestStore';

type TabId = 'headers' | 'body' | 'params' | 'auth';

interface Tab {
  id: TabId;
  label: string;
}

const tabs: Tab[] = [
  { id: 'headers', label: 'Headers' },
  { id: 'body', label: 'Body' },
  { id: 'params', label: 'Params' },
  { id: 'auth', label: 'Auth' },
];

/**
 * RequestBuilder component for constructing HTTP requests.
 * Provides tabs for configuring headers, body, query parameters, and authentication.
 */
export const RequestBuilder = (): React.JSX.Element => {
  const [activeTab, setActiveTab] = useState<TabId>('headers');
  const prefersReducedMotion = useReducedMotion() === true;
  const { body, setBody } = useRequestStore();
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isScrollIdle, setIsScrollIdle] = useState(true);
  const scrollIdleTimeout = useRef<number | undefined>(undefined);

  const updateScrollState = useCallback((): void => {
    const container = tabScrollRef.current;
    if (container === null) {
      return;
    }
    const maxScroll = container.scrollWidth - container.clientWidth;
    const hasScrollableOverflow = maxScroll > 4;
    setHasOverflow(hasScrollableOverflow);
    setCanScrollLeft(container.scrollLeft > 2);
    setCanScrollRight(container.scrollLeft < maxScroll - 2);
  }, []);

  useEffect(() => {
    updateScrollState();
    const container = tabScrollRef.current;
    if (container === null) {
      return;
    }

    const handleScroll = (): void => {
      updateScrollState();
      setIsScrollIdle(false);
      if (scrollIdleTimeout.current !== undefined) {
        window.clearTimeout(scrollIdleTimeout.current);
      }
      scrollIdleTimeout.current = window.setTimeout(() => {
        setIsScrollIdle(true);
      }, 220);
    };

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });

    container.addEventListener('scroll', handleScroll, { passive: true });
    resizeObserver.observe(container);

    return (): void => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      if (scrollIdleTimeout.current !== undefined) {
        window.clearTimeout(scrollIdleTimeout.current);
      }
    };
  }, [updateScrollState]);

  const showOverflowCue = hasOverflow;

  // Helper function to get overflow animation props
  const getOverflowAnimation = (
    direction: 'left' | 'right'
  ): {
    opacity: number | number[];
    x: number | number[];
  } => {
    if (prefersReducedMotion) {
      return { opacity: 0.35, x: 0 };
    }
    if (isScrollIdle) {
      const xValue = direction === 'left' ? [0, 3, 0] : [0, -3, 0];
      return { opacity: [0.2, 0.4, 0.2], x: xValue };
    }
    return { opacity: 0.25, x: 0 };
  };

  return (
    <div className="h-full flex flex-col bg-bg-app" data-test-id="request-builder">
      {/* Tab navigation */}
      <Tabs.Root
        value={activeTab}
        onValueChange={setActiveTab as (value: string) => void}
        className="flex-1 min-h-0 flex flex-col"
      >
        <div className="relative flex items-center pl-3 pr-2 py-1.5 border-b border-border-subtle/30">
          <div
            ref={tabScrollRef}
            className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hidden touch-pan-x"
            aria-label="Request tabs"
            data-test-id="request-tabs-scroll"
          >
            <BaseTabsList
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabs={tabs.map((tab) => ({
                value: tab.id,
                label: tab.label,
                testId: `request-tab-${tab.id}`,
              }))}
              listClassName="flex items-center gap-1 pr-2 min-w-max"
              tabClassName="px-2.5 h-6 text-[11px] uppercase tracking-wider rounded-md transition-all duration-200 font-semibold relative"
              activeTabClassName="text-text-primary"
              inactiveTabClassName="text-text-muted/60 hover:text-text-secondary"
              indicatorLayoutId="request-tab-indicator"
              indicatorClassName="bg-bg-raised/50 rounded-md"
              indicatorTestId="request-tab-indicator"
              listTestId="request-tabs-list"
              listAriaLabel="Request tabs"
              activateOnFocus={false}
            />
          </div>
          {showOverflowCue && canScrollLeft && (
            <motion.div
              className="pointer-events-none absolute inset-y-0 left-2 w-6 bg-linear-to-r from-bg-surface/90 to-transparent"
              data-test-id="request-tabs-overflow-left"
              initial={false}
              animate={getOverflowAnimation('left')}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          {showOverflowCue && canScrollRight && (
            <motion.div
              className="pointer-events-none absolute inset-y-0 right-2 w-6 bg-linear-to-l from-bg-surface/90 to-transparent"
              data-test-id="request-tabs-overflow-right"
              initial={false}
              animate={getOverflowAnimation('right')}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>

        {/* Tab content - overflow hidden to prevent scrollbar flash during transitions */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <Tabs.Panel value="headers" className="h-full min-h-0" tabIndex={-1}>
            <motion.div
              data-test-id="request-tab-panel-headers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-auto"
              style={{ scrollbarGutter: 'stable' }}
            >
              <HeaderEditor />
            </motion.div>
          </Tabs.Panel>

          <Tabs.Panel value="body" className="h-full min-h-0" tabIndex={-1}>
            <motion.div
              data-test-id="request-tab-panel-body"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full min-h-0 overflow-hidden flex flex-col p-4"
              style={{ scrollbarGutter: 'stable' }}
            >
              <div className="flex-1 min-h-0">
                <CodeEditor
                  mode="edit"
                  code={body}
                  onChange={setBody}
                  enableJsonValidation
                  enableJsonFormatting
                  placeholder="Enter request body (JSON, XML, text, etc.)"
                />
              </div>
            </motion.div>
          </Tabs.Panel>

          <Tabs.Panel value="params" className="h-full min-h-0" tabIndex={-1}>
            <motion.div
              data-test-id="request-tab-panel-params"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-auto"
              style={{ scrollbarGutter: 'stable' }}
            >
              <ParamsEditor />
            </motion.div>
          </Tabs.Panel>

          <Tabs.Panel value="auth" className="h-full min-h-0" tabIndex={-1}>
            <motion.div
              data-test-id="request-tab-panel-auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-auto"
              style={{ scrollbarGutter: 'stable' }}
            >
              <AuthEditor />
            </motion.div>
          </Tabs.Panel>
        </div>
      </Tabs.Root>
    </div>
  );
};
