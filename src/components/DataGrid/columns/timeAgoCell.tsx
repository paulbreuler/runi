/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file TimeAgoCell component
 * @description Renders relative time (e.g., "5 mins ago") with periodic updates
 */

import * as React from 'react';
import { formatRelativeTime } from '@/utils/relative-time';

interface TimeAgoCellProps {
  timestamp: string;
}

/**
 * Renders a relative time (e.g., "5 mins ago") that updates periodically.
 * Updates every 30 seconds to keep the relative time current.
 *
 * @example
 * ```tsx
 * <TimeAgoCell timestamp="2026-01-17T10:00:00Z" />
 * ```
 */
export const TimeAgoCell = ({ timestamp }: TimeAgoCellProps): React.ReactElement => {
  const [relativeTime, setRelativeTime] = React.useState<string>(() =>
    formatRelativeTime(timestamp)
  );

  React.useEffect(() => {
    // Update immediately
    setRelativeTime(formatRelativeTime(timestamp));

    // Update every 30 seconds
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(timestamp));
    }, 30 * 1000);

    return (): void => {
      clearInterval(interval);
    };
  }, [timestamp]);

  return <span className="text-xs text-text-muted">{relativeTime}</span>;
};
