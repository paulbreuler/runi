/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { HttpResponse } from '@/types/http';
import { detectSyntaxLanguage } from '@/components/CodeHighlighting/syntaxLanguage';
import { motion, useReducedMotion } from 'motion/react';
import { CodeSnippet } from '@/components/History/CodeSnippet';

interface ResponseViewerProps {
  response: HttpResponse;
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

/**
 * Calculate approximate body size
 */
function formatSize(body: string): string {
  const bytes = new Blob([body]).size;
  if (bytes < 1024) {
    return `${String(bytes)} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ResponseViewer = ({ response }: ResponseViewerProps): React.JSX.Element => {
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
  const bodySize = formatSize(response.body);
  const contentTypeHeader =
    response.headers['content-type'] ?? response.headers['Content-Type'] ?? undefined;
  const language = detectSyntaxLanguage({ body: response.body, contentType: contentTypeHeader });
  const formattedBody = language === 'json' ? formatJson(response.body) : response.body;

  return (
    <div className="h-full flex flex-col" data-testid="response-viewer">
      {/* Tab bar */}
      <div className="relative flex items-center gap-2 px-4 py-2 border-b border-border-subtle bg-bg-surface">
        <div
          ref={tabScrollRef}
          className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hidden touch-pan-x"
          aria-label="Response tabs"
        >
          <div className="flex items-center gap-1 pr-2 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                }}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-bg-raised text-text-primary font-medium'
                    : 'text-text-muted hover:text-text-secondary hover:bg-bg-raised/50'
                }`}
                data-testid={`response-tab-${tab.id}`}
              >
                {tab.label}
                {tab.id === 'headers' && (
                  <span className="ml-1.5 text-xs text-text-muted">({headerCount})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {showOverflowCue && canScrollLeft && (
          <motion.div
            className="pointer-events-none absolute inset-y-0 left-2 w-6 bg-linear-to-r from-bg-surface/90 to-transparent"
            data-testid="response-tabs-overflow-left"
            initial={false}
            animate={getOverflowAnimation('left')}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        {showOverflowCue && canScrollRight && (
          <motion.div
            className="pointer-events-none absolute inset-y-0 right-20 w-6 bg-linear-to-l from-bg-surface/90 to-transparent"
            data-testid="response-tabs-overflow-right"
            initial={false}
            animate={getOverflowAnimation('right')}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Meta info */}
        <div className="flex items-center gap-4 text-xs text-text-muted font-mono shrink-0">
          <span>{bodySize}</span>
          <span>{response.timing.total_ms}ms</span>
        </div>
      </div>

      {/* Content - vertical scroll only, code blocks handle horizontal */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarGutter: 'stable' }}
      >
        {activeTab === 'body' && (
          <div className="p-4" data-testid="response-body">
            <span className="sr-only" data-testid="response-body-raw">
              {formattedBody}
            </span>
            <CodeSnippet
              code={formattedBody}
              language={language}
              variant="borderless"
              className="h-full"
            />
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="p-4">
            {/* Status line - httpie style */}
            <div className="mb-4 pb-4 border-b border-border-subtle">
              <span className="font-mono text-sm">
                <span className="text-text-muted">HTTP/1.1</span>{' '}
                <span className="text-signal-success font-semibold">{response.status}</span>{' '}
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
        )}

        {activeTab === 'raw' && (
          <div className="p-4" data-testid="response-raw">
            <span className="sr-only" data-testid="response-raw-text">
              {formatRawHttp(response)}
            </span>
            <CodeSnippet
              code={formatRawHttp(response)}
              language="http"
              variant="borderless"
              className="h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};
