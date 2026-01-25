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
  'data-testid'?: string;
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
  'data-testid': testId = 'metrics-grid',
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

  if (metrics.memory === undefined) {
    return <div data-testid={`${testId}-empty`} />;
  }

  const { memory } = metrics;
  // Show muted text when no samples collected yet (initial state)
  const isInitialState = memory.samplesCount === 0;

  return (
    <div
      className={cn('grid grid-cols-[auto_1fr] gap-y-0.5 gap-x-2 items-baseline')}
      data-testid={testId}
    >
      {/* Current */}
      <div className="text-xs text-text-muted" data-testid="metrics-grid-label-current">
        Current:
      </div>
      <div className="flex items-baseline" data-testid="metrics-grid-value-current">
        {isInitialState ? (
          <span className="text-xs font-mono text-text-muted">
            {formatMemoryValue(memory.current)}
          </span>
        ) : (
          <MetricCell
            value={memory.current}
            threshold={memory.threshold}
            formatter={formatMemoryValue}
          />
        )}
      </div>

      {/* Average */}
      <div className="text-xs text-text-muted" data-testid="metrics-grid-label-average">
        Average:
      </div>
      <div className="flex items-baseline" data-testid="metrics-grid-value-average">
        {isInitialState ? (
          <span className="text-xs font-mono text-text-muted">
            {formatMemoryValue(memory.average)}
          </span>
        ) : (
          <MetricCell
            value={memory.average}
            threshold={memory.threshold}
            formatter={formatMemoryValue}
          />
        )}
      </div>

      {/* Peak */}
      <div className="text-xs text-text-muted" data-testid="metrics-grid-label-peak">
        Peak:
      </div>
      <div className="flex items-baseline" data-testid="metrics-grid-value-peak">
        {isInitialState ? (
          <span className="text-xs font-mono text-text-muted">
            {formatMemoryValue(memory.peak)}
          </span>
        ) : (
          <MetricCell
            value={memory.peak}
            threshold={memory.threshold}
            formatter={formatMemoryValue}
          />
        )}
      </div>

      {/* Threshold (muted text, not MetricCell) with tooltip */}
      {tooltipText !== '' ? (
        <>
          <Tooltip content={tooltipText} data-testid="metrics-grid-threshold-tooltip">
            <div
              className="text-xs text-text-muted cursor-help"
              data-testid="metrics-grid-label-threshold"
            >
              Threshold:
            </div>
          </Tooltip>
          <Tooltip content={tooltipText} data-testid="metrics-grid-threshold-value-tooltip">
            <div
              className="flex items-baseline text-xs font-mono text-text-muted cursor-help"
              data-testid="metrics-grid-value-threshold"
            >
              {formatMemoryValue(memory.threshold)}
            </div>
          </Tooltip>
        </>
      ) : (
        <>
          <div className="text-xs text-text-muted" data-testid="metrics-grid-label-threshold">
            Threshold:
          </div>
          <div
            className="flex items-baseline text-xs font-mono text-text-muted"
            data-testid="metrics-grid-value-threshold"
          >
            {formatMemoryValue(memory.threshold)}
          </div>
        </>
      )}
    </div>
  );
};
