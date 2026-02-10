/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { HttpResponse } from '@/types/http';
import { Tabs } from '@base-ui/react/tabs';
import { detectSyntaxLanguage } from '@/components/CodeHighlighting/syntaxLanguage';
import { motion, useReducedMotion } from 'motion/react';
import { CodeEditor } from '@/components/CodeHighlighting/CodeEditor';
import { BaseTabsList } from '@/components/ui/BaseTabsList';

export interface ResponseViewerProps {
  response: HttpResponse;
  /** Slot rendered below the tab bar (e.g. VigilanceMonitor) */
  vigilanceSlot?: React.ReactNode;
}

type TabId = 'body' | 'headers' | 'raw';

interface Tab {
  id: TabId;
  label: string;
}

const tabs: Tab[] = [
  { id: 'body', label: 'Body' },
  { id: 'headers', label: 'Headers' },
  { id: 'raw', label: 'Raw' },
];

/**
 * Format JSON with proper 2-space indentation
 */
function formatJson(body: string): string {
  try {
    const parsed = JSON.parse(body) as unknown;
    // Use 2 spaces for indentation as requested
    return JSON.stringify(parsed, null, 2);
  } catch {
    return body;
  }
}

/**
 * Format response as raw HTTP (like httpie/curl)
 */
function formatRawHttp(response: HttpResponse): string {
  const lines: string[] = [];

  // Status line
  lines.push(`HTTP/1.1 ${String(response.status)} ${response.status_text}`);

  // Headers
  Object.entries(response.headers).forEach(([key, value]) => {
    lines.push(`${key}: ${value}`);
  });

  // Blank line before body
  lines.push('');

  // Body (formatted if JSON with 2-space indent)
  const contentTypeHeader =
    response.headers['content-type'] ?? response.headers['Content-Type'] ?? undefined;
  const language = detectSyntaxLanguage({ body: response.body, contentType: contentTypeHeader });
  if (language === 'json') {
    lines.push(formatJson(response.body));
  } else {
    lines.push(response.body);
  }

  return lines.join('\n');
}

function getStatusTextClass(status: number): string {
  if (status >= 200 && status < 300) {
    return 'text-signal-success';
  }
  if (status >= 300 && status < 400) {
    return 'text-accent-blue';
  }
  if (status >= 400 && status < 500) {
    return 'text-signal-warning';
  }
  if (status >= 500) {
    return 'text-signal-error';
  }
  return 'text-text-secondary';
}

