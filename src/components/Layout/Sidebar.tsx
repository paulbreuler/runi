/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Folder, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { CollectionList } from '@/components/Sidebar/CollectionList';
import { containedFocusRingClasses } from '@/utils/accessibility';
import { cn } from '@/utils/cn';

interface DrawerSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  testId?: string;
}

const DrawerSection = ({
  title,
  icon: _icon,
  defaultOpen = true,
  children,
  testId,
}: DrawerSectionProps): React.JSX.Element => {
  // icon parameter is kept for API consistency but not currently used in the UI
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showScrollbar, setShowScrollbar] = useState(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const showBriefly = useCallback((duration = 400) => {
    // Ensure we have the latest layout before checking scrollability
    requestAnimationFrame(() => {
      if (viewportRef.current === null) {
        return;
      }

      const { scrollHeight, clientHeight } = viewportRef.current;
      const isScrollable = scrollHeight > clientHeight + 1; // +1 for subpixel rounding

      // If not scrollable, immediately hide and don't proceed
      if (!isScrollable) {
        setShowScrollbar(false);
        if (scrollTimeout.current !== null) {
          clearTimeout(scrollTimeout.current);
          scrollTimeout.current = null;
        }
        return;
      }

      // Only show if it's actually scrollable
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

  // Show scrollbar when section opens - longer duration to clear the entry animation
  useEffect(() => {
    if (isOpen) {
      showBriefly(800);
    }
  }, [isOpen, showBriefly]);

  // Show scrollbar when content size changes (e.g. expanding a long list)
  useEffect(() => {
    if (!isOpen || contentRef.current === null || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      // Content size changed, might have become scrollable
      showBriefly();
    });

    observer.observe(contentRef.current);
    return (): void => {
      observer.disconnect();
    };
  }, [isOpen, showBriefly, viewportRef]);

  useEffect(() => {
    return (): void => {
      if (scrollTimeout.current !== null) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        'border-b border-border-subtle last:border-b-0 flex flex-col min-h-0',
        isOpen && 'flex-1'
      )}
      data-test-id={testId}
    >
      <button
        type="button"
        className={cn(
          containedFocusRingClasses,
          'w-full flex items-center gap-2 px-4 py-3 hover:bg-bg-raised/30 transition-colors cursor-pointer group shrink-0'
        )}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
        data-test-id={testId !== undefined ? `${testId}-toggle` : undefined}
      >
        <span className="text-text-muted group-hover:text-text-primary transition-colors">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span
          className="text-xs font-semibold text-text-secondary uppercase tracking-wider group-hover:text-text-primary transition-colors"
          data-test-id={testId !== undefined ? `${testId}-title` : undefined}
        >
          {title}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex-1 min-h-0 flex flex-col overflow-hidden"
          >
            <ScrollArea.Root
              className="flex-1 min-h-0 relative group/scroll"
              data-test-id="sidebar-scroll-root"
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
                data-test-id="sidebar-scrollbar"
                className={cn(
                  'scroll-area-scrollbar absolute right-0.5 top-0 bottom-0 z-20 flex touch-none select-none transition-opacity duration-300',
                  showScrollbar ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                )}
              >
                <ScrollArea.Thumb className="scroll-area-thumb flex-1 rounded-full" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Sidebar = (): React.JSX.Element => {
  return (
    <aside className="flex-1 min-h-0 flex flex-col bg-bg-surface" data-test-id="sidebar-content">
      <DrawerSection
        title="Collections"
        icon={<Folder size={14} />}
        defaultOpen
        testId="collections-drawer"
      >
        <CollectionList />
      </DrawerSection>
    </aside>
  );
};
