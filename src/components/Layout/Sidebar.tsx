/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Folder, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CollectionList } from '@/components/Sidebar/CollectionList';
import { OpenItems } from '@/components/Sidebar/OpenItems';
import { SidebarScrollArea } from '@/components/Sidebar/SidebarScrollArea';
import { SidebarDivider } from '@/components/Sidebar/SidebarDivider';
import { useTabStore } from '@/stores/useTabStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
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
            <SidebarScrollArea testId="sidebar-scroll">{children}</SidebarScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MIN_SECTION_HEIGHT = 60;

export const Sidebar = (): React.JSX.Element => {
  const tabOrder = useTabStore((s) => s.tabOrder);
  const openItemsRatio = useSettingsStore((s) => s.openItemsRatio);
  const setOpenItemsRatio = useSettingsStore((s) => s.setOpenItemsRatio);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const dragStartRatio = useRef(0);

  // Measure available height with ResizeObserver
  useEffect(() => {
    if (containerRef.current === null || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry !== undefined) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(containerRef.current);
    return (): void => {
      observer.disconnect();
    };
  }, []);

  const showOpenItems = tabOrder.length > 1;

  // Compute pixel heights from ratio
  const openItemsHeight =
    showOpenItems && containerHeight > 0
      ? Math.max(
          MIN_SECTION_HEIGHT,
          Math.min(containerHeight - MIN_SECTION_HEIGHT, containerHeight * openItemsRatio)
        )
      : 0;

  const handleDividerDrag = useCallback(
    (deltaY: number) => {
      if (containerHeight <= 0) {
        return;
      }
      const baseHeight = containerHeight * dragStartRatio.current;
      const newHeight = baseHeight + deltaY;
      const newRatio = newHeight / containerHeight;
      setOpenItemsRatio(newRatio);
    },
    [containerHeight, setOpenItemsRatio]
  );

  const handleDividerDragStart = useCallback(() => {
    dragStartRatio.current = openItemsRatio;
  }, [openItemsRatio]);

  return (
    <aside
      ref={containerRef}
      className="flex-1 min-h-0 flex flex-col bg-bg-surface"
      data-test-id="sidebar-content"
    >
      {showOpenItems && (
        <>
          <OpenItems style={{ height: openItemsHeight }} />
          <SidebarDivider onDrag={handleDividerDrag} onDragStart={handleDividerDragStart} />
        </>
      )}
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
