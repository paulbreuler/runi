/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useState } from 'react';
import { Folder, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmptyState } from '@/components/ui/EmptyState';

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
  // Use a function initializer to ensure defaultOpen is respected on mount
  const [isOpen, setIsOpen] = useState(() => defaultOpen);

  return (
    <div className="border-b border-border-subtle last:border-b-0" data-testid={testId}>
      <button
        type="button"
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-bg-raised/30 transition-colors cursor-pointer group"
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
      >
        <span className="text-text-muted group-hover:text-text-secondary transition-colors">
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
    <aside className="w-full h-full bg-bg-surface flex flex-col" data-testid="sidebar-content">
      {/* Collections Drawer - Default collapsed since collections aren't supported yet */}
      <DrawerSection
        key="collections-drawer-v2"
        title="Collections"
        icon={<Folder size={14} />}
        defaultOpen={false}
        testId="collections-drawer"
      >
        <EmptyState variant="muted" size="sm" title="No collections yet" />
      </DrawerSection>

      {/* Spacer to push content up */}
      <div className="flex-1" />
    </aside>
  );
};
