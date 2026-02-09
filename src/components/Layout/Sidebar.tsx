/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useState } from 'react';
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
              {...({ type: 'scroll', delay: 250 } as Record<string, unknown>)}
            >
              <ScrollArea.Viewport
                className="scroll-area-viewport w-full h-full"
                data-scroll-container
              >
                <div className="px-2 pb-3">{children}</div>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar
                orientation="vertical"
                className="scroll-area-scrollbar absolute right-0.5 top-0 bottom-0 z-20 flex touch-none select-none transition-opacity duration-200"
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
