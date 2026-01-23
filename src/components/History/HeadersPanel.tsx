/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file HeadersPanel component
 * @description Panel with tabs for Request Headers and Response Headers
 */

import { useState, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { CodeBox } from './CodeBox';
import { EmptyState } from '@/components/ui/EmptyState';

export interface HeadersPanelProps {
  /** Request headers object */
  requestHeaders: Record<string, string>;
  /** Response headers object */
  responseHeaders: Record<string, string>;
  /** Additional CSS classes */
  className?: string;
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
}: HeadersPanelProps): React.ReactElement => {
  const [activeTab, setActiveTab] = useState<TabType>('response');

  const currentHeaders = activeTab === 'response' ? responseHeaders : requestHeaders;
  const headerEntries = Object.entries(currentHeaders);

  // Format headers as text for display and copying (key: value format)
  const headersText = useMemo(() => {
    return Object.entries(currentHeaders)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }, [currentHeaders]);

  return (
    <div data-testid="headers-panel" className={cn('flex flex-col', className)}>
      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-border-default mb-3">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'response'}
          onClick={() => {
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
          Response Headers
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'request'}
          onClick={() => {
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
          <CodeBox
            copyText={headersText}
            copyButtonLabel="Copy headers"
            data-testid="headers-content"
          >
            <pre className="text-text-primary">
              <code>{headersText}</code>
            </pre>
          </CodeBox>
        )}
      </div>
    </div>
  );
};
