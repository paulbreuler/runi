/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { useTabStore } from '@/stores/useTabStore';
import { methodTextColors, type HttpMethod } from '@/utils/http-colors';
import { containedFocusRingClasses, focusRingClasses } from '@/utils/accessibility';
import { truncateNavLabel } from '@/utils/truncateNavLabel';
import { SidebarScrollArea } from '@/components/Sidebar/SidebarScrollArea';
import { cn } from '@/utils/cn';

interface OpenItemsProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Sidebar section showing all open tabs as a flat list.
 * Implements progressive disclosure: hidden when 0–1 tabs.
 */
export const OpenItems = ({ className, style }: OpenItemsProps): React.JSX.Element | null => {
  const tabs = useTabStore((s) => s.tabs);
  const tabOrder = useTabStore((s) => s.tabOrder);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const setActiveTab = useTabStore((s) => s.setActiveTab);
  const closeTab = useTabStore((s) => s.closeTab);

  const [isOpen, setIsOpen] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  // Progressive disclosure: hidden when 0–1 tabs
  if (tabOrder.length <= 1) {
    return null;
  }

  const handleItemClick = (tabId: string): void => {
    setActiveTab(tabId);
  };

  const handleCloseClick = (e: React.MouseEvent, tabId: string): void => {
    e.stopPropagation();
    closeTab(tabId);
  };

  const handleMiddleClick = (e: React.MouseEvent, tabId: string): void => {
    if (e.button === 1) {
      e.preventDefault();
      closeTab(tabId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, tabId: string, index: number): void => {
    if (listRef.current === null) {
      return;
    }
    const items = listRef.current.querySelectorAll<HTMLElement>('[role="option"]');
    if (items.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const nextIndex = (index + 1) % items.length;
        items[nextIndex]?.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prevIndex = (index - 1 + items.length) % items.length;
        items[prevIndex]?.focus();
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        setActiveTab(tabId);
        break;
      }
      case 'Delete':
      case 'Backspace': {
        e.preventDefault();
        closeTab(tabId);
        break;
      }
    }
  };

  return (
    <div
      className={cn('flex flex-col min-h-0 overflow-hidden', className)}
      style={style}
      data-test-id="open-items-section"
    >
      {/* Section header */}
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
        data-test-id="open-items-section-toggle"
      >
        <span className="text-text-muted group-hover:text-text-primary transition-colors">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span
          className="text-xs font-semibold text-text-secondary uppercase tracking-wider group-hover:text-text-primary transition-colors"
          data-test-id="open-items-title"
        >
          Open
        </span>
        <span className="text-[10px] text-text-muted tabular-nums" data-test-id="open-items-count">
          {tabOrder.length}
        </span>
      </button>

      {/* Tab list */}
      {isOpen && (
        <SidebarScrollArea testId="open-items-scroll">
          <div
            ref={listRef}
            role="listbox"
            aria-label="Open requests"
            data-test-id="open-items-list"
          >
            {tabOrder.map((tabId, index) => {
              const tab = tabs[tabId];
              if (tab === undefined) {
                return null;
              }

              const isActive = tabId === activeTabId;
              const methodKey = tab.method as HttpMethod;
              const methodClass =
                methodKey in methodTextColors ? methodTextColors[methodKey] : 'text-text-muted';

              return (
                <div
                  key={tabId}
                  role="option"
                  tabIndex={isActive ? 0 : -1}
                  aria-selected={isActive}
                  data-active={isActive || undefined}
                  data-test-id={`open-items-tab-${tabId}`}
                  className={cn(
                    focusRingClasses,
                    'w-full flex items-center gap-2 py-1 px-2 min-h-[28px] cursor-pointer transition-colors group/item rounded-sm',
                    isActive ? 'bg-accent-blue/10' : 'hover:bg-bg-raised/40'
                  )}
                  onClick={() => {
                    handleItemClick(tabId);
                  }}
                  onMouseDown={(e) => {
                    handleMiddleClick(e, tabId);
                  }}
                  onKeyDown={(e) => {
                    handleKeyDown(e, tabId, index);
                  }}
                >
                  {/* Dirty indicator */}
                  {tab.isDirty && (
                    <span
                      className="shrink-0 h-1.5 w-1.5 rounded-full bg-signal-warning"
                      data-test-id={`open-items-dirty-${tabId}`}
                      aria-label="Unsaved changes"
                    />
                  )}

                  {/* Method badge */}
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-widest shrink-0 min-w-[28px]',
                      methodClass
                    )}
                    data-test-id={`open-items-method-${tabId}`}
                  >
                    {tab.method}
                  </span>

                  {/* Label */}
                  <span
                    className="text-sm text-text-primary truncate flex-1 min-w-0"
                    data-test-id={`open-items-label-${tabId}`}
                  >
                    {truncateNavLabel(tab.label)}
                  </span>

                  {/* Close button */}
                  <button
                    type="button"
                    className={cn(
                      focusRingClasses,
                      'shrink-0 p-0.5 rounded-sm text-text-muted hover:text-text-primary transition-opacity',
                      'opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100'
                    )}
                    aria-label={`Close tab ${tab.method} ${tab.label}`}
                    data-test-id={`open-items-close-${tabId}`}
                    onClick={(e) => {
                      handleCloseClick(e, tabId);
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </SidebarScrollArea>
      )}
    </div>
  );
};
