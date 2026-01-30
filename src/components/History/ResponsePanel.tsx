/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file ResponsePanel component
 * @description Panel with tabs for Request Body and Response Body
 */

import { useState, useMemo, useCallback } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { cn } from '@/utils/cn';
import { CodeEditor } from '@/components/CodeHighlighting/CodeEditor';
import { detectSyntaxLanguage } from '@/components/CodeHighlighting/syntaxLanguage';
import { EmptyState } from '@/components/ui/EmptyState';
import { BaseTabsList } from '@/components/ui/BaseTabsList';

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

export type ResponsePanelTabType = 'response' | 'request';

function formatJsonBody(body: string): string {
  try {
    const parsed: unknown = JSON.parse(body);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return body;
  }
}

/**
 * ResponsePanel component with tabs for Request Body and Response Body.
 *
 * Uses Base UI Tabs with Motion indicator. Response Body tab is active by default.
 * Roving tabindex: only active tab in tab order; Arrow keys move between tabs.
 *
 * @example
 * ```tsx
 * <ResponsePanel
 *   requestBody='{"name":"John"}'
 *   responseBody='{"id":1}'
 * />
 * ```
 */
export const ResponsePanel = ({
  requestBody,
  responseBody,
  className,
  onKeyDown,
  containerRef,
}: ResponsePanelProps): React.ReactElement => {
  const [activeTab, setActiveTab] = useState<ResponsePanelTabType>('response');

  const responseBodyText = responseBody;
  const requestBodyText = requestBody ?? '';

  const responseLanguage = useMemo(() => {
    if (responseBodyText === '') {
      return 'text';
    }
    return detectSyntaxLanguage({ body: responseBodyText });
  }, [responseBodyText]);

  const requestLanguage = useMemo(() => {
    if (requestBodyText === '') {
      return 'text';
    }
    return detectSyntaxLanguage({ body: requestBodyText });
  }, [requestBodyText]);

  const responseFormatted = useMemo(() => {
    if (responseBodyText === '') {
      return '';
    }
    return responseLanguage === 'json' ? formatJsonBody(responseBodyText) : responseBodyText;
  }, [responseBodyText, responseLanguage]);

  const requestFormatted = useMemo(() => {
    if (requestBodyText === '') {
      return '';
    }
    return requestLanguage === 'json' ? formatJsonBody(requestBodyText) : requestBodyText;
  }, [requestBodyText, requestLanguage]);

  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      onKeyDown?.(e);
    },
    [onKeyDown]
  );

  return (
    <div
      ref={containerRef}
      data-testid="response-panel"
      className={cn('flex flex-col', className)}
      onKeyDown={handleContainerKeyDown}
    >
      <Tabs.Root value={activeTab} onValueChange={setActiveTab as (value: string) => void}>
        <BaseTabsList
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            { value: 'response', label: 'Response Body', testId: 'response-body-tab' },
            { value: 'request', label: 'Request Body', testId: 'request-body-tab' },
          ]}
          listClassName="flex gap-1 border-b border-border-default mb-3"
          tabClassName="shrink-0 px-3 py-1.5 text-xs rounded-t flex items-center gap-1.5 relative"
          activeTabClassName="text-text-primary"
          inactiveTabClassName="text-text-muted hover:text-text-primary hover:bg-bg-raised/50"
          indicatorLayoutId="response-body-tab-indicator"
          indicatorClassName="bg-bg-raised rounded-t"
          indicatorTestId="response-body-tab-indicator"
          listTestId="response-tabs-list"
          activateOnFocus={false}
        />

        <Tabs.Panel value="response" className="flex-1 flex flex-col">
          {responseBodyText === '' ? (
            <EmptyState
              variant="muted"
              title="No response body"
              description="This response has no body"
            />
          ) : (
            <CodeEditor
              mode="display"
              code={responseFormatted}
              language={responseLanguage}
              variant="contained"
              className="flex-1"
            />
          )}
        </Tabs.Panel>
        <Tabs.Panel value="request" className="flex-1 flex flex-col">
          {requestBodyText === '' ? (
            <EmptyState
              variant="muted"
              title="No request body"
              description="This request has no body"
            />
          ) : (
            <CodeEditor
              mode="display"
              code={requestFormatted}
              language={requestLanguage}
              variant="contained"
              className="flex-1"
            />
          )}
        </Tabs.Panel>
      </Tabs.Root>
    </div>
  );
};
