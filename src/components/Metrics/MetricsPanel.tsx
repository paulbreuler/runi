/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { type RefObject, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Dialog } from '@/components/ui/Dialog';
import { DialogHeader } from '@/components/ui/DialogHeader';
import { DialogContent } from '@/components/ui/DialogContent';
import { MetricsGrid } from './MetricsGrid';
import { MetricsToggle } from './MetricsToggle';
import { useMetricsStore } from '@/stores/useMetricsStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { AppMetrics, MemoryMetrics } from '@/types/metrics';

export interface MetricsPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback when panel should close */
  onClose: () => void;
  /** Application metrics to display */
  metrics: AppMetrics;
  /** Timestamp when metrics were captured */
  timestamp: number;
  /** Whether metrics are actively updating (live) */
  isLive: boolean;
  /** Ref to the button that triggers this panel (for alignment) */
  buttonRef?: RefObject<HTMLButtonElement | null>;
}

/**
 * Metrics Panel container component that orchestrates Dialog, DialogHeader, DialogContent, MetricsGrid, MetricsToggle.
 *
 * Handles:
 * - State management (metricsVisible from useSettingsStore, metrics from useMetricsStore)
 * - Fetching immediate stats on open (to avoid 30s delay)
 * - Composing presentational components
 *
 * Follows loose coupling and high cohesion:
 * - Container component (handles state, side effects)
 * - Presentational components (Dialog, DialogHeader, DialogContent, MetricsGrid, MetricsToggle) receive data via props
 */
export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  isOpen,
  onClose,
  metrics,
  timestamp: _timestamp,
  isLive: _isLive,
  buttonRef,
}) => {
  const setMetricsStore = useMetricsStore((state) => state.setMetrics);
  const metricsVisible = useSettingsStore((state) => state.metricsVisible);
  const setMetricsVisible = useSettingsStore((state) => state.setMetricsVisible);

  // Request immediate stats when panel opens (don't wait for next 30s interval)
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const fetchImmediateStats = async (): Promise<void> => {
      try {
        if (typeof window !== 'undefined' && '__TAURI__' in window) {
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
          setMetricsStore(newMetrics, newTimestamp, true);
        }
      } catch (error) {
        // Silently fail - will get stats from next event update
        console.error('Failed to fetch immediate stats:', error);
      }
    };

    void fetchImmediateStats();
  }, [isOpen, setMetricsStore]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      buttonRef={buttonRef}
      header={
        <DialogHeader
          title="App Metrics"
          onClose={onClose}
          actions={
            <MetricsToggle
              checked={metricsVisible}
              onChange={setMetricsVisible}
              label="Enable metrics"
            />
          }
        />
      }
      content={
        <DialogContent>
          <MetricsGrid metrics={metrics} />
        </DialogContent>
      }
      data-testid="metrics-panel"
    />
  );
};
