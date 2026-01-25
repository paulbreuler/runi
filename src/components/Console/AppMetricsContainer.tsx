/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect, useState, useRef } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { getConsoleService } from '@/services/console-service';
import { useSettingsStore } from '@/stores/useSettingsStore';
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
export interface AppMetricsContainerProps {
  /** Compact mode for status bar display */
  compact?: boolean;
}

export const AppMetricsContainer: React.FC<AppMetricsContainerProps> = ({ compact = false }) => {
  const [metrics, setMetrics] = useState<AppMetrics>({});
  const [timestamp, setTimestamp] = useState<number>(Date.now());
  const [runNumber, setRunNumber] = useState<number>(1);
  const [isLive, setIsLive] = useState<boolean>(false);
  const metricsVisible = useSettingsStore((state) => state.metricsVisible);
  const previousMetricsVisibleRef = useRef<boolean>(metricsVisible);
  const isFirstMountRef = useRef<boolean>(true);

  // Track when metricsVisible changes from false to true to increment run number
  useEffect(() => {
    // Skip on first mount - we want first run to be run-1
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      previousMetricsVisibleRef.current = metricsVisible;
      return;
    }

    const wasVisible = previousMetricsVisibleRef.current;
    if (!wasVisible && metricsVisible) {
      // Metrics were just enabled - increment run number for new log entry
      // First toggle: 1 -> 2 (run-2), second toggle: 2 -> 3 (run-3), etc.
      setRunNumber((prev) => prev + 1);
    }
    previousMetricsVisibleRef.current = metricsVisible;
  }, [metricsVisible]);

  // Update isLive state based on timestamp (updated within last 35 seconds)
  useEffect(() => {
    const checkIsLive = (): void => {
      const now = Date.now();
      const timeSinceUpdate = now - timestamp;
      setIsLive(timeSinceUpdate < 35000); // 35 seconds
    };

    checkIsLive();
    const interval = setInterval(checkIsLive, 5000); // Check every 5 seconds

    return (): void => {
      clearInterval(interval);
    };
  }, [timestamp]);

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

        // Update state for rendering (always update, even if console log is disabled)
        setMetrics({ memory: memoryMetrics });
        setTimestamp(Date.now());

        // Only update console log if metrics are visible
        if (metricsVisible) {
          const runNumberStr = String(runNumber);
          const logId = `memory-metrics-run-${runNumberStr}`;
          service.addOrUpdateLog({
            id: logId,
            level: logLevel,
            message: 'App Metrics',
            args: [{ memory: memoryMetrics }],
            timestamp: Date.now(),
            isUpdating: true,
          });
        }
      });
    };

    void setupListener();

    // Cleanup function
    return (): void => {
      if (unlistenFn !== null) {
        unlistenFn();
      }
    };
  }, [metricsVisible, runNumber]);

  // Always render when visible, even if metrics haven't arrived yet (shows init animation)
  return (
    <div data-testid="app-metrics-container">
      <AppMetricsLog metrics={metrics} timestamp={timestamp} isLive={isLive} compact={compact} />
    </div>
  );
};
