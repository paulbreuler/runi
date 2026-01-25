/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect, useState } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { useMetricsStore } from '@/stores/useMetricsStore';
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
 * - Updates global metrics store for other components
 * - Renders AppMetricsLog presentational component
 *
 * This component handles side effects (Tauri events, metrics store)
 * while AppMetricsLog is pure and receives data via props.
 *
 * Note: Console log integration has been removed - metrics are now
 * displayed in a dialog popup via MetricsPanel.
 */
export interface AppMetricsContainerProps {
  /** Compact mode for status bar display */
  compact?: boolean;
}

export const AppMetricsContainer: React.FC<AppMetricsContainerProps> = ({ compact = false }) => {
  const [metrics, setMetrics] = useState<AppMetrics>({});
  const [timestamp, setTimestamp] = useState<number>(Date.now());
  const [isLive, setIsLive] = useState<boolean>(false);
  const setMetricsStore = useMetricsStore((state) => state.setMetrics);
  const metricsVisible = useSettingsStore((state) => state.metricsVisible);

  // Update isLive state based on timestamp (updated within last 35 seconds)
  useEffect(() => {
    const checkIsLive = (): void => {
      const now = Date.now();
      const timeSinceUpdate = now - timestamp;
      const newIsLive = timeSinceUpdate < 35000; // 35 seconds
      setIsLive(newIsLive);

      // Update global metrics store with live status
      setMetricsStore(metrics, timestamp, newIsLive);
    };

    checkIsLive();
    const interval = setInterval(checkIsLive, 5000); // Check every 5 seconds

    return (): void => {
      clearInterval(interval);
    };
  }, [timestamp, metrics, setMetricsStore]);

  useEffect(() => {
    // Only set up listener in Tauri environment and when metrics are enabled
    if (typeof window === 'undefined' || !('__TAURI__' in (window as { __TAURI__?: unknown }))) {
      return;
    }

    // If metrics are disabled, clear state and stop listening
    if (!metricsVisible) {
      setMetrics({});
      setMetricsStore({}, Date.now(), false);
      setIsLive(false);
      return;
    }

    let unlistenFn: UnlistenFn | null = null;

    const setupListener = async (): Promise<void> => {
      // Fetch immediate stats when metrics are enabled (don't wait for next 30s interval)
      const fetchImmediateStats = async (): Promise<void> => {
        try {
          const stats = await invoke<{
            current: number;
            average: number;
            peak: number;
            samplesCount: number;
            thresholdExceeded: boolean;
            thresholdMb: number;
            thresholdPercent: number;
          }>('get_ram_stats');

          const memoryMetrics: MemoryMetrics = {
            current: stats.current,
            average: stats.average,
            peak: stats.peak,
            threshold: stats.thresholdMb,
            thresholdPercent: stats.thresholdPercent,
            samplesCount: stats.samplesCount,
          };

          const newMetrics: AppMetrics = { memory: memoryMetrics };
          const newTimestamp = Date.now();
          setMetrics(newMetrics);
          setTimestamp(newTimestamp);

          // Update global metrics store for other components (StatusBar, MetricsPanel)
          setMetricsStore(newMetrics, newTimestamp, true);
        } catch (error) {
          // Silently fail - will get stats from next event update
          console.error('Failed to fetch immediate stats:', error);
        }
      };

      // Fetch immediate stats first
      await fetchImmediateStats();

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

        // Update local state for rendering
        const newMetrics = { memory: memoryMetrics };
        const newTimestamp = Date.now();
        setMetrics(newMetrics);
        setTimestamp(newTimestamp);

        // Update global metrics store for other components (StatusBar, MetricsPanel)
        setMetricsStore(newMetrics, newTimestamp, true);
      });
    };

    void setupListener();

    // Cleanup function
    return (): void => {
      if (unlistenFn !== null) {
        unlistenFn();
      }
    };
  }, [setMetricsStore, metricsVisible]);

  // Always render when visible, even if metrics haven't arrived yet (shows init animation)
  return (
    <div data-testid="app-metrics-container">
      <AppMetricsLog metrics={metrics} timestamp={timestamp} isLive={isLive} compact={compact} />
    </div>
  );
};
