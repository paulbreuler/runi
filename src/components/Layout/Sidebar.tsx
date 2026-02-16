/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useState } from 'react';
import { Folder, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CollectionList } from '@/components/Sidebar/CollectionList';
import { SidebarScrollArea } from '@/components/Sidebar/SidebarScrollArea';
import { Button } from '@/components/ui/button';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { containedFocusRingClasses } from '@/utils/accessibility';
import { cn } from '@/utils/cn';

interface DrawerSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  testId?: string;
  /** Optional action element rendered at the end of the header row. */
  headerAction?: React.ReactNode;
}

const DrawerSection = ({
  title,
  icon: _icon,
  defaultOpen = true,
  children,
  testId,
  headerAction,
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
      <div className="flex items-center shrink-0 group">
        <button
          type="button"
          className={cn(
            containedFocusRingClasses,
            'flex-1 flex items-center gap-2 px-4 py-3 hover:bg-bg-raised/30 transition-colors cursor-pointer'
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
        {headerAction !== undefined && <div className="pr-2">{headerAction}</div>}
      </div>
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

export const Sidebar = (): React.JSX.Element => {
  const { enabled: collectionsEnabled } = useFeatureFlag('http', 'collectionsEnabled');
  const createCollection = useCollectionStore((state) => state.createCollection);

  const handleCreate = (): void => {
    void createCollection('Untitled Collection');
  };

  const createButton = collectionsEnabled ? (
    <Button
      variant="ghost"
      size="icon-xs"
      noScale
      className="size-5 text-text-muted hover:text-text-primary"
      onClick={handleCreate}
      aria-label="Create collection"
      data-test-id="create-collection-button"
    >
      <Plus size={12} />
    </Button>
  ) : undefined;

  return (
    <aside className="flex-1 min-h-0 flex flex-col bg-bg-surface" data-test-id="sidebar-content">
      <DrawerSection
        title="Collections"
        icon={<Folder size={14} />}
        defaultOpen
        testId="collections-drawer"
        headerAction={createButton}
      >
        <CollectionList />
      </DrawerSection>
    </aside>
  );
};
