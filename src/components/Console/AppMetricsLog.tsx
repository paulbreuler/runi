/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { MemoryStick } from 'lucide-react';
import type { AppMetrics } from '@/types/metrics';
import { formatMemoryValue } from '@/utils/metrics-formatting';

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
    // Compact inline version for status bar - simplified (no init text/spin)
    // Only show icons + value when metrics are available
    if (metrics.memory === undefined) {
      return null;
    }

    // Show muted text when no samples collected yet (initial state)
    const isInitialState = metrics.memory.samplesCount === 0;
    const valueClass = isInitialState ? 'text-text-muted' : 'text-text-secondary';

    return (
      <div
        data-test-id="app-metrics-log"
        data-live={isLive}
        className="flex items-center gap-1.5 font-mono text-xs"
      >
        <MemoryStick className="w-3 h-3 text-text-muted" />
        <span className={valueClass}>{metrics.memory.current.toFixed(1)} MB</span>
      </div>
    );
  }

  // Full version for console (compact for dialog panel)
  return (
    <div data-test-id="app-metrics-log" data-live={isLive} className="text-xs">
      {metrics.memory !== undefined ? (
        <div data-test-id="memory-metrics-display" className="text-xs font-mono space-y-0.5">
          {/* Show muted text when no samples collected yet (initial state) */}
          {metrics.memory.samplesCount === 0 ? (
            <>
              <div className="text-text-muted">
                Current: {formatMemoryValue(metrics.memory.current)}
              </div>
              <div className="text-text-muted">
                Average: {formatMemoryValue(metrics.memory.average)}
              </div>
              <div className="text-text-muted">Peak: {formatMemoryValue(metrics.memory.peak)}</div>
            </>
          ) : (
            <>
              <div className="text-text-secondary">
                Current: {formatMemoryValue(metrics.memory.current)}
              </div>
              <div className="text-text-secondary">
                Average: {formatMemoryValue(metrics.memory.average)}
              </div>
              <div className="text-text-secondary">
                Peak: {formatMemoryValue(metrics.memory.peak)}
              </div>
            </>
          )}
          <div className="text-text-muted text-[10px]">
            Threshold: {formatMemoryValue(metrics.memory.threshold)} (
            {(metrics.memory.thresholdPercent * 100).toFixed(0)}%)
          </div>
        </div>
      ) : (
        <div data-test-id="metrics-loading" />
      )}
    </div>
  );
};
