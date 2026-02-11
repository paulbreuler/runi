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
      inputRef.current.focus();
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
          className="absolute inset-0 z-100 flex items-start justify-center pt-[15vh]"
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
            className="relative z-101 w-full max-w-[600px] mx-4"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Command
              className={cn(
                'bg-bg-elevated border border-border-subtle rounded-xl shadow-2xl',
                'overflow-hidden max-h-[440px] flex flex-col'
              )}
              label="Command palette"
              shouldFilter
              loop
              role="dialog"
              aria-label="Command palette"
            >
              <div className="flex items-center border-b border-border-subtle px-3.5">
                <Search className="w-3.5 h-3.5 text-text-muted mr-2.5" />
                <Command.Input
                  ref={inputRef}
                  className={cn(
                    'flex h-11 w-full bg-transparent py-3 text-sm outline-none',
                    'placeholder:text-text-muted/40',
                    'disabled:cursor-not-allowed disabled:opacity-50'
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

              <Command.List className="overflow-y-auto p-1.5 scrollbar-none">
                <Command.Empty className="py-10 text-center text-sm text-text-muted">
                  No results found.
                </Command.Empty>

                {/* Open Tabs Section */}
                {tabItems.length > 0 && (
                  <Command.Group
                    heading="Open Tabs"
                    className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-text-muted/50"
                  >
                    {tabItems.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={item.value}
                        onSelect={() => {
                          onClose();
                          handleTabSelect(item.id);
                        }}
                        className={cn(
                          'group relative flex cursor-pointer select-none items-center rounded-lg px-2.5 py-1.5 text-sm outline-none mt-0.5',
                          'data-[selected=true]:bg-bg-raised data-[selected=true]:text-text-primary',
                          'transition-colors duration-[var(--duration-zen-fast)]'
                        )}
                        data-test-id={`tab-item-${item.id}`}
                      >
                        <File className="w-3.5 h-3.5 mr-2.5 text-text-muted group-data-[selected=true]:text-accent-blue transition-colors" />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'font-mono text-[9px] font-bold uppercase',
                                getMethodColor(item.method as HttpMethod)
                              )}
                            >
                              {item.method}
                            </span>
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.url !== '' && (
                            <span className="text-[10px] text-text-muted truncate mt-0.5 opacity-70">
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
                    className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-text-muted/50"
                  >
                    {collectionItems.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={item.value}
                        onSelect={() => {
                          onClose();
                          handleCollectionSelect(item.collectionId, item.request);
                        }}
                        className={cn(
                          'group relative flex cursor-pointer select-none items-center rounded-lg px-2.5 py-1.5 text-sm outline-none mt-0.5',
                          'data-[selected=true]:bg-bg-raised data-[selected=true]:text-text-primary',
                          'transition-colors duration-[var(--duration-zen-fast)]'
                        )}
                        data-test-id={`collection-item-${item.id}`}
                      >
                        <FolderSearch className="w-3.5 h-3.5 mr-2.5 text-text-muted group-data-[selected=true]:text-accent-blue transition-colors" />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'font-mono text-[9px] font-bold uppercase',
                                getMethodColor(item.method as HttpMethod)
                              )}
                            >
                              {item.method}
                            </span>
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.url !== '' && (
                            <span className="text-[10px] text-text-muted truncate mt-0.5 opacity-70">
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
                    className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-text-muted/50"
                  >
                    {historyItems.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={item.value}
                        onSelect={() => {
                          onClose();
                          handleHistorySelect(item.entry);
                        }}
                        className={cn(
                          'group relative flex cursor-pointer select-none items-center rounded-lg px-2.5 py-1.5 text-sm outline-none mt-0.5',
                          'data-[selected=true]:bg-bg-raised data-[selected=true]:text-text-primary',
                          'transition-colors duration-[var(--duration-zen-fast)]'
                        )}
                        data-test-id={`history-item-${item.id}`}
                      >
                        <History className="w-3.5 h-3.5 mr-2.5 text-text-muted group-data-[selected=true]:text-accent-blue transition-colors" />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'font-mono text-[9px] font-bold uppercase',
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
                  className="px-2 text-[10px] font-bold uppercase tracking-wider text-text-muted/50"
                  data-test-id="command-bar-actions-section"
                >
                  {COMMAND_ACTIONS.map((action) => (
                    <Command.Item
                      key={action.id}
                      value={action.label.toLowerCase()}
                      onSelect={() => {
                        onClose();
                        handleActionSelect(action);
                      }}
                      className={cn(
                        'group relative flex cursor-pointer select-none items-center rounded-lg px-2.5 py-1.5 text-sm outline-none mt-0.5',
                        'data-[selected=true]:bg-bg-raised data-[selected=true]:text-text-primary',
                        'transition-colors duration-[var(--duration-zen-fast)]'
                      )}
                      data-test-id={`action-${action.id}`}
                    >
                      <Zap className="w-3.5 h-3.5 mr-2.5 text-text-muted group-data-[selected=true]:text-accent-blue transition-colors" />
                      {action.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>

              <div className="flex items-center justify-end border-t border-border-subtle p-2 px-3.5 bg-bg-surface/30">
                <div className="flex items-center gap-2.5 text-[9px] text-text-muted/40">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded border border-border-subtle bg-bg-raised font-sans text-[8px]">
                      ↑↓
                    </kbd>
                    <span>Navigate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded border border-border-subtle bg-bg-raised font-sans text-[8px]">
                      ↵
                    </kbd>
                    <span>Select</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded border border-border-subtle bg-bg-raised font-sans text-[8px]">
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