export const ResponseViewer = ({
  response,
  vigilanceSlot,
}: ResponseViewerProps): React.JSX.Element => {
  const [activeTab, setActiveTab] = useState<TabId>('body');
  const prefersReducedMotion = useReducedMotion() === true;
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isScrollIdle, setIsScrollIdle] = useState(true);
  const scrollIdleTimeout = useRef<number | undefined>(undefined);

  const updateScrollState = useCallback((): void => {
    const container = tabScrollRef.current;
    if (container === null) {
      return;
    }
    const maxScroll = container.scrollWidth - container.clientWidth;
    const hasScrollableOverflow = maxScroll > 4;
    setHasOverflow(hasScrollableOverflow);
    setCanScrollLeft(container.scrollLeft > 2);
    setCanScrollRight(container.scrollLeft < maxScroll - 2);
  }, []);

  useEffect(() => {
    updateScrollState();
    const container = tabScrollRef.current;
    if (container === null) {
      return;
    }

    const handleScroll = (): void => {
      updateScrollState();
      setIsScrollIdle(false);
      if (scrollIdleTimeout.current !== undefined) {
        window.clearTimeout(scrollIdleTimeout.current);
      }
      scrollIdleTimeout.current = window.setTimeout(() => {
        setIsScrollIdle(true);
      }, 220);
    };

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });

    container.addEventListener('scroll', handleScroll, { passive: true });
    resizeObserver.observe(container);

    return (): void => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      if (scrollIdleTimeout.current !== undefined) {
        window.clearTimeout(scrollIdleTimeout.current);
      }
    };
  }, [updateScrollState]);

  const showOverflowCue = hasOverflow;

  // Helper function to get overflow animation props
  const getOverflowAnimation = (
    direction: 'left' | 'right'
  ): {
    opacity: number | number[];
    x: number | number[];
  } => {
    if (prefersReducedMotion) {
      return { opacity: 0.35, x: 0 };
    }
    if (isScrollIdle) {
      const xValue = direction === 'left' ? [0, 3, 0] : [0, -3, 0];
      return { opacity: [0.2, 0.4, 0.2], x: xValue };
    }
    return { opacity: 0.25, x: 0 };
  };

  const headerCount = Object.keys(response.headers).length;
  const contentTypeHeader =
    response.headers['content-type'] ?? response.headers['Content-Type'] ?? undefined;
  const language = detectSyntaxLanguage({ body: response.body, contentType: contentTypeHeader });
  const formattedBody = language === 'json' ? formatJson(response.body) : response.body;
  const overflowTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' as const };

  return (
    <div className="h-full flex flex-col" data-test-id="response-viewer">
      <Tabs.Root
        value={activeTab}
        onValueChange={setActiveTab as (value: string) => void}
        className="flex-1 min-h-0 flex flex-col"
      >
        {/* Tab bar */}
        <div
          className="relative flex items-center gap-3 pl-3 pr-2 py-2 border-b border-border-subtle bg-bg-surface"
          data-test-id="response-header-bar"
        >
          <div className="relative flex-1 min-w-0">
            <div
              ref={tabScrollRef}
              className="overflow-x-auto overflow-y-hidden scrollbar-hidden touch-pan-x"
              aria-label="Response tabs"
              data-test-id="response-tabs-scroll"
            >
              <BaseTabsList
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={tabs.map((tab) => ({
                  value: tab.id,
                  testId: `response-tab-${tab.id}`,
                  label: (
                    <span className="flex items-center gap-1.5">
                      <span>{tab.label}</span>
                      {tab.id === 'headers' && (
                        <span
                          className="text-xs text-text-muted"
                          data-test-id="response-headers-count"
                        >
                          ({headerCount})
                        </span>
                      )}
                    </span>
                  ),
                }))}
                listClassName="flex items-center gap-1 pr-2 min-w-max"
                tabClassName="px-3 h-7 text-sm rounded-lg transition-colors flex items-center gap-1.5 relative"
                activeTabClassName="text-text-primary font-medium"
                inactiveTabClassName="text-text-muted hover:text-text-primary hover:bg-bg-raised/50"
                indicatorLayoutId="response-viewer-tab-indicator"
                indicatorClassName="bg-bg-raised rounded-lg"
                indicatorTestId="response-viewer-tab-indicator"
                listTestId="response-tabs-list"
                activateOnFocus={false}
              />
            </div>

            {showOverflowCue && canScrollLeft && (
              <motion.div
                className="pointer-events-none absolute inset-y-0 left-2 w-6 bg-linear-to-r from-bg-surface/90 to-transparent"
                data-test-id="response-tabs-overflow-left"
                initial={false}
                animate={getOverflowAnimation('left')}
                transition={overflowTransition}
              />
            )}
            {showOverflowCue && canScrollRight && (
              <motion.div
                className="pointer-events-none absolute inset-y-0 right-2 w-6 bg-linear-to-l from-bg-surface/90 to-transparent"
                data-test-id="response-tabs-overflow-right"
                initial={false}
                animate={getOverflowAnimation('right')}
                transition={overflowTransition}
              />
            )}
          </div>
        </div>

        {vigilanceSlot}

        {/* Content - vertical scroll only, code blocks handle horizontal */}
        <div className="flex-1 min-h-0 overflow-hidden" style={{ scrollbarGutter: 'stable' }}>
          <Tabs.Panel value="body" className="h-full min-h-0" tabIndex={-1}>
            <div className="p-4 h-full min-h-0 flex flex-col" data-test-id="response-body">
              <span className="sr-only" data-test-id="response-body-raw">
                {formattedBody}
              </span>
              <div className="flex-1 min-h-0">
                <CodeEditor
                  mode="display"
                  code={formattedBody}
                  language={language}
                  variant="borderless"
                  className="h-full"
                />
              </div>
            </div>
          </Tabs.Panel>

          <Tabs.Panel
            value="headers"
            className="h-full min-h-0"
            tabIndex={-1}
            data-test-id="response-headers-panel"
          >
            <div className="p-4 h-full min-h-0 overflow-auto">
              {/* Status line - httpie style */}
              <div className="mb-4 pb-4 border-b border-border-subtle">
                <span className="font-mono text-sm">
                  <span className="text-text-muted">HTTP/1.1</span>{' '}
                  <span
                    className={`${getStatusTextClass(response.status)} font-semibold`}
                    data-test-id="response-status-code"
                  >
                    {response.status}
                  </span>{' '}
                  <span className="text-text-secondary">{response.status_text}</span>
                </span>
              </div>

              {/* Headers */}
              <div className="space-y-1">
                {Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} className="font-mono text-sm flex">
                    <span className="text-accent-blue">{key}</span>
                    <span className="text-text-muted mx-1">:</span>
                    <span className="text-text-secondary break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="raw" className="h-full min-h-0" tabIndex={-1}>
            <div className="p-4 h-full min-h-0 flex flex-col" data-test-id="response-raw">
              <span className="sr-only" data-test-id="response-raw-text">
                {formatRawHttp(response)}
              </span>
              <div className="flex-1 min-h-0">
                <CodeEditor
                  mode="display"
                  code={formatRawHttp(response)}
                  language="http"
                  variant="borderless"
                  className="h-full"
                />
              </div>
            </div>
          </Tabs.Panel>
        </div>
      </Tabs.Root>
    </div>
  );
};
