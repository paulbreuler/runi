/**
 * @file ResponseTab component
 * @description Main response tab component for expanded panel
 */

import { ResponsePanel } from './ResponsePanel';
import type { NetworkHistoryEntry } from '@/types/history';

export interface ResponseTabProps {
  /** Network history entry with request/response data */
  entry: NetworkHistoryEntry;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ResponseTab component for the expanded panel.
 *
 * Displays request and response bodies in a tabbed interface.
 * This is the main component that will be integrated into the
 * expanded panel's tab navigation.
 *
 * @example
 * ```tsx
 * <ResponseTab entry={networkHistoryEntry} />
 * ```
 */
export const ResponseTab = ({ entry, className }: ResponseTabProps): React.ReactElement => {
  return (
    <div data-testid="response-tab" className={className}>
      <ResponsePanel requestBody={entry.request.body} responseBody={entry.response.body} />
    </div>
  );
};
