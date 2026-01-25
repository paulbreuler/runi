/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { Activity, MemoryStick } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { AppMetrics } from '@/types/metrics';
import { formatMemoryMetrics } from '@/utils/metrics-formatting';

export interface AppMetricsLogProps {
  /** Application metrics to display */
  metrics: AppMetrics;
  /** Timestamp when metrics were captured */
  timestamp: number;
  /** Whether metrics are actively updating (live) */
  isLive?: boolean;
  /** Compact mode for status bar display */
  compact?: boolean;
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
  isLive = false,
  compact = false,
}) => {
  if (compact) {
    // Compact inline version for status bar - Unreal Engine style
    const isInitializing = metrics.memory === undefined;

    return (
      <div
        data-testid="app-metrics-log"
        data-live={isLive}
        data-initializing={isInitializing}
        className="flex items-center gap-1.5 font-mono text-xs"
      >
        {isInitializing ? (
          // Init animation: spinning Activity icon
          <>
            <Activity
              className="w-3 h-3 text-text-muted animate-spin"
              data-testid="activity-indicator"
            />
            <MemoryStick className="w-3 h-3 text-text-muted opacity-50" />
            <span className="text-text-muted text-[10px]">init</span>
          </>
        ) : // Normal display with metrics
        metrics.memory !== undefined ? (
          <>
            <Activity
              className={cn('w-3 h-3 text-text-muted', isLive && 'animate-spin')}
              data-testid="activity-indicator"
            />
            <MemoryStick className="w-3 h-3 text-text-muted" />
            <span className="text-text-secondary">{metrics.memory.current.toFixed(1)} MB</span>
          </>
        ) : null}
      </div>
    );
  }

  // Full version for console
  return (
    <div
      data-testid="app-metrics-log"
      data-live={isLive}
      className={cn('app-metrics-log', isLive && 'is-updating')}
    >
      <div className="app-metrics-header">
        <span className="app-metrics-title">App Metrics</span>
        {isLive && (
          <span className="app-metrics-updating-indicator" data-testid="updating-indicator">
            (updating)
          </span>
        )}
      </div>

      {metrics.memory !== undefined ? (
        <div data-testid="memory-metrics-display" className="memory-metrics">
          {formatMemoryMetrics(metrics.memory)}
        </div>
      ) : (
        <div className="app-metrics-loading" data-testid="metrics-loading">
          Initializing metrics...
        </div>
      )}
    </div>
  );
};
