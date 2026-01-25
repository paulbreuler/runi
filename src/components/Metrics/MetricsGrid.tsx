/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { cn } from '@/utils/cn';
import type { AppMetrics } from '@/types/metrics';
import { MetricCell } from './MetricCell';
import { formatMemoryValue } from '@/utils/metrics-formatting';

export interface MetricsGridProps {
  /** Application metrics to display */
  metrics: AppMetrics;
  /** Optional test ID */
  'data-testid'?: string;
}

/**
 * Metrics grid component with 2-column layout.
 *
 * Layout:
 * - Labels on left (auto width)
 * - Values on right (1fr, takes remaining space)
 *
 * Uses MetricCell for Current, Average, Peak rows.
 * Threshold row uses muted text (not MetricCell).
 */
export const MetricsGrid: React.FC<MetricsGridProps> = ({
  metrics,
  'data-testid': testId = 'metrics-grid',
}) => {
  if (metrics.memory === undefined) {
    return (
      <div className="text-xs text-text-muted" data-testid={`${testId}-empty`}>
        Waiting for first sample...
      </div>
    );
  }

  const { memory } = metrics;

  return (
    <div className={cn('grid grid-cols-[auto_1fr] gap-y-0.5 gap-x-2')} data-testid={testId}>
      {/* Current */}
      <div className="text-xs text-text-muted" data-testid="metrics-grid-label-current">
        Current:
      </div>
      <div data-testid="metrics-grid-value-current">
        <MetricCell
          value={memory.current}
          threshold={memory.threshold}
          formatter={formatMemoryValue}
        />
      </div>

      {/* Average */}
      <div className="text-xs text-text-muted" data-testid="metrics-grid-label-average">
        Average:
      </div>
      <div data-testid="metrics-grid-value-average">
        <MetricCell
          value={memory.average}
          threshold={memory.threshold}
          formatter={formatMemoryValue}
        />
      </div>

      {/* Peak */}
      <div className="text-xs text-text-muted" data-testid="metrics-grid-label-peak">
        Peak:
      </div>
      <div data-testid="metrics-grid-value-peak">
        <MetricCell
          value={memory.peak}
          threshold={memory.threshold}
          formatter={formatMemoryValue}
        />
      </div>

      {/* Threshold (muted text, not MetricCell) */}
      <div className="text-xs text-text-muted" data-testid="metrics-grid-label-threshold">
        Threshold:
      </div>
      <div className="text-xs font-mono text-text-muted" data-testid="metrics-grid-value-threshold">
        {formatMemoryValue(memory.threshold)} ({(memory.thresholdPercent * 100).toFixed(0)}%)
      </div>
    </div>
  );
};
