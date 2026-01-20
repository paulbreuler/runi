/**
 * @file ResponsePanel component
 * @description Panel with tabs for Request Body and Response Body
 */

import { useState, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { BodyViewer } from './BodyViewer';
import { CopyButton } from './CopyButton';

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
export const ResponsePanel = ({
  requestBody,
  responseBody,
  className,
}: ResponsePanelProps): React.ReactElement => {
  const [activeTab, setActiveTab] = useState<TabType>('response');

  const currentBody = activeTab === 'response' ? responseBody : requestBody;
  const currentBodyText = currentBody ?? '';

  const _handleTabKeyDown = useCallback((e: React.KeyboardEvent, tab: TabType): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveTab(tab);
    } else if (e.key === 'ArrowLeft' && tab === 'request') {
      e.preventDefault();
      setActiveTab('response');
    } else if (e.key === 'ArrowRight' && tab === 'response') {
      e.preventDefault();
      setActiveTab('request');
    }
  }, []);

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
        className="flex-1 flex flex-col gap-2"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <BodyViewer body={currentBody} />
          </div>
          {currentBodyText !== '' && (
            <div className="shrink-0">
              <CopyButton text={currentBodyText} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
