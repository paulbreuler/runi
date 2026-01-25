/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { cn } from '@/utils/cn';

export interface MetricCellProps {
  /** Metric value */
  value: number;
  /** Threshold value for coloring */
  threshold: number;
  /** Formatter function to convert value to string */
  formatter: (value: number) => string;
  /** Optional test ID */
  'data-testid'?: string;
}

/**
 * Metric cell component following TimingCell pattern.
 *
 * Colors text based on usage threshold:
 * - Green (signal-success): value < threshold * 0.7 (low usage)
 * - Amber (signal-warning): value >= threshold * 0.7 && < threshold (warning)
 * - Red (signal-error): value >= threshold (exceeded)
 *
 * Uses text-xs font-mono styling like TimingCell.
 */
export const MetricCell: React.FC<MetricCellProps> = ({
  value,
  threshold,
  formatter,
  'data-testid': testId = 'metric-cell',
}) => {
  // Determine color based on threshold
  const warningThreshold = threshold * 0.7;
  let colorClass: string;

  if (value < warningThreshold) {
    colorClass = 'text-signal-success';
  } else if (value >= warningThreshold && value < threshold) {
    colorClass = 'text-signal-warning';
  } else {
    colorClass = 'text-signal-error';
  }

  return (
    <span className={cn('text-xs font-mono', colorClass)} data-testid={testId}>
      {formatter(value)}
    </span>
  );
};
