/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { HeaderEditor } from './HeaderEditor';
import { ParamsEditor } from './ParamsEditor';
import { AuthEditor } from './AuthEditor';
import { CodeEditor } from '@/components/CodeHighlighting/CodeEditor';
import { useRequestStore } from '@/stores/useRequestStore';
import { cn } from '@/utils/cn';

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
    <div className="h-full flex flex-col bg-bg-app" data-testid="request-builder">
      {/* Tab navigation */}
      <div className="relative flex items-center px-6 py-2 border-b border-border-subtle bg-bg-surface">
        <div
          ref={tabScrollRef}
          className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hidden touch-pan-x"
          aria-label="Request tabs"
        >
          <div className="flex items-center gap-1 pr-2 min-w-max">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                  }}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-lg transition-colors duration-200 font-medium',
                    isActive
                      ? 'bg-bg-raised text-text-primary'
                      : 'text-text-muted hover:text-text-secondary hover:bg-bg-raised/50'
                  )}
                  whileHover={!isActive ? { scale: 1.02 } : undefined}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                >
                  {tab.label}
                </motion.button>
              );
            })}
          </div>
        </div>
        {showOverflowCue && canScrollLeft && (
          <motion.div
            className="pointer-events-none absolute inset-y-0 left-2 w-6 bg-gradient-to-r from-bg-surface/90 to-transparent"
            data-testid="request-tabs-overflow-left"
            initial={false}
            animate={getOverflowAnimation('left')}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        {showOverflowCue && canScrollRight && (
          <motion.div
            className="pointer-events-none absolute inset-y-0 right-2 w-6 bg-gradient-to-l from-bg-surface/90 to-transparent"
            data-testid="request-tabs-overflow-right"
            initial={false}
            animate={getOverflowAnimation('right')}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>

      {/* Tab content - overflow hidden to prevent scrollbar flash during transitions */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'headers' && (
            <motion.div
              key="headers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-auto"
              style={{ scrollbarGutter: 'stable' }}
            >
              <HeaderEditor />
            </motion.div>
          )}

          {activeTab === 'body' && (
            <motion.div
              key="body"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-auto"
              style={{ scrollbarGutter: 'stable' }}
            >
              <CodeEditor
                mode="edit"
                code={body}
                onChange={setBody}
                enableJsonValidation
                enableJsonFormatting
                placeholder="Enter request body (JSON, XML, text, etc.)"
              />
            </motion.div>
          )}

          {activeTab === 'params' && (
            <motion.div
              key="params"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-auto"
              style={{ scrollbarGutter: 'stable' }}
            >
              <ParamsEditor />
            </motion.div>
          )}

          {activeTab === 'auth' && (
            <motion.div
              key="auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-auto"
              style={{ scrollbarGutter: 'stable' }}
            >
              <AuthEditor />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
