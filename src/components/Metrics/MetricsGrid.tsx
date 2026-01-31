/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { cn } from '@/utils/cn';
import type { AppMetrics } from '@/types/metrics';
import { MetricCell } from './MetricCell';
import { formatMemoryValue } from '@/utils/metrics-formatting';
import { Tooltip } from '@/components/ui/Tooltip';

export interface MetricsGridProps {
  /** Application metrics to display */
  metrics: AppMetrics;
  /** Optional test ID */
  'data-test-id'?: string;
}

/**
 * Metrics grid component with single-column layout.
 *
 * Layout:
 * - Labels on left (auto width), Values on right (1fr)
 *
 * Uses MetricCell for Current, Average, Peak rows.
 * Threshold row uses muted text (not MetricCell) with tooltip explanation.
 */
export const MetricsGrid: React.FC<MetricsGridProps> = ({
  metrics,
  'data-test-id': testId = 'metrics-grid',
}) => {
  const [tooltipText, setTooltipText] = React.useState<string>('');

  // Calculate threshold explanation tooltip text
  React.useEffect(() => {
    if (metrics.memory === undefined) {
      return;
    }

    const { memory } = metrics;
    setTooltipText(
      `Memory usage threshold is ${formatMemoryValue(memory.threshold)}. This can be configured in settings.`
    );
  }, [metrics]);

  const memory = metrics.memory;
  // Show placeholder when no metrics available yet
  const hasMetrics = memory !== undefined;
  // Show muted text when no samples collected yet (initial state)
  const isInitialState = !hasMetrics || memory.samplesCount === 0;

  // Placeholder value for when metrics haven't loaded
  const placeholder = '--';

  // Helper to render metric value with appropriate styling
  const renderMetricValue = (
    value: number | undefined,
    threshold: number | undefined
  ): React.ReactNode => {
    if (!hasMetrics || value === undefined) {
      return <span className="text-xs font-mono text-text-muted">{placeholder}</span>;
    }
    if (isInitialState) {
      return <span className="text-xs font-mono text-text-muted">{formatMemoryValue(value)}</span>;
    }
    return <MetricCell value={value} threshold={threshold ?? 0} formatter={formatMemoryValue} />;
  };

  return (
    <div
      className={cn('grid grid-cols-[auto_1fr] gap-y-0.5 gap-x-2 items-baseline')}
      data-test-id={testId}
    >
      {/* Current */}
      <div className="text-xs text-text-muted" data-test-id="metrics-grid-label-current">
        Current:
      </div>
      <div className="flex items-baseline" data-test-id="metrics-grid-value-current">
        {renderMetricValue(memory?.current, memory?.threshold)}
      </div>

      {/* Average */}
      <div className="text-xs text-text-muted" data-test-id="metrics-grid-label-average">
        Average:
      </div>
      <div className="flex items-baseline" data-test-id="metrics-grid-value-average">
        {renderMetricValue(memory?.average, memory?.threshold)}
      </div>

      {/* Peak */}
      <div className="text-xs text-text-muted" data-test-id="metrics-grid-label-peak">
        Peak:
      </div>
      <div className="flex items-baseline" data-test-id="metrics-grid-value-peak">
        {renderMetricValue(memory?.peak, memory?.threshold)}
      </div>

      {/* Threshold (muted text, not MetricCell) with tooltip */}
      {tooltipText !== '' && hasMetrics ? (
        <>
          <Tooltip content={tooltipText} data-test-id="metrics-grid-threshold-tooltip">
            <div
              className="text-xs text-text-muted cursor-help"
              data-test-id="metrics-grid-label-threshold"
            >
              Threshold:
            </div>
          </Tooltip>
          <Tooltip content={tooltipText} data-test-id="metrics-grid-threshold-value-tooltip">
            <div
              className="flex items-baseline text-xs font-mono text-text-muted cursor-help"
              data-test-id="metrics-grid-value-threshold"
            >
              {formatMemoryValue(memory.threshold)}
            </div>
          </Tooltip>
        </>
      ) : (
        <>
          <div className="text-xs text-text-muted" data-test-id="metrics-grid-label-threshold">
            Threshold:
          </div>
          <div
            className="flex items-baseline text-xs font-mono text-text-muted"
            data-test-id="metrics-grid-value-threshold"
          >
            {hasMetrics ? formatMemoryValue(memory.threshold) : placeholder}
          </div>
        </>
      )}
    </div>
  );
};
