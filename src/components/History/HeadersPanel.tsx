/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file HeadersPanel component
 * @description Panel with tabs for Request Headers and Response Headers
 */

import { useState, useMemo, useCallback } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { cn } from '@/utils/cn';
import { CodeEditor } from '@/components/CodeHighlighting/CodeEditor';
import { EmptyState } from '@/components/ui/EmptyState';
import { BaseTabsList } from '@/components/ui/BaseTabsList';

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

export type HeadersPanelTabType = 'response' | 'request';

/**
 * HeadersPanel component with tabs for Request Headers and Response Headers.
 *
 * Uses Base UI Tabs with Motion indicator. Response Headers tab is active by default.
 * Roving tabindex: only active tab in tab order; Arrow keys move between tabs.
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
  const [activeTab, setActiveTab] = useState<HeadersPanelTabType>('response');

  const responseHeadersText = useMemo(
    () =>
      Object.entries(responseHeaders)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n'),
    [responseHeaders]
  );
  const requestHeadersText = useMemo(
    () =>
      Object.entries(requestHeaders)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n'),
    [requestHeaders]
  );

  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      onKeyDown?.(e);
    },
    [onKeyDown]
  );

  return (
    <div
      ref={containerRef}
      data-test-id="headers-panel"
      className={cn('flex flex-col', className)}
      onKeyDown={handleContainerKeyDown}
    >
      <Tabs.Root value={activeTab} onValueChange={setActiveTab as (value: string) => void}>
        <BaseTabsList
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            { value: 'response', label: 'Response Headers', testId: 'response-headers-tab' },
            { value: 'request', label: 'Request Headers', testId: 'request-headers-tab' },
          ]}
          listClassName="flex gap-1 border-b border-border-default mb-3"
          tabClassName="shrink-0 px-3 py-1.5 text-xs rounded-t flex items-center gap-1.5 relative"
          activeTabClassName="text-text-primary"
          inactiveTabClassName="text-text-muted hover:text-text-primary hover:bg-bg-raised/50"
          indicatorLayoutId="headers-tab-indicator"
          indicatorClassName="bg-bg-raised rounded-t"
          indicatorTestId="headers-tab-indicator"
          listTestId="headers-tabs-list"
          activateOnFocus={false}
        />

        <Tabs.Panel value="response" className="flex-1 flex flex-col">
          {Object.keys(responseHeaders).length === 0 ? (
            <EmptyState
              variant="muted"
              title="No response headers"
              description="This response has no headers"
            />
          ) : (
            <CodeEditor
              mode="display"
              code={responseHeadersText}
              language="http"
              variant="contained"
              className="flex-1"
            />
          )}
        </Tabs.Panel>
        <Tabs.Panel value="request" className="flex-1 flex flex-col">
          {Object.keys(requestHeaders).length === 0 ? (
            <EmptyState
              variant="muted"
              title="No request headers"
              description="This request has no headers"
            />
          ) : (
            <CodeEditor
              mode="display"
              code={requestHeadersText}
              language="http"
              variant="contained"
              className="flex-1"
            />
          )}
        </Tabs.Panel>
      </Tabs.Root>
    </div>
  );
};
