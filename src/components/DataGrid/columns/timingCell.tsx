/**
 * @file TimingCell component
 * @description Renders request timing with slow request highlighting and special state handling
 */

import * as React from 'react';
import { cn } from '@/utils/cn';

const SLOW_REQUEST_THRESHOLD_MS = 1000;

interface TimingCellProps {
  /** Total request duration in milliseconds */
  totalMs: number;
  /** Whether this is a streaming request (optional, can also be indicated by totalMs === -1) */
  isStreaming?: boolean;
  /** Whether this request was blocked (optional, can also be indicated by totalMs === 0) */
  isBlocked?: boolean;
}

/**
 * Renders request timing in milliseconds with special handling for:
 * - Slow requests (>1000ms) highlighted in red
 * - Streaming requests showing "..."
 * - Blocked requests showing "—"
 *
 * @example
 * ```tsx
 * <TimingCell totalMs={150} />
 * <TimingCell totalMs={1500} /> // Slow request (red)
 * <TimingCell totalMs={-1} isStreaming /> // Streaming
 * <TimingCell totalMs={0} isBlocked /> // Blocked
 * ```
 */
export const TimingCell = ({
  totalMs,
  isStreaming = false,
  isBlocked = false,
}: TimingCellProps): React.ReactElement => {
  // Blocked state takes precedence
  if (isBlocked || totalMs === 0) {
    return (
      <span className="text-xs font-mono text-text-muted" title="Request was blocked">
        —
      </span>
    );
  }

  // Streaming state
  if (isStreaming || totalMs === -1) {
    return (
      <span className="text-xs font-mono text-text-muted" title="Streaming request">
        ...
      </span>
    );
  }

  // Normal timing display
  const isSlow = totalMs > SLOW_REQUEST_THRESHOLD_MS;
  const colorClass = isSlow ? 'text-signal-error' : 'text-text-muted';

  return (
    <span className={cn('text-xs font-mono', colorClass)} title={`${String(totalMs)}ms`}>
      {totalMs}ms
    </span>
  );
};
