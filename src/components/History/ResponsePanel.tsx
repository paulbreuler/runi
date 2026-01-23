/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file ResponsePanel component
 * @description Panel with tabs for Request Body and Response Body
 */

import { useState, useMemo, useCallback, useRef } from 'react';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import { focusWithVisibility } from '@/utils/focusVisibility';
import { CodeSnippet } from './CodeSnippet';
import { detectSyntaxLanguage } from '@/components/CodeHighlighting/syntaxLanguage';
import { EmptyState } from '@/components/ui/EmptyState';

export interface ResponsePanelProps {
  /** Request body content */
  requestBody: string | null;
  /** Response body content */
  responseBody: string;
  /** Additional CSS classes */
  className?: string;
  /** Optional keyboard handler for hierarchical navigation */
  onKeyDown?: (e: React.KeyboardEvent) => void;
  /** Optional ref for keyboard navigation coordination */
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

type TabType = 'response' | 'request';

/**
 * ResponsePanel component with tabs for Request Body and Response Body.
 *
 * Response Body tab is active by default. Includes copy button for
 * the currently active tab's content.
 *
 * @example
 * ```tsx
 * <ResponsePanel
 *   requestBody='{"name":"John"}'
 *   responseBody='{"id":1}'
 * />
 * ```
 */
/**
 * Format JSON with 2-space indentation if valid JSON, otherwise return as-is
 */
function formatJson(body: string): string {
  try {
    const parsed: unknown = JSON.parse(body);
    return JSON.stringify(parsed, null, 2);
  } catch {
    // Not valid JSON, return as-is
    return body;
  }
}

export const ResponsePanel = ({
  requestBody,
  responseBody,
  className,
  onKeyDown,
  containerRef,
}: ResponsePanelProps): React.ReactElement => {
  const [activeTab, setActiveTab] = useState<TabType>('response');
  const responseTabRef = useRef<HTMLButtonElement>(null);
  const requestTabRef = useRef<HTMLButtonElement>(null);

  const currentBody = activeTab === 'response' ? responseBody : requestBody;
  const currentBodyText = currentBody ?? '';

  // Detect language for syntax highlighting (matches ResponseViewer body tab)
  const language = useMemo(() => {
    if (currentBodyText === '') {
      return 'text';
    }
    return detectSyntaxLanguage({ body: currentBodyText });
  }, [currentBodyText]);

  // Format body (only format JSON if language is detected as JSON, matches ResponseViewer body tab)
  const formattedBody = useMemo(() => {
    if (currentBodyText === '') {
      return '';
    }
    // Only format JSON if language is detected as JSON, otherwise use body as-is
    return language === 'json' ? formatJson(currentBodyText) : currentBodyText;
  }, [currentBodyText, language]);

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
      data-testid="response-panel"
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
          data-testid="response-body-tab"
          onClick={(): void => {
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
          Response Body
        </button>
        <button
          ref={requestTabRef}
          type="button"
          role="tab"
          aria-selected={activeTab === 'request'}
          data-testid="request-body-tab"
          onClick={(): void => {
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
          Request Body
        </button>
      </div>

      {/* Tab content */}
      <div
        id={activeTab === 'response' ? 'response-body-panel' : 'request-body-panel'}
        role="tabpanel"
        aria-labelledby={activeTab === 'response' ? 'response-body-tab' : 'request-body-tab'}
        className="flex-1 flex flex-col"
      >
        {currentBodyText === '' ? (
          <EmptyState
            variant="muted"
            title={`No ${activeTab} body`}
            description={
              activeTab === 'response' ? 'This response has no body' : 'This request has no body'
            }
          />
        ) : (
          <CodeSnippet
            code={formattedBody}
            language={language}
            variant="borderless"
            className="flex-1"
          />
        )}
      </div>
    </div>
  );
};
