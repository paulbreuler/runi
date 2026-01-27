/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { type RefObject, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Settings } from 'lucide-react';
import { NotificationTray } from '@/components/ui/NotificationTray';
import { NotificationTrayHeader } from '@/components/ui/NotificationTrayHeader';
import { NotificationTrayContent } from '@/components/ui/NotificationTrayContent';
import { NotificationTrayFooter } from '@/components/ui/NotificationTrayFooter';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { MetricsGrid } from './MetricsGrid';
import { Switch } from '@/components/ui/Switch';
import { useMetricsStore } from '@/stores/useMetricsStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { focusRingClasses } from '@/utils/accessibility';
import { cn } from '@/utils/cn';
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
 * Metrics Panel container component that orchestrates NotificationTray, NotificationTrayHeader, NotificationTrayContent, MetricsGrid, MetricsToggle.
 *
 * Handles:
 * - State management (metricsVisible from useSettingsStore, metrics from useMetricsStore)
 * - Fetching immediate stats on open (to avoid 30s delay)
 * - Composing presentational components
 *
 * Follows loose coupling and high cohesion:
 * - Container component (handles state, side effects)
 * - Presentational components (NotificationTray, NotificationTrayHeader, NotificationTrayContent, MetricsGrid, MetricsToggle) receive data via props
 */
const SAMPLE_INTERVAL_MS = 30_000; // 30 seconds

/**
 * Countdown timer component showing time until next sample.
 * Uses AnimateNumber for smooth countdown animation.
 */
const NextSampleCountdown: React.FC<{
  timestamp: number;
  isLive: boolean;
  metricsVisible: boolean;
}> = ({ timestamp, isLive, metricsVisible }) => {
  const [timeRemaining, setTimeRemaining] = React.useState<number>(0);
  const [AnimateNumber, setAnimateNumber] = React.useState<React.ComponentType<{
    children: number | bigint | string;
    transition?: object;
    suffix?: string;
    style?: React.CSSProperties;
  }> | null>(null);

  // Load AnimateNumber immediately
  React.useEffect(() => {
    import('motion-plus/react')
      .then((mod) => {
        setAnimateNumber(() => mod.AnimateNumber);
      })
      .catch(() => {
        // Fallback to static display if import fails
      });
  }, []);

  // Update countdown every second
  React.useEffect(() => {
    if (!isLive || !metricsVisible) {
      setTimeRemaining(0);
      return;
    }

    const updateCountdown = (): void => {
      const now = Date.now();
      const elapsed = now - timestamp;
      const remaining = Math.max(0, SAMPLE_INTERVAL_MS - elapsed);
      setTimeRemaining(Math.ceil(remaining / 1000)); // Convert to seconds
    };

    updateCountdown(); // Initial update
    const interval = setInterval(updateCountdown, 1000);

    return (): void => {
      clearInterval(interval);
    };
  }, [timestamp, isLive, metricsVisible]);

  if (!isLive || !metricsVisible || timeRemaining === 0) {
    return (
      <span
        className="text-xs font-mono text-text-muted whitespace-nowrap"
        data-testid="next-sample-countdown"
      >
        —
      </span>
    );
  }

  return (
    <span
      className="text-xs font-mono text-text-muted whitespace-nowrap inline-flex items-baseline"
      data-testid="next-sample-countdown"
    >
      {AnimateNumber !== null ? (
        <>
          <AnimateNumber
            transition={{
              layout: { type: 'spring', duration: 0.3, bounce: 0 },
            }}
            style={{ fontSize: 'inherit', lineHeight: 'inherit' }}
          >
            {timeRemaining}
          </AnimateNumber>
          <span className="ml-0.5">s</span>
        </>
      ) : (
        `${String(timeRemaining)}s`
      )}
    </span>
  );
};

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  isOpen,
  onClose,
  metrics,
  timestamp,
  isLive,
  buttonRef,
}) => {
  const setMetricsStore = useMetricsStore((state) => state.setMetrics);
  const metricsVisible = useSettingsStore((state) => state.metricsVisible);
  const setMetricsVisible = useSettingsStore((state) => state.setMetricsVisible);

  // Placeholder for future metrics settings dialog
  const handleSettingsClick = (): void => {
    // TODO: Open metrics settings dialog

    console.warn('Metrics settings clicked (not yet implemented)');
  };

  // Request immediate stats when panel opens (don't wait for next 30s interval)
  useEffect(() => {
    if (!isOpen || !metricsVisible) {
      return;
    }

    const fetchImmediateStats = async (): Promise<void> => {
      try {
        if (typeof window !== 'undefined' && '__TAURI__' in window) {
          // Use collect_ram_sample to trigger immediate sample collection if needed
          // Only collect if metrics are enabled
          const stats = await invoke<{
            current: number;
            average: number;
            peak: number;
            samplesCount: number;
            thresholdExceeded: boolean;
            thresholdMb: number;
            thresholdPercent: number;
          }>('collect_ram_sample');

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
  }, [isOpen, metricsVisible, setMetricsStore]);

  return (
    <NotificationTray
      isOpen={isOpen}
      onClose={onClose}
      buttonRef={buttonRef}
      header={
        <NotificationTrayHeader
          title="App Metrics"
          onClose={onClose}
          actions={
            <Switch
              checked={metricsVisible}
              onCheckedChange={(checked: boolean): void => {
                setMetricsVisible(checked);
              }}
              data-testid="metrics-switch"
              aria-label="Enable metrics"
            />
          }
        />
      }
      content={
        <TooltipProvider>
          <NotificationTrayContent>
            <MetricsGrid metrics={metrics} />
          </NotificationTrayContent>
        </TooltipProvider>
      }
      footer={
        <NotificationTrayFooter>
          {/* Left: Next sample countdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Next sample:</span>
            <NextSampleCountdown
              timestamp={timestamp}
              isLive={isLive}
              metricsVisible={metricsVisible}
            />
          </div>
          {/* Right: Settings button (placeholder for future) */}
          <button
            type="button"
            onClick={handleSettingsClick}
            className={cn(
              'p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-raised transition-colors',
              focusRingClasses
            )}
            aria-label="Metrics settings"
            data-testid="metrics-settings-button"
            title="Metrics settings (coming soon)"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </NotificationTrayFooter>
      }
      data-testid="metrics-panel"
    />
  );
};
