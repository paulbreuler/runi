/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useCallback, useState } from 'react';
import { Menu } from '@base-ui/react/menu';
import { Folder, ChevronDown, ChevronRight, Plus, FolderOpen, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CollectionList } from '@/components/Sidebar/CollectionList';
import { ImportSpecDialog } from '@/components/Sidebar/ImportSpecDialog';
import { SidebarScrollArea } from '@/components/Sidebar/SidebarScrollArea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/Toast';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { containedFocusRingClasses, focusRingClasses } from '@/utils/accessibility';
import { cn } from '@/utils/cn';
import { OVERLAY_Z_INDEX } from '@/utils/z-index';

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

/** Generate a unique collection name based on existing summaries. */
const generateUniqueName = (baseName: string, existingNames: string[]): string => {
  if (!existingNames.includes(baseName)) {
    return baseName;
  }
  let counter = 2;
  while (existingNames.includes(`${baseName} (${String(counter)})`)) {
    counter++;
  }
  return `${baseName} (${String(counter)})`;
};

export const Sidebar = (): React.JSX.Element => {
  const { enabled: collectionsEnabled } = useFeatureFlag('http', 'collectionsEnabled');
  const createCollection = useCollectionStore((state) => state.createCollection);
  const openCollectionFile = useCollectionStore((state) => state.openCollectionFile);
  const summaries = useCollectionStore((state) => state.summaries);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const handleCreate = useCallback(async (): Promise<void> => {
    const name = generateUniqueName(
      'Untitled Collection',
      summaries.map((s) => s.name)
    );
    const result = await createCollection(name);
    if (result === null) {
      toast.error({ message: 'Failed to create collection' });
    }
  }, [createCollection, summaries]);

  const [menuOpen, setMenuOpen] = useState(false);

  const handleOpenCollection = useCallback(async (): Promise<void> => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        title: 'Open Collection',
        filters: [{ name: 'YAML Collection', extensions: ['yaml', 'yml'] }],
        multiple: false,
      });
      if (selected !== null && typeof selected === 'string') {
        const result = await openCollectionFile(selected);
        if (result !== null) {
          toast.success({ message: 'Collection opened successfully' });
        }
      }
    } catch (error) {
      toast.error({ message: `Failed to open collection: ${String(error)}` });
    }
  }, [openCollectionFile]);

  const menuItemClasses = cn(
    focusRingClasses,
    'w-full px-3 py-1.5 text-xs text-left flex items-center gap-2 cursor-pointer transition-colors',
    'text-text-secondary hover:bg-bg-raised hover:text-text-primary focus-visible:bg-bg-raised focus-visible:text-text-primary'
  );

  const headerActions = collectionsEnabled ? (
    <Menu.Root open={menuOpen} onOpenChange={setMenuOpen}>
      <Menu.Trigger
        nativeButton={true}
        render={(props) => (
          <Button
            {...props}
            variant="ghost"
            size="icon-xs"
            noScale
            className="size-5 text-text-muted hover:text-text-primary"
            aria-label="Collection actions"
            data-test-id="collection-actions-menu"
          >
            <Plus size={12} />
          </Button>
        )}
      />
      <Menu.Portal>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: OVERLAY_Z_INDEX,
            pointerEvents: 'none',
          }}
        >
          <div style={{ pointerEvents: 'auto' }}>
            <Menu.Positioner sideOffset={4} align="end">
              <Menu.Popup
                style={{ zIndex: OVERLAY_Z_INDEX }}
                className="min-w-[180px] bg-bg-elevated border border-border-default rounded-lg shadow-lg overflow-hidden py-1 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-reduce:animate-none"
                data-test-id="collection-actions-popup"
              >
                <Menu.Item
                  nativeButton={true}
                  label="Create collection"
                  className={menuItemClasses}
                  onClick={() => {
                    void handleCreate();
                  }}
                  closeOnClick={true}
                  data-test-id="collection-menu-create"
                >
                  <Plus size={12} className="shrink-0" />
                  <span>Create collection</span>
                </Menu.Item>
                <Menu.Item
                  nativeButton={true}
                  label="Open collection"
                  className={menuItemClasses}
                  onClick={() => {
                    void handleOpenCollection();
                  }}
                  closeOnClick={true}
                  data-test-id="collection-menu-open"
                >
                  <FolderOpen size={12} className="shrink-0" />
                  <span>Open collection</span>
                </Menu.Item>
                <div className="my-1 h-px bg-border-subtle" role="separator" />
                <Menu.Item
                  nativeButton={true}
                  label="Import collection"
                  className={menuItemClasses}
                  onClick={() => {
                    setImportDialogOpen(true);
                  }}
                  closeOnClick={true}
                  data-test-id="collection-menu-import"
                >
                  <Download size={12} className="shrink-0" />
                  <span>Import collection</span>
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </div>
        </div>
      </Menu.Portal>
    </Menu.Root>
  ) : undefined;

  return (
    <aside className="flex-1 min-h-0 flex flex-col bg-bg-surface" data-test-id="sidebar-content">
      <ImportSpecDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
      <DrawerSection
        title="Collections"
        icon={<Folder size={14} />}
        defaultOpen
        testId="collections-drawer"
        headerAction={headerActions}
      >
        <CollectionList />
      </DrawerSection>
    </aside>
  );
};
