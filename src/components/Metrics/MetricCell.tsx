/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { cn } from '@/utils/cn';
import { loadMotionPlusAnimateNumber } from '@/utils/loadMotionPlusAnimateNumber';

export interface MetricCellProps {
  /** Metric value */
  value: number;
  /** Threshold value for coloring */
  threshold: number;
  /** Formatter function to convert value to string */
  formatter: (value: number) => string;
  /** Optional test ID */
  'data-test-id'?: string;
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
 * Animates number changes using Motion+ AnimateNumber.
 */
export const MetricCell: React.FC<MetricCellProps> = ({
  value,
  threshold,
  formatter,
  'data-test-id': testId = 'metric-cell',
}) => {
  // Load AnimateNumber from motion-plus immediately
  const [AnimateNumber, setAnimateNumber] = React.useState<React.ComponentType<{
    children: number | bigint | string;
    transition?: object;
    suffix?: string;
    style?: React.CSSProperties;
  }> | null>(null);

  React.useEffect(() => {
    // Load immediately on mount
    void loadMotionPlusAnimateNumber().then((animateNumberComponent) => {
      if (animateNumberComponent !== null) {
        setAnimateNumber(() => animateNumberComponent);
      }
    });
  }, []);

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

  // Extract numeric value and unit from formatted string for animation
  const formatted = formatter(value);
  // Match pattern like "182.5 MB" or "1.2 GB" - extract number and unit
  const match = /^([\d.]+)\s*(MB|GB|KB|TB)?/i.exec(formatted);
  const numericValue = match?.[1] !== undefined ? parseFloat(match[1]) : value;
  const unit = match?.[2] !== undefined ? ` ${match[2]}` : '';

  return (
    <span className={cn('text-xs font-mono', colorClass)} data-test-id={testId}>
      {AnimateNumber !== null ? (
        <>
          <AnimateNumber
            transition={{
              layout: { type: 'spring', duration: 0.5, bounce: 0 },
              y: { type: 'spring', duration: 0.5, bounce: 0 },
            }}
            style={{ fontSize: 'inherit', lineHeight: 'inherit' }}
          >
            {numericValue}
          </AnimateNumber>
          {unit}
        </>
      ) : (
        formatted
      )}
    </span>
  );
};
