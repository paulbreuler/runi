import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import type { HttpResponse } from '@/types/http';
import {
  syntaxHighlightBaseStyle,
  syntaxHighlightCodeTagStyle,
  syntaxHighlightLineNumberStyle,
  syntaxHighlightTheme,
} from '@/components/CodeHighlighting/syntaxHighlighting';
import { detectSyntaxLanguage } from '@/components/CodeHighlighting/syntaxLanguage';

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
  const contentTypeHeader = response.headers['content-type'] || response.headers['Content-Type'];
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
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ResponseViewer = ({ response }: ResponseViewerProps): React.JSX.Element => {
  const [activeTab, setActiveTab] = useState<TabId>('body');
  
  const headerCount = Object.keys(response.headers).length;
  const bodySize = formatSize(response.body);
  const contentTypeHeader = response.headers['content-type'] || response.headers['Content-Type'];
  const language = detectSyntaxLanguage({ body: response.body, contentType: contentTypeHeader });
  const formattedBody = language === 'json' ? formatJson(response.body) : response.body;

  return (
    <div className="h-full flex flex-col" data-testid="response-viewer">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border-subtle bg-bg-surface">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); }}
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

      {/* Content - vertical scroll only, code blocks handle horizontal */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarGutter: 'stable' }}>
        {activeTab === 'body' && (
          <div className="p-4" data-testid="response-body">
            <span className="sr-only" data-testid="response-body-raw">
              {formattedBody}
            </span>
            <div className="overflow-x-auto" style={{ scrollbarGutter: 'stable' }}>
              <SyntaxHighlighter
                language={language}
                style={syntaxHighlightTheme}
                customStyle={syntaxHighlightBaseStyle}
                showLineNumbers
                lineNumberStyle={syntaxHighlightLineNumberStyle}
                PreTag="div"
                codeTagProps={{
                  style: syntaxHighlightCodeTagStyle,
                  'data-language': language,
                }}
              >
                {formattedBody}
              </SyntaxHighlighter>
            </div>
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
            <div className="overflow-x-auto" style={{ scrollbarGutter: 'stable' }}>
              <SyntaxHighlighter
                language="http"
                style={syntaxHighlightTheme}
                customStyle={syntaxHighlightBaseStyle}
                showLineNumbers
                lineNumberStyle={syntaxHighlightLineNumberStyle}
                PreTag="div"
                codeTagProps={{
                  style: syntaxHighlightCodeTagStyle,
                  'data-language': 'http',
                }}
              >
                {formatRawHttp(response)}
              </SyntaxHighlighter>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
