/**
 * @file HeadersTab component
 * @description Main headers tab component for expanded panel
 */

import { HeadersPanel } from './HeadersPanel';
import type { NetworkHistoryEntry } from '@/types/history';

export interface HeadersTabProps {
  /** Network history entry with request/response data */
  entry: NetworkHistoryEntry;
  /** Additional CSS classes */
  className?: string;
}

/**
 * HeadersTab component for the expanded panel.
 *
 * Displays request and response headers in a tabbed interface.
 * This is the main component that will be integrated into the
 * expanded panel's tab navigation.
 *
 * @example
 * ```tsx
 * <HeadersTab entry={networkHistoryEntry} />
 * ```
 */
export const HeadersTab = ({ entry, className }: HeadersTabProps): React.ReactElement => {
  return (
    <div data-testid="headers-tab" className={className}>
      <HeadersPanel
        requestHeaders={entry.request.headers}
        responseHeaders={entry.response.headers}
      />
    </div>
  );
};
