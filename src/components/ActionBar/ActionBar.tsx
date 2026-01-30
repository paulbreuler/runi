/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/utils/cn';
import { OVERLAY_Z_INDEX } from '@/utils/z-index';
import { ActionBarContext, type ActionBarVariant } from './ActionBarContext';

interface ActionBarProps {
  /** Child components to render within the ActionBar */
  children: React.ReactNode;
  /**
   * Responsive breakpoints [compact, icon] thresholds in pixels.
   * - Width > breakpoints[0]: full variant
   * - Width > breakpoints[1] and <= breakpoints[0]: compact variant
   * - Width <= breakpoints[1]: icon variant
   * @default [800, 600]
   */
  breakpoints?: [number, number];
  /** Additional CSS classes */
  className?: string;
  /** ARIA label for the container */
  'aria-label'?: string;
}

/**
 * ActionBar - Responsive container with horizontal scroll and overflow cues.
 *
 * Features:
 * - ResizeObserver for breakpoint detection
 * - Horizontal scroll with animated gradient cues (left/right)
 * - Touch gesture support (`touch-pan-x`)
 * - Provides variant context to children via React context
 * - Reduced motion support
 */
export const ActionBar = ({
  children,
  breakpoints = [800, 600],
  className,
  'aria-label': ariaLabel = 'Action bar',
}: ActionBarProps): React.JSX.Element => {
  const prefersReducedMotion = useReducedMotion() === true;
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [variant, setVariant] = useState<ActionBarVariant>('full');
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isScrollIdle, setIsScrollIdle] = useState(true);
  const scrollIdleTimeout = useRef<number | undefined>(undefined);

  const [fullBreakpoint, iconBreakpoint] = breakpoints;

  // Detect container width and set variant
  useEffect(() => {
    const container = containerRef.current;
    if (container === null) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry === undefined) {
        return;
      }
      const { width } = entry.contentRect;
      if (width > fullBreakpoint) {
        setVariant('full');
      } else if (width > iconBreakpoint) {
        setVariant('compact');
      } else {
        setVariant('icon');
      }
    });

    observer.observe(container);
    return (): void => {
      observer.disconnect();
    };
  }, [fullBreakpoint, iconBreakpoint]);

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

  const showOverflowCue = hasOverflow;

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({ variant }), [variant]);

  return (
    <ActionBarContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={cn(
          'flex items-center py-1.5 border-b border-border-subtle bg-bg-raised/30 shrink-0 relative',
          className
        )}
        style={{ zIndex: OVERLAY_Z_INDEX }}
        role="toolbar"
        aria-label={ariaLabel}
      >
        {/* Scrollable content container */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hidden touch-pan-x min-w-0"
        >
          <div className="flex items-center gap-3 min-w-max px-3">{children}</div>
        </div>

        {/* Overflow gradient cues */}
        {showOverflowCue && canScrollLeft && (
          <motion.div
            className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-bg-raised/30 to-transparent"
            data-test-id="actionbar-overflow-left"
            initial={false}
            animate={getOverflowAnimation('left')}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        {showOverflowCue && canScrollRight && (
          <motion.div
            className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-bg-raised/30 to-transparent"
            data-test-id="actionbar-overflow-right"
            initial={false}
            animate={getOverflowAnimation('right')}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>
    </ActionBarContext.Provider>
  );
};
