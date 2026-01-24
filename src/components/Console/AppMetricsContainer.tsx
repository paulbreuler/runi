/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect, useState } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { getConsoleService } from '@/services/console-service';
import type { AppMetrics, MemoryMetrics } from '@/types/metrics';
import { AppMetricsLog } from './AppMetricsLog';

/**
 * Rust RamStats structure from memory_monitor.rs
 * This matches the event payload from Tauri.
 */
interface RamStats {
  current: number;
  average: number;
  peak: number;
  samplesCount: number;
  thresholdExceeded: boolean;
  thresholdMb: number;
  thresholdPercent: number;
}

/**
 * Container component for app metrics that:
 * - Listens to Tauri memory:update events
 * - Updates console log with metrics
 * - Renders AppMetricsLog presentational component
 *
 * This component handles side effects (Tauri events, console service)
 * while AppMetricsLog is pure and receives data via props.
 */
export const AppMetricsContainer: React.FC = () => {
  const [metrics, setMetrics] = useState<AppMetrics>({});
  const [timestamp, setTimestamp] = useState<number>(Date.now());

  useEffect(() => {
    // Only set up listener in Tauri environment
    if (typeof window === 'undefined' || !('__TAURI__' in (window as { __TAURI__?: unknown }))) {
      return;
    }

    let unlistenFn: UnlistenFn | null = null;

    const setupListener = async (): Promise<void> => {
      const service = getConsoleService();

      // Listen for memory update events
      unlistenFn = await listen<RamStats>('memory:update', (event) => {
        const stats = event.payload;

        // Transform Rust RamStats to MemoryMetrics
        const memoryMetrics: MemoryMetrics = {
          current: stats.current,
          average: stats.average,
          peak: stats.peak,
          threshold: stats.thresholdMb,
          thresholdPercent: stats.thresholdPercent,
          samplesCount: stats.samplesCount,
        };

        // Determine log level based on threshold
        // info: normal operation (current < threshold)
        // warn: threshold exceeded (current >= threshold)
        // error: critically high (current >= threshold * 1.5)
        let logLevel: 'info' | 'warn' | 'error' = 'info';
        if (stats.current >= stats.thresholdMb * 1.5) {
          logLevel = 'error';
        } else if (stats.current >= stats.thresholdMb) {
          logLevel = 'warn';
        }

        // Update state for rendering
        setMetrics({ memory: memoryMetrics });
        setTimestamp(Date.now());

        // Update console log (single updating entry)
        service.addOrUpdateLog({
          id: 'memory-metrics',
          level: logLevel,
          message: 'App Metrics',
          args: [{ memory: memoryMetrics }],
          timestamp: Date.now(),
          isUpdating: true,
        });
      });
    };

    void setupListener();

    // Cleanup function
    return (): void => {
      if (unlistenFn !== null) {
        unlistenFn();
      }
    };
  }, []);

  // Only render if we have metrics
  if (metrics.memory === undefined) {
    return null;
  }

  return (
    <div data-testid="app-metrics-container">
      <AppMetricsLog metrics={metrics} timestamp={timestamp} isUpdating={true} />
    </div>
  );
};
