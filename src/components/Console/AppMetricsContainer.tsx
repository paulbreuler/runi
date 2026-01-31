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
  // Track if we enabled monitoring (to only disable in cleanup if we enabled it)
  const monitoringEnabledRef = React.useRef<boolean>(false);

  // Update isLive state based on timestamp (updated within last 35 seconds)
  useEffect(() => {
    // Only update isLive if metrics exist (don't clear store when metrics are empty)
    if (metrics.memory === undefined) {
      return;
    }

    const checkIsLive = (): void => {
      const now = Date.now();
      const timeSinceUpdate = now - timestamp;
      const newIsLive = timeSinceUpdate < 35000; // 35 seconds
      setIsLive(newIsLive);

      // Update global metrics store with live status (only if metrics exist)
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

    // If metrics are disabled, clear state, stop listening, and disable monitoring service
    if (!metricsVisible) {
      setMetrics({});
      setMetricsStore({}, Date.now(), false);
      setIsLive(false);

      // Disable monitoring service in Rust backend
      void (async (): Promise<void> => {
        try {
          await invoke('set_memory_monitoring_enabled', { enabled: false });
        } catch (error) {
          console.error('Failed to disable memory monitoring:', error);
        }
      })();

      return;
    }

    // Enable monitoring service when metrics are enabled (before setting up listener)
    void (async (): Promise<void> => {
      try {
        await invoke('set_memory_monitoring_enabled', { enabled: true });
        monitoringEnabledRef.current = true; // Mark that we enabled monitoring
      } catch (error) {
        console.error('Failed to enable memory monitoring:', error);
      }
    })();

    let unlistenFn: UnlistenFn | null = null;
    let isMounted = true;

    const setupListener = async (): Promise<void> => {
      try {
        // Collect immediate sample when metrics are enabled (don't wait for next 30s interval)
        const fetchImmediateStats = async (): Promise<void> => {
          try {
            // Use collect_ram_sample to trigger immediate sample collection instead of just getting stats
            const stats = await invoke<{
              current: number;
              average: number;
              peak: number;
              samplesCount: number;
              thresholdExceeded: boolean;
              thresholdMb: number;
              thresholdPercent: number;
            }>('collect_ram_sample');

            // Only update state if component is still mounted
            if (!isMounted) {
              return;
            }

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

        // Only set up listener if component is still mounted
        if (!isMounted) {
          return;
        }

        // Listen for memory update events
        const fn = await listen<RamStats>('memory:update', (event) => {
          // Only process events if component is still mounted
          if (!isMounted) {
            return;
          }

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

        // Only store unlistenFn if component is still mounted
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (isMounted) {
          unlistenFn = fn;
        } else {
          // Component unmounted before listener was set up, clean up immediately
          fn();
        }
      } catch (error) {
        // Log error in development, but don't break the app
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to set up memory metrics listener:', error);
        }
      }
    };

    void setupListener();

    // Cleanup function - disable monitoring when component unmounts or metrics are disabled
    return (): void => {
      isMounted = false;
      if (unlistenFn !== null) {
        unlistenFn();
      }

      // Only disable if we actually enabled monitoring (to avoid disabling when just re-enabling)
      if (monitoringEnabledRef.current) {
        void (async (): Promise<void> => {
          try {
            await invoke('set_memory_monitoring_enabled', { enabled: false });
            monitoringEnabledRef.current = false; // Reset flag
          } catch (error) {
            console.error('Failed to disable memory monitoring in cleanup:', error);
          }
        })();
      }
    };
  }, [setMetricsStore, metricsVisible]);

  // Always render when visible, even if metrics haven't arrived yet (shows init animation)
  return (
    <div data-test-id="app-metrics-container">
      <AppMetricsLog metrics={metrics} timestamp={timestamp} isLive={isLive} compact={compact} />
    </div>
  );
};
