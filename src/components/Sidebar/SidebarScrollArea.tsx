/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { cn } from '@/utils/cn';

interface SidebarScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  testId?: string;
}

/**
 * Shared scroll area with transient scrollbar for sidebar sections.
 * Shows scrollbar briefly on scroll and content resize, then fades.
 */
export const SidebarScrollArea = ({
  children,
  className,
  testId,
}: SidebarScrollAreaProps): React.JSX.Element => {
  const [showScrollbar, setShowScrollbar] = useState(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const showBriefly = useCallback((duration = 400) => {
    requestAnimationFrame(() => {
      if (viewportRef.current === null) {
        return;
      }

      const { scrollHeight, clientHeight } = viewportRef.current;
      const isScrollable = scrollHeight > clientHeight + 1;

      if (!isScrollable) {
        setShowScrollbar(false);
        if (scrollTimeout.current !== null) {
          clearTimeout(scrollTimeout.current);
          scrollTimeout.current = null;
        }
        return;
      }

      setShowScrollbar(true);
      if (scrollTimeout.current !== null) {
        clearTimeout(scrollTimeout.current);
      }
      scrollTimeout.current = setTimeout(() => {
        setShowScrollbar(false);
        scrollTimeout.current = null;
      }, duration);
    });
  }, []);

  const handleScroll = useCallback(() => {
    showBriefly();
  }, [showBriefly]);

  // Show scrollbar when content size changes
  useEffect(() => {
    if (contentRef.current === null || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      showBriefly();
    });

    observer.observe(contentRef.current);
    return (): void => {
      observer.disconnect();
    };
  }, [showBriefly]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return (): void => {
      if (scrollTimeout.current !== null) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  return (
    <ScrollArea.Root
      className={cn('flex-1 min-h-0 relative group/scroll', className)}
      data-test-id={testId !== undefined ? `${testId}-root` : undefined}
    >
      <ScrollArea.Viewport
        ref={viewportRef}
        className="scroll-area-viewport w-full h-full"
        data-scroll-container
        onScroll={handleScroll}
      >
        <div ref={contentRef} className="px-2 pb-3">
          {children}
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        orientation="vertical"
        data-test-id={testId !== undefined ? `${testId}-scrollbar` : undefined}
        className={cn(
          'scroll-area-scrollbar absolute right-0.5 top-0 bottom-0 z-20 flex touch-none select-none transition-opacity duration-300',
          showScrollbar ? 'opacity-100' : 'opacity-0 hover:opacity-100'
        )}
      >
        <ScrollArea.Thumb className="scroll-area-thumb flex-1 rounded-full" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
};
