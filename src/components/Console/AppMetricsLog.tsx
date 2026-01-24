/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { cn } from '@/utils/cn';
import type { AppMetrics } from '@/types/metrics';
import { formatMemoryMetrics } from '@/utils/metrics-formatting';

export interface AppMetricsLogProps {
  /** Application metrics to display */
  metrics: AppMetrics;
  /** Timestamp when metrics were captured */
  timestamp: number;
  /** Whether this log is updating in place */
  isUpdating?: boolean;
}

/**
 * Presentational component for displaying application metrics in the console.
 *
 * Designed to be extensible for future metric types (CPU, network, etc.).
 * This component is pure and receives all data via props.
 */
export const AppMetricsLog: React.FC<AppMetricsLogProps> = ({
  metrics,
  timestamp: _timestamp,
  isUpdating = false,
}) => {
  return (
    <div
      data-testid="app-metrics-log"
      data-updating={isUpdating}
      className={cn('app-metrics-log', isUpdating && 'is-updating')}
    >
      <div className="app-metrics-header">
        <span className="app-metrics-title">App Metrics</span>
        {isUpdating && (
          <span className="app-metrics-updating-indicator" data-testid="updating-indicator">
            (updating)
          </span>
        )}
      </div>

      {metrics.memory !== undefined && (
        <div data-testid="memory-metrics-display" className="memory-metrics">
          {formatMemoryMetrics(metrics.memory)}
        </div>
      )}
    </div>
  );
};
