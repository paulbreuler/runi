/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

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
  /** Optional keyboard handler for hierarchical navigation */
  onKeyDown?: (e: React.KeyboardEvent) => void;
  /** Optional ref for keyboard navigation coordination */
  containerRef?: React.RefObject<HTMLDivElement | null>;
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
export const HeadersTab = ({
  entry,
  className,
  onKeyDown,
  containerRef,
}: HeadersTabProps): React.ReactElement => {
  return (
    <div data-test-id="headers-tab" className={className}>
      <HeadersPanel
        requestHeaders={entry.request.headers}
        responseHeaders={entry.response.headers}
        onKeyDown={onKeyDown}
        containerRef={containerRef}
      />
    </div>
  );
};
