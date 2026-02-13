/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import type { RequestTabState } from '@/types/canvas';
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
 * Sidebar section showing all open request tabs as a flat list.
 * Implements progressive disclosure: hidden when 0–1 tabs.
 */
export const OpenItems = ({ className, style }: OpenItemsProps): React.JSX.Element | null => {
  const contexts = useCanvasStore((s) => s.contexts);
  const contextOrder = useCanvasStore((s) => s.contextOrder);
  const activeContextId = useCanvasStore((s) => s.activeContextId);
  const setActiveContext = useCanvasStore((s) => s.setActiveContext);
  const closeContext = useCanvasStore((s) => s.closeContext);
  const getContextState = useCanvasStore((s) => s.getContextState);

  const [isOpen, setIsOpen] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter to only show request-type contexts
  const requestContexts = contextOrder.filter((id) => id.startsWith('request-'));

  // Progressive disclosure: hidden when 0–1 request tabs
  if (requestContexts.length <= 1) {
    return null;
  }

  const handleItemClick = (contextId: string): void => {
    setActiveContext(contextId);
  };

  const handleCloseClick = (e: React.MouseEvent, contextId: string): void => {
    e.stopPropagation();
    closeContext(contextId);
  };

  const handleMiddleClick = (e: React.MouseEvent, contextId: string): void => {
    if (e.button === 1) {
      e.preventDefault();
      closeContext(contextId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, contextId: string, index: number): void => {
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
        setActiveContext(contextId);
        break;
      }
      case 'Delete':
      case 'Backspace': {
        e.preventDefault();
        closeContext(contextId);
        break;
      }
      // Explicitly allow Tab to escape the section (P0 fix)
      case 'Tab':
        return;
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
          {requestContexts.length}
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
            className="outline-none"
          >
            {requestContexts.map((contextId, index) => {
              const context = contexts.get(contextId);
              const contextState = getContextState(contextId) as unknown as RequestTabState;

              if (context === undefined) {
                return null;
              }

              const isActive = contextId === activeContextId;
              const isFirst = index === 0;
              const hasActiveInList = requestContexts.includes(activeContextId ?? '');
              const isTabbable = isActive || (!hasActiveInList && isFirst);
              const methodKey = contextState.method as HttpMethod;
              const methodClass =
                methodKey in methodTextColors ? methodTextColors[methodKey] : 'text-text-muted';

              return (
                <div
                  key={contextId}
                  role="option"
                  tabIndex={isTabbable ? 0 : -1}
                  aria-selected={isActive}
                  data-active={isActive || undefined}
                  data-test-id={`open-items-tab-${contextId}`}
                  className={cn(
                    focusRingClasses,
                    'w-full flex items-center gap-2 py-1 px-2 min-h-[28px] cursor-pointer transition-colors group/item rounded-sm',
                    isActive ? 'bg-accent-blue/10' : 'hover:bg-bg-raised/40'
                  )}
                  onClick={() => {
                    handleItemClick(contextId);
                  }}
                  onMouseDown={(e) => {
                    handleMiddleClick(e, contextId);
                  }}
                  onKeyDown={(e) => {
                    handleKeyDown(e, contextId, index);
                  }}
                >
                  {/* Dirty indicator */}
                  {contextState.isDirty === true && (
                    <span
                      className="shrink-0 h-1.5 w-1.5 rounded-full bg-signal-warning"
                      data-test-id={`open-items-dirty-${contextId}`}
                      aria-label="Unsaved changes"
                    />
                  )}

                  {/* Method badge */}
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-widest shrink-0 min-w-[28px]',
                      methodClass
                    )}
                    data-test-id={`open-items-method-${contextId}`}
                  >
                    {contextState.method}
                  </span>

                  {/* Label */}
                  <span
                    className="text-sm text-text-primary truncate flex-1 min-w-0"
                    data-test-id={`open-items-label-${contextId}`}
                  >
                    {truncateNavLabel(context.label)}
                  </span>

                  {/* Close button */}
                  <button
                    type="button"
                    className={cn(
                      focusRingClasses,
                      'shrink-0 p-0.5 rounded-sm text-text-muted hover:text-text-primary transition-opacity',
                      'opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100'
                    )}
                    aria-label={`Close tab ${contextState.method} ${context.label}`}
                    data-test-id={`open-items-close-${contextId}`}
                    onClick={(e) => {
                      handleCloseClick(e, contextId);
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
