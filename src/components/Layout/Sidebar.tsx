/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useState } from 'react';
import { Folder, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CollectionList } from '@/components/Sidebar/CollectionList';
import { focusRingClasses } from '@/utils/accessibility';
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
    <div className="border-b border-border-subtle last:border-b-0" data-test-id={testId}>
      <button
        type="button"
        className={cn(
          focusRingClasses,
          'w-full flex items-center gap-2 px-4 py-3 hover:bg-bg-raised/30 transition-colors cursor-pointer group'
        )}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
      >
        <span className="text-text-muted group-hover:text-text-primary transition-colors">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider group-hover:text-text-primary transition-colors">
          {title}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Sidebar = (): React.JSX.Element => {
  return (
    <aside className="w-full h-full bg-bg-surface flex flex-col" data-test-id="sidebar-content">
      {/* Collections Drawer */}
      <DrawerSection
        title="Collections"
        icon={<Folder size={14} />}
        defaultOpen
        testId="collections-drawer"
      >
        <CollectionList />
      </DrawerSection>

      {/* Spacer to push content up */}
      <div className="flex-1" />
    </aside>
  );
};
