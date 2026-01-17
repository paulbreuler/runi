import React, { useState, useEffect } from 'react';
import { Folder, History, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { HistoryEntry } from '@/components/History/HistoryEntry';
import { globalEventBus } from '@/events/bus';
import type { HistoryEntry as HistoryEntryType } from '@/types/generated/HistoryEntry';

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

const HistoryDrawer = (): React.JSX.Element => {
  const { entries, isLoading, error, loadHistory, deleteEntry } = useHistoryStore();

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleSelectEntry = (entry: HistoryEntryType): void => {
    // Emit event instead of directly calling store methods
    // This follows event-driven architecture for loose coupling
    globalEventBus.emit('history.entry-selected', entry, 'HistoryDrawer');
  };

  const handleDeleteEntry = async (id: string): Promise<void> => {
    await deleteEntry(id);
  };

  return (
    <DrawerSection
      title="History"
      icon={<History size={14} />}
      defaultOpen={true}
      testId="history-drawer"
    >
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <span className="text-xs text-text-muted">Loading...</span>
        </div>
      )}
      {!isLoading && error !== null && (
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-signal-error bg-signal-error/10 rounded-lg">
          <span>Error loading history: {error}</span>
        </div>
      )}
      {!isLoading && error === null && entries.length === 0 && (
        <div className="flex items-center gap-3 text-sm text-text-muted hover:text-text-secondary hover:bg-bg-raised/50 rounded-lg px-3 py-2 transition-all duration-200 cursor-pointer group">
          <History
            size={15}
            className="text-text-muted/60 group-hover:text-signal-warning/70 transition-colors"
          />
          <span className="opacity-60 group-hover:opacity-100 transition-opacity">
            No history yet
          </span>
        </div>
      )}
      {!isLoading && error === null && entries.length > 0 && (
        <div className="flex flex-col gap-1">
          {entries.map((entry) => (
            <HistoryEntry
              key={entry.id}
              entry={entry}
              onSelect={handleSelectEntry}
              onDelete={handleDeleteEntry}
            />
          ))}
        </div>
      )}
    </DrawerSection>
  );
};

export const Sidebar = (): React.JSX.Element => {
  return (
    <aside className="w-full h-full bg-bg-surface flex flex-col" data-testid="sidebar-content">
      {/* Collections Drawer */}
      <DrawerSection
        title="Collections"
        icon={<Folder size={14} />}
        defaultOpen={true}
        testId="collections-drawer"
      >
        <div className="flex items-center gap-3 text-sm text-text-muted hover:text-text-secondary hover:bg-bg-raised/50 rounded-lg px-3 py-2 transition-all duration-200 cursor-pointer group">
          <Folder
            size={15}
            className="text-text-muted/60 group-hover:text-accent-blue/70 transition-colors"
          />
          <span className="opacity-60 group-hover:opacity-100 transition-opacity">
            No collections yet
          </span>
        </div>
      </DrawerSection>

      {/* History Drawer */}
      <HistoryDrawer />

      {/* Spacer to push content up */}
      <div className="flex-1" />
    </aside>
  );
};
