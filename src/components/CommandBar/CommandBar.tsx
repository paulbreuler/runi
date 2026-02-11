/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'motion/react';
import { useTabStore } from '@/stores/useTabStore';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
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
export const CommandBar = ({ isOpen, onClose }: CommandBarProps): React.ReactElement | null => {
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
      value: `${tab.method} ${tab.label} ${tab.url}`.toLowerCase(),
    }));
  }, [tabs]);

  // Convert collections to searchable list
  const collectionItems = useMemo(() => {
    return collections.flatMap((collection) =>
      collection.requests.map((request) => ({
        id: `${collection.id}:${request.id}`,
        collectionId: collection.id,
        requestId: request.id,
        label: request.name,
        value: `${request.method} ${request.name} ${request.url}`.toLowerCase(),
      }))
    );
  }, [collections]);

  // Convert history to searchable list
  const historyItems = useMemo(() => {
    return historyEntries.map((entry) => ({
      id: entry.id,
      label: `${entry.request.method} ${entry.request.url}`,
      value: `${entry.request.method} ${entry.request.url}`.toLowerCase(),
    }));
  }, [historyEntries]);

  const handleTabSelect = (tabId: string): void => {
    setActiveTab(tabId);
    onClose();
  };

  const handleActionSelect = (action: CommandAction): void => {
    executeAction(action);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <div
        className="absolute inset-0 z-80 flex items-start justify-center pt-[20vh]"
        data-test-id="command-bar"
      >
        {/* Backdrop */}
        <motion.button
          type="button"
          className="absolute inset-0 bg-bg-overlay backdrop-blur-md"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-label="Close command bar"
          data-test-id="command-bar-backdrop"
        />

        {/* Command palette panel */}
        <motion.div
          className="relative z-81 w-full max-w-[640px] mx-4"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <Command
            className={cn(
              'glass',
              'bg-bg-elevated border border-border-default rounded-lg shadow-2xl',
              'overflow-hidden max-h-[400px] flex flex-col'
            )}
            label="Command palette"
            shouldFilter
            loop
            role="dialog"
            aria-label="Command palette"
          >
            <div className="flex items-center border-b border-border-default px-3">
              <Command.Input
                ref={inputRef}
                className={cn(
                  'flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none',
                  'placeholder:text-text-secondary',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  focusRingClasses
                )}
                placeholder="Search tabs, collections, history, or run actions..."
                data-test-id="command-bar-input"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    onClose();
                  }
                }}
              />
            </div>

            <Command.List className="overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-text-secondary">
                No results found.
              </Command.Empty>

              {/* Open Tabs Section */}
              {tabItems.length > 0 && (
                <Command.Group heading="Open Tabs" className="mb-2">
                  {tabItems.map((item) => (
                    <Command.Item
                      key={item.id}
                      value={item.value}
                      onSelect={() => {
                        handleTabSelect(item.id);
                      }}
                      className={cn(
                        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
                        'data-[selected=true]:bg-bg-raised data-[selected=true]:text-text-primary',
                        'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50'
                      )}
                      data-test-id={`tab-item-${item.id}`}
                    >
                      {item.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Collections Section */}
              {collectionItems.length > 0 && (
                <Command.Group heading="Collections" className="mb-2">
                  {collectionItems.map((item) => (
                    <Command.Item
                      key={item.id}
                      value={item.value}
                      onSelect={() => {
                        // TODO: Implement collection request selection
                        onClose();
                      }}
                      className={cn(
                        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
                        'data-[selected=true]:bg-bg-raised data-[selected=true]:text-text-primary',
                        'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50'
                      )}
                      data-test-id={`collection-item-${item.id}`}
                    >
                      {item.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* History Section */}
              {historyItems.length > 0 && (
                <Command.Group heading="History" className="mb-2">
                  {historyItems.map((item) => (
                    <Command.Item
                      key={item.id}
                      value={item.value}
                      onSelect={() => {
                        // TODO: Implement history item selection
                        onClose();
                      }}
                      className={cn(
                        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
                        'data-[selected=true]:bg-bg-raised data-[selected=true]:text-text-primary',
                        'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50'
                      )}
                      data-test-id={`history-item-${item.id}`}
                    >
                      {item.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Actions Section */}
              <Command.Group heading="Actions">
                {COMMAND_ACTIONS.map((action) => (
                  <Command.Item
                    key={action.id}
                    value={action.label.toLowerCase()}
                    onSelect={() => {
                      handleActionSelect(action);
                    }}
                    className={cn(
                      'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
                      'data-[selected=true]:bg-bg-raised data-[selected=true]:text-text-primary',
                      'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50'
                    )}
                    data-test-id={`action-${action.id}`}
                  >
                    {action.label}
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
