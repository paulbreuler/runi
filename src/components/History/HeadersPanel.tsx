/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file HeadersPanel component
 * @description Panel with tabs for Request Headers and Response Headers
 */

import { useState, useMemo, useCallback, useRef } from 'react';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import { focusWithVisibility } from '@/utils/focusVisibility';
import { CodeSnippet } from './CodeSnippet';
import { EmptyState } from '@/components/ui/EmptyState';

export interface HeadersPanelProps {
  /** Request headers object */
  requestHeaders: Record<string, string>;
  /** Response headers object */
  responseHeaders: Record<string, string>;
  /** Additional CSS classes */
  className?: string;
  /** Optional keyboard handler for hierarchical navigation */
  onKeyDown?: (e: React.KeyboardEvent) => void;
  /** Optional ref for keyboard navigation coordination */
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

type TabType = 'response' | 'request';

/**
 * HeadersPanel component with tabs for Request Headers and Response Headers.
 *
 * Response Headers tab is active by default. Includes copy button for
 * the currently active tab's headers (formatted as key: value pairs).
 *
 * @example
 * ```tsx
 * <HeadersPanel
 *   requestHeaders={{ 'Content-Type': 'application/json' }}
 *   responseHeaders={{ 'Content-Type': 'application/json', 'X-Rate-Limit': '100' }}
 * />
 * ```
 */
export const HeadersPanel = ({
  requestHeaders,
  responseHeaders,
  className,
  onKeyDown,
  containerRef,
}: HeadersPanelProps): React.ReactElement => {
  const [activeTab, setActiveTab] = useState<TabType>('response');
  const responseTabRef = useRef<HTMLButtonElement>(null);
  const requestTabRef = useRef<HTMLButtonElement>(null);

  const currentHeaders = activeTab === 'response' ? responseHeaders : requestHeaders;
  const headerEntries = Object.entries(currentHeaders);

  // Format headers as text for display and copying (key: value format)
  const headersText = useMemo(() => {
    return Object.entries(currentHeaders)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }, [currentHeaders]);

  /**
   * Internal keyboard navigation for secondary tabs.
   * Handles ArrowLeft/ArrowRight to navigate between tabs.
   * Uses focusWithVisibility to ensure focus ring appears.
   */
  const handleInternalKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      // First, let parent handler process the event (for ArrowUp to return to top-level)
      onKeyDown?.(e);

      // If parent handled it, don't process further
      if (e.defaultPrevented) {
        return;
      }

      const { key } = e;

      // Navigate between secondary tabs with Arrow keys
      if (key === 'ArrowRight' || key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();

        const tabs = [responseTabRef.current, requestTabRef.current];
        const currentFocusedIndex = tabs.findIndex((tab) => tab === document.activeElement);

        if (currentFocusedIndex === -1) {
          return;
        }

        let nextIndex: number;
        if (key === 'ArrowRight') {
          nextIndex = (currentFocusedIndex + 1) % tabs.length;
        } else {
          nextIndex = currentFocusedIndex === 0 ? tabs.length - 1 : currentFocusedIndex - 1;
        }

        const nextTab = tabs[nextIndex];
        if (nextTab !== undefined && nextTab !== null) {
          focusWithVisibility(nextTab);
          // Activate the tab
          setActiveTab(nextIndex === 0 ? 'response' : 'request');
        }
      }
    },
    [onKeyDown]
  );

  return (
    <div
      ref={containerRef}
      data-testid="headers-panel"
      className={cn('flex flex-col', className)}
      onKeyDown={handleInternalKeyDown}
    >
      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-border-default mb-3">
        <button
          ref={responseTabRef}
          type="button"
          role="tab"
          aria-selected={activeTab === 'response'}
          data-testid="response-headers-tab"
          onClick={() => {
            setActiveTab('response');
          }}
          className={cn(
            'px-3 py-1.5 text-xs font-medium transition-colors',
            'border-b-2 -mb-px',
            focusRingClasses,
            activeTab === 'response'
              ? 'text-text-primary border-accent-purple'
              : 'text-text-secondary border-transparent hover:text-text-primary'
          )}
        >
          Response Headers
        </button>
        <button
          ref={requestTabRef}
          type="button"
          role="tab"
          aria-selected={activeTab === 'request'}
          data-testid="request-headers-tab"
          onClick={() => {
            setActiveTab('request');
          }}
          className={cn(
            'px-3 py-1.5 text-xs font-medium transition-colors',
            'border-b-2 -mb-px',
            focusRingClasses,
            activeTab === 'request'
              ? 'text-text-primary border-accent-purple'
              : 'text-text-secondary border-transparent hover:text-text-primary'
          )}
        >
          Request Headers
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 flex flex-col">
        {headerEntries.length === 0 ? (
          <EmptyState
            variant="muted"
            title={`No ${activeTab} headers`}
            description={
              activeTab === 'response'
                ? 'This response has no headers'
                : 'This request has no headers'
            }
          />
        ) : (
          <CodeSnippet code={headersText} language="http" variant="contained" className="flex-1" />
        )}
      </div>
    </div>
  );
};
