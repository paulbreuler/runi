/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useState, useEffect } from 'react';
import { Activity, Settings } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip';
import { PulsingGlow } from '@/components/ui/PulsingGlow';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/Switch';
import { MetricsGrid } from '@/components/Metrics/MetricsGrid';
import { AppMetricsContainer } from '@/components/Console/AppMetricsContainer';
import { ToastBell } from '@/components/ui/Toast';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useMetricsStore } from '@/stores/useMetricsStore';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { focusRingClasses } from '@/utils/accessibility';
import { cn } from '@/utils/cn';
import type { AppMetrics, MemoryMetrics } from '@/types/metrics';

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
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [AnimateNumber, setAnimateNumber] = useState<React.ComponentType<{
    children: number | bigint | string;
    transition?: object;
    suffix?: string;
    style?: React.CSSProperties;
  }> | null>(null);

  // Load AnimateNumber immediately
  useEffect(() => {
    import('motion-plus/react')
      .then((mod) => {
        setAnimateNumber(() => mod.AnimateNumber);
      })
      .catch(() => {
        // Fallback to static display if import fails
      });
  }, []);

  // Update countdown every second
  useEffect(() => {
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

export const StatusBar = (): React.JSX.Element => {
  const metricsVisible = useSettingsStore<boolean>((state) => state.metricsVisible);
  const setMetricsVisible = useSettingsStore((state) => state.setMetricsVisible);
  const setMetricsStore = useMetricsStore((state) => state.setMetrics);
  const { metrics, timestamp, isLive } = useMetricsStore();
  const entries = useHistoryStore((state) => state.entries);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Request count display
  const requestCount = entries.length;
  const requestWord = requestCount === 1 ? 'request' : 'requests';

  // Determine pulsing glow state
  // init: metrics.memory === undefined (strong pulse)
  // tracking: isLive === true && metrics exist AND feature is enabled (faint pulse) - pulse when active
  // idle: metrics exist but not live, or feature is disabled (no pulse)
  const getPulsingState = (): 'init' | 'tracking' | 'idle' => {
    // If feature is disabled, no pulse
    if (!metricsVisible) {
      return 'idle';
    }
    // Strong "init" pulse before any metrics have been collected
    if (metrics.memory === undefined) {
      return 'init';
    }
    // When metrics exist, only show tracking pulse while the stream is live
    if (isLive) {
      return 'tracking';
    }
    // Metrics exist but we're not live anymore, so no pulse
    return 'idle';
  };

  const pulsingState = getPulsingState();

  // Show metrics on bar when they exist AND toggle is enabled
  const hasMetrics = metrics.memory !== undefined;
  const shouldShowMetrics = metricsVisible && hasMetrics;

  // Placeholder for future metrics settings dialog
  const handleSettingsClick = (): void => {
    // TODO: Open metrics settings dialog
    console.warn('Metrics settings clicked (not yet implemented)');
  };

  // Request immediate stats when popover opens (don't wait for next 30s interval)
  useEffect(() => {
    if (!isPanelOpen || !metricsVisible) {
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
  }, [isPanelOpen, metricsVisible, setMetricsStore]);

  return (
    <div
      className="h-8 border-t border-border-subtle bg-bg-surface/80 flex items-center justify-between px-2 text-xs"
      data-testid="status-bar"
    >
      {/* Left side - environment and request count */}
      <div className="flex items-center gap-4 opacity-70">
        <span className="flex items-center gap-1.5">
          <span className="text-text-muted">Environment:</span>
          <span className="font-mono text-text-secondary">default</span>
        </span>
        <span className="text-text-secondary" data-testid="status-bar-request-count">
          {requestCount} {requestWord}
        </span>
      </div>
      {/* Right side - metrics and version */}
      <div className="flex items-center gap-1">
        {/* Metrics popover */}
        <Popover open={isPanelOpen} onOpenChange={setIsPanelOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="xs"
              noScale
              className={cn('gap-1.5', isPanelOpen && 'bg-bg-raised text-text-primary')}
              data-testid="status-bar-metrics-button"
              aria-label={isPanelOpen ? 'Close metrics panel' : 'Open metrics panel'}
            >
              <PulsingGlow state={pulsingState} data-testid="metrics-pulsing-glow">
                <Activity className="w-2.5! h-2.5!" />
              </PulsingGlow>
              <span>Metrics</span>
              {/* Inline RAM value when metrics are available */}
              {shouldShowMetrics && (
                <span
                  className="font-mono text-text-secondary"
                  data-testid="status-bar-metrics-inline"
                >
                  {metrics.memory?.current.toFixed(1)} MB
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="top"
            sideOffset={8}
            className="w-[280px]"
            data-testid="metrics-panel"
          >
            <TooltipProvider>
              <div className="space-y-4">
                {/* Header with title + toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">App Metrics</span>
                  <Switch
                    checked={metricsVisible}
                    onCheckedChange={(checked: boolean): void => {
                      setMetricsVisible(checked);
                    }}
                    data-testid="metrics-switch"
                    aria-label="Enable metrics"
                  />
                </div>
                {/* MetricsGrid - reuse existing component */}
                <MetricsGrid metrics={metrics} />
                {/* Footer with countdown + settings */}
                <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">Next sample:</span>
                    <NextSampleCountdown
                      timestamp={timestamp}
                      isLive={isLive}
                      metricsVisible={metricsVisible}
                    />
                  </div>
                  <Tooltip content="Metrics settings (coming soon)">
                    <button
                      type="button"
                      onClick={handleSettingsClick}
                      className={cn(
                        'p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-raised transition-colors',
                        focusRingClasses
                      )}
                      aria-label="Metrics settings"
                      data-testid="metrics-settings-button"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </TooltipProvider>
          </PopoverContent>
        </Popover>
        {/* Hidden AppMetricsContainer to maintain event listener */}
        {metricsVisible && (
          <div className="hidden" data-testid="status-bar-metrics-hidden">
            <AppMetricsContainer compact={true} />
          </div>
        )}
        {/* Notification bell */}
        <ToastBell />
        <span className="flex items-center gap-1.5 text-text-muted">
          <span className="text-text-muted">Version:</span>
          <span className="font-mono text-text-secondary">{__APP_VERSION__}</span>
        </span>
      </div>
    </div>
  );
};
