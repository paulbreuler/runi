/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file ResponsePanel component
 * @description Panel with tabs for Request Body and Response Body
 */

import { useState, useMemo } from 'react';
import { cn } from '@/utils/cn';
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
}: ResponsePanelProps): React.ReactElement => {
  const [activeTab, setActiveTab] = useState<TabType>('response');

  const currentBody = activeTab === 'response' ? responseBody : requestBody;
  const currentBodyText = currentBody ?? '';

  // Format body (JSON with 2-space indentation if valid JSON)
  const formattedBody = useMemo(() => {
    if (currentBodyText === '') {
      return '';
    }
    return formatJson(currentBodyText);
  }, [currentBodyText]);

  // Detect language for syntax highlighting
  const language = useMemo(() => {
    if (currentBodyText === '') {
      return 'text';
    }
    return detectSyntaxLanguage({ body: currentBodyText });
  }, [currentBodyText]);

  return (
    <div data-testid="response-panel" className={cn('flex flex-col', className)}>
      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-border-default mb-3">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'response'}
          onClick={(): void => {
            setActiveTab('response');
          }}
          className={cn(
            'px-3 py-1.5 text-xs font-medium transition-colors',
            'border-b-2 -mb-px',
            activeTab === 'response'
              ? 'text-text-primary border-accent-purple'
              : 'text-text-secondary border-transparent hover:text-text-primary'
          )}
        >
          Response Body
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'request'}
          onClick={(): void => {
            setActiveTab('request');
          }}
          className={cn(
            'px-3 py-1.5 text-xs font-medium transition-colors',
            'border-b-2 -mb-px',
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
            variant="contained"
            className="flex-1"
          />
        )}
      </div>
    </div>
  );
};
