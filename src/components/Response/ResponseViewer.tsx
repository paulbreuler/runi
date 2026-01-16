import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { HttpResponse } from '@/types/http';

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
 * Detect content type and format accordingly
 */
function detectContentType(body: string, headers: Record<string, string>): string {
  const contentType = headers['content-type'] || headers['Content-Type'] || '';
  
  if (contentType.includes('application/json')) return 'json';
  if (contentType.includes('application/xml') || contentType.includes('text/xml')) return 'xml';
  if (contentType.includes('text/html')) return 'html';
  if (contentType.includes('text/css')) return 'css';
  if (contentType.includes('text/javascript') || contentType.includes('application/javascript')) return 'javascript';
  if (contentType.includes('application/yaml') || contentType.includes('text/yaml')) return 'yaml';
  
  // Try to detect JSON by parsing
  try {
    JSON.parse(body);
    return 'json';
  } catch {
    // Not JSON
  }
  
  return 'text';
}

/**
 * Format JSON with proper 2-space indentation
 */
function formatJson(body: string): string {
  try {
    const parsed = JSON.parse(body);
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
  lines.push(`HTTP/1.1 ${response.status} ${response.status_text}`);
  
  // Headers
  Object.entries(response.headers).forEach(([key, value]) => {
    lines.push(`${key}: ${value}`);
  });
  
  // Blank line before body
  lines.push('');
  
  // Body (formatted if JSON with 2-space indent)
  const contentType = detectContentType(response.body, response.headers);
  if (contentType === 'json') {
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
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Custom dark theme matching our zen aesthetic
 */
const customDarkTheme = {
  ...oneDark,
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.875rem',
    lineHeight: '1.6',
  },
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: 'transparent',
    padding: 0,
    margin: 0,
  },
};

export const ResponseViewer = ({ response }: ResponseViewerProps): React.JSX.Element => {
  const [activeTab, setActiveTab] = useState<TabId>('body');
  
  const headerCount = Object.keys(response.headers).length;
  const bodySize = formatSize(response.body);
  const contentType = detectContentType(response.body, response.headers);
  const formattedBody = contentType === 'json' ? formatJson(response.body) : response.body;

  return (
    <div className="h-full flex flex-col" data-testid="response-viewer">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border-subtle bg-bg-surface">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-bg-raised text-text-primary font-medium'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-raised/50'
            }`}
          >
            {tab.label}
            {tab.id === 'headers' && (
              <span className="ml-1.5 text-xs text-text-muted">({headerCount})</span>
            )}
          </button>
        ))}
        
        {/* Meta info */}
        <div className="ml-auto flex items-center gap-4 text-xs text-text-muted font-mono">
          <span>{bodySize}</span>
          <span>{response.timing.total_ms}ms</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto" style={{ scrollbarGutter: 'stable' }}>
        {activeTab === 'body' && (
          <div className="p-4">
            <SyntaxHighlighter
              language={contentType}
              style={customDarkTheme}
              customStyle={{
                background: 'transparent',
                padding: 0,
                margin: 0,
                fontSize: '0.875rem',
                lineHeight: '1.6',
              }}
              showLineNumbers
              lineNumberStyle={{
                minWidth: '2.5em',
                paddingRight: '1em',
                color: 'var(--color-text-muted)',
                opacity: 0.5,
                userSelect: 'none',
              }}
              // Use 2 spaces for indentation
              PreTag="div"
              codeTagProps={{
                style: {
                  fontFamily: 'var(--font-mono)',
                },
              }}
            >
              {formattedBody}
            </SyntaxHighlighter>
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
                  <span className="text-text-secondary">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'raw' && (
          <div className="p-4">
            <SyntaxHighlighter
              language="http"
              style={customDarkTheme}
              customStyle={{
                background: 'transparent',
                padding: 0,
                margin: 0,
                fontSize: '0.875rem',
                lineHeight: '1.6',
              }}
              showLineNumbers
              lineNumberStyle={{
                minWidth: '2.5em',
                paddingRight: '1em',
                color: 'var(--color-text-muted)',
                opacity: 0.5,
                userSelect: 'none',
              }}
              PreTag="div"
              codeTagProps={{
                style: {
                  fontFamily: 'var(--font-mono)',
                },
              }}
            >
              {formatRawHttp(response)}
            </SyntaxHighlighter>
          </div>
        )}
      </div>
    </div>
  );
};
