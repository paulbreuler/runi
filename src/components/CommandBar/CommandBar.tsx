/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'motion/react';
import { Search, File, FolderSearch, History, Zap } from 'lucide-react';
import { useTabStore } from '@/stores/useTabStore';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { globalEventBus, type CollectionRequestSelectedPayload } from '@/events/bus';
import type { HistoryEntry } from '@/types/generated/HistoryEntry';
import type { CollectionRequest } from '@/types/collection';
import { cn } from '@/utils/cn';
import { getMethodColor, type HttpMethod } from '@/utils/http-colors';
import { COMMAND_BAR_Z_INDEX } from '@/utils/z-index';
import { focusRingClasses } from '@/utils/accessibility';
import { focusWithVisibility } from '@/utils/focusVisibility';
import type { CommandAction } from './commands';
import { COMMAND_ACTIONS, executeAction } from './commands';

interface CommandBarProps {
  /** Whether the command bar is open */
  isOpen: boolean;
  /** Callback to close the command bar */
  onClose: () => void;
}

/**
 * Floating command palette overlay triggered by Cmd+K.
 * Provides global search across collections, open tabs, and history, plus quick actions.
 */
export const CommandBar = ({ isOpen, onClose }: CommandBarProps): React.ReactElement => {
  const inputRef = useRef<HTMLInputElement>(null);
  const tabs = useTabStore((state) => state.tabs);
  const setActiveTab = useTabStore((state) => state.setActiveTab);
  const collections = useCollectionStore((state) => state.collections);
  const historyEntries = useHistoryStore((state) => state.entries);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current !== null) {
      focusWithVisibility(inputRef.current);
    }
  }, [isOpen]);

  // Convert tabs to searchable list
  const tabItems = useMemo(() => {
    return Object.values(tabs).map((tab) => ({
      id: tab.id,
      label: tab.label,
      method: tab.method,
      url: tab.url,
      value: `${tab.method} ${tab.label} ${tab.url}`.toLowerCase(),
    }));
  }, [tabs]);

  // Convert collections to searchable list
  const collectionItems = useMemo(() => {
    return collections.flatMap((collection) =>
      collection.requests.map((request) => ({
        id: `${collection.id}:${request.id}`,
        collectionId: collection.id,
        request,
        label: request.name,
        method: request.method,
        url: request.url,
        value: `${request.method} ${request.name} ${request.url}`.toLowerCase(),
      }))
    );
  }, [collections]);

  // Convert history to searchable list
  const historyItems = useMemo(() => {
    return historyEntries.map((entry) => ({
      id: entry.id,
      entry,
      label: entry.request.url !== '' ? entry.request.url : 'Untitled Request',
      method: entry.request.method,
      url: entry.request.url,
      value: `${entry.request.method} ${entry.request.url}`.toLowerCase(),
    }));
  }, [historyEntries]);

  const handleTabSelect = (tabId: string): void => {
    setActiveTab(tabId);
    onClose();
  };

  const handleCollectionSelect = (collectionId: string, request: CollectionRequest): void => {
    globalEventBus.emit<CollectionRequestSelectedPayload>('collection.request-selected', {
      collectionId,
      request,
    });
    onClose();
  };

  const handleHistorySelect = (entry: HistoryEntry): void => {
    globalEventBus.emit<HistoryEntry>('history.entry-selected', entry);
    onClose();
  };

  const handleActionSelect = (action: CommandAction): void => {
    executeAction(action);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="absolute inset-0 flex items-start justify-center pt-[12vh]"
          style={{ zIndex: COMMAND_BAR_Z_INDEX }}
          data-test-id="command-bar"
        >
          {/* Backdrop */}
          <motion.button
            type="button"
            className="absolute inset-0 bg-bg-app/80"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            aria-label="Close command bar"
            data-test-id="command-bar-backdrop"
          />

          {/* Command palette panel */}
          <motion.div
            className="relative w-full max-w-[560px] mx-4"
            style={{ zIndex: COMMAND_BAR_Z_INDEX + 1 }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Command
              className={cn(
                'bg-bg-elevated border border-border-subtle rounded-xl shadow-2xl',
                'overflow-hidden max-h-[400px] flex flex-col'
              )}
              label="Command palette"
              shouldFilter
              loop
              role="dialog"
              aria-label="Command palette"
            >
              <div className="flex items-center border-b border-border-subtle px-3">
                <Search className="w-3.5 h-3.5 text-text-muted mr-2" />
                <Command.Input
                  ref={inputRef}
                  className={cn(
                    'flex h-10 w-full bg-transparent py-2 text-sm',
                    'placeholder:text-text-muted/40',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    focusRingClasses
                  )}
                  placeholder="Search everything..."
                  data-test-id="command-bar-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      onClose();
                    }
                  }}
                />
              </div>

              <Command.List className="overflow-y-auto p-1 scrollbar-hidden">
                <Command.Empty className="py-8 text-center text-sm text-text-muted">
                  No results found.
                </Command.Empty>

                {/* Open Tabs Section */}
                {tabItems.length > 0 && (
                  <Command.Group
                    heading="Open Tabs"
                    className="mb-1 px-2 text-[9px] font-bold uppercase tracking-wider text-text-muted/50"
                  >
                    {tabItems.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={item.value}
                        onSelect={() => {
                          handleTabSelect(item.id);
                        }}
                        className={cn(
                          'group relative flex cursor-pointer select-none items-center rounded-lg px-2 py-1 text-sm outline-none mt-0.5',
                          'data-[selected=true]:bg-bg-raised data-[selected=true]:text-text-primary',
                          'transition-colors duration-[var(--duration-zen-fast)]'
                        )}
                        data-test-id={`tab-item-${item.id}`}
                      >
                        <File className="w-3 h-3 mr-2 text-text-muted group-data-[selected=true]:text-accent-blue transition-colors" />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                'font-mono text-[8px] font-bold uppercase',
                                getMethodColor(item.method as HttpMethod)
                              )}
                            >
                              {item.method}
                            </span>
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.url !== '' && (
                            <span className="text-[9px] text-text-muted truncate opacity-60">
                              {item.url}
                            </span>
                          )}
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Collections Section */}
                {collectionItems.length > 0 && (
                  <Command.Group
                    heading="Collections"
                    className="mb-1 px-2 text-[9px] font-bold uppercase tracking-wider text-text-muted/50"
                  >
                    {collectionItems.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={item.value}
                        onSelect={() => {
                          handleCollectionSelect(item.collectionId, item.request);
                        }}
                        className={cn(
                          'group relative flex cursor-pointer select-none items-center rounded-lg px-2 py-1 text-sm outline-none mt-0.5',
                          'data-[selected=true]:bg-bg-raised data-[selected=true]:text-text-primary',
                          'transition-colors duration-[var(--duration-zen-fast)]'
                        )}
                        data-test-id={`collection-item-${item.id}`}
                      >
                        <FolderSearch className="w-3 h-3 mr-2 text-text-muted group-data-[selected=true]:text-accent-blue transition-colors" />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                'font-mono text-[8px] font-bold uppercase',
                                getMethodColor(item.method as HttpMethod)
                              )}
                            >
                              {item.method}
                            </span>
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.url !== '' && (
                            <span className="text-[9px] text-text-muted truncate opacity-60">
                              {item.url}
                            </span>
                          )}
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* History Section */}
                {historyItems.length > 0 && (
                  <Command.Group
                    heading="History"
                    className="mb-1 px-2 text-[9px] font-bold uppercase tracking-wider text-text-muted/50"
                  >
                    {historyItems.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={item.value}
                        onSelect={() => {
                          handleHistorySelect(item.entry);
                        }}
                        className={cn(
                          'group relative flex cursor-pointer select-none items-center rounded-lg px-2 py-1 text-sm outline-none mt-0.5',
                          'data-[selected=true]:bg-bg-raised data-[selected=true]:text-text-primary',
                          'transition-colors duration-[var(--duration-zen-fast)]'
                        )}
                        data-test-id={`history-item-${item.id}`}
                      >
                        <History className="w-3 h-3 mr-2 text-text-muted group-data-[selected=true]:text-accent-blue transition-colors" />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                'font-mono text-[8px] font-bold uppercase',
                                getMethodColor(item.method as HttpMethod)
                              )}
                            >
                              {item.method}
                            </span>
                            <span className="truncate">{item.label}</span>
                          </div>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Actions Section */}
                <Command.Group
                  heading="Actions"
                  className="px-2 text-[9px] font-bold uppercase tracking-wider text-text-muted/50"
                  data-test-id="command-bar-actions-section"
                >
                  {COMMAND_ACTIONS.map((action) => (
                    <Command.Item
                      key={action.id}
                      value={action.label.toLowerCase()}
                      onSelect={() => {
                        handleActionSelect(action);
                      }}
                      className={cn(
                        'group relative flex cursor-pointer select-none items-center rounded-lg px-2 py-1 text-sm outline-none mt-0.5',
                        'data-[selected=true]:bg-bg-raised data-[selected=true]:text-text-primary',
                        'transition-colors duration-[var(--duration-zen-fast)]'
                      )}
                      data-test-id={`action-${action.id}`}
                    >
                      <Zap className="w-3 h-3 mr-2 text-text-muted group-data-[selected=true]:text-accent-blue transition-colors" />
                      {action.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>

              <div className="flex items-center justify-end border-t border-border-subtle p-1.5 px-3 bg-bg-surface/30">
                <div className="flex items-center gap-2 text-[8px] text-text-muted/40">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded border border-border-subtle bg-bg-raised font-sans">
                      ↑↓
                    </kbd>
                    <span>Navigate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded border border-border-subtle bg-bg-raised font-sans">
                      ↵
                    </kbd>
                    <span>Select</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded border border-border-subtle bg-bg-raised font-sans">
                      esc
                    </kbd>
                    <span>Close</span>
                  </div>
                </div>
              </div>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
