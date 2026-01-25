/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useRef, useState } from 'react';
import { Activity } from 'lucide-react';
import { MetricsPanel } from '@/components/Metrics/MetricsPanel';
import { PulsingGlow } from '@/components/ui/PulsingGlow';
import { Button } from '@/components/ui/button';
import { AppMetricsContainer } from '@/components/Console/AppMetricsContainer';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useMetricsStore } from '@/stores/useMetricsStore';
import { cn } from '@/utils/cn';

export const StatusBar = (): React.JSX.Element => {
  const metricsVisible = useSettingsStore<boolean>((state) => state.metricsVisible);
  const { metrics, timestamp, isLive } = useMetricsStore();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Determine pulsing glow state
  // init: metrics.memory === undefined (strong pulse)
  // tracking: isLive === true && metrics exist AND feature is enabled (faint pulse) - pulse when active
  // idle: metrics exist but not live, or feature is disabled (no pulse)
  const getPulsingState = (): 'init' | 'tracking' | 'idle' => {
    // If feature is disabled, no pulse
    if (!metricsVisible) {
      return 'idle';
    }
    if (metrics.memory === undefined) {
      return 'init';
    }
    // Show tracking pulse when metrics are enabled and metrics exist (even if zero/initial state)
    // This indicates metrics are running/active
    return 'tracking';
  };

  const pulsingState = getPulsingState();

  // Show metrics on bar when they exist AND toggle is enabled
  const hasMetrics = metrics.memory !== undefined;
  const shouldShowMetrics = metricsVisible && hasMetrics;

  return (
    <>
      <div
        className="h-8 border-t border-border-subtle bg-bg-surface/80 flex items-center justify-between px-5 text-xs"
        data-testid="status-bar"
      >
        <div className="flex items-center gap-4 opacity-70">
          <span className="flex items-center gap-1.5">
            <span className="text-text-muted">Environment:</span>
            <span className="font-mono text-text-secondary">default</span>
          </span>
          {/* Metrics toggle button with pulsing glow */}
          <Button
            ref={buttonRef}
            variant="ghost"
            size="xs"
            onClick={(): void => {
              setIsPanelOpen(!isPanelOpen);
            }}
            className={cn('gap-1.5', isPanelOpen && 'bg-bg-raised text-text-primary')}
            data-testid="status-bar-metrics-button"
            aria-label={isPanelOpen ? 'Close metrics panel' : 'Open metrics panel'}
          >
            <PulsingGlow state={pulsingState} data-testid="metrics-pulsing-glow">
              <Activity className="w-2.5! h-2.5!" />
            </PulsingGlow>
            <span>Metrics</span>
          </Button>
          {/* Compact metrics display - show when metrics feature is enabled and metrics exist */}
          {shouldShowMetrics && (
            <div className="flex items-center" data-testid="status-bar-metrics">
              <AppMetricsContainer compact={true} />
            </div>
          )}
          {/* Always mount AppMetricsContainer when metricsVisible is true to ensure it can fetch metrics */}
          {metricsVisible && !shouldShowMetrics && (
            <div className="hidden" data-testid="status-bar-metrics-hidden">
              <AppMetricsContainer compact={true} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 opacity-60 hover:opacity-100 transition-opacity">
          <span className="flex items-center gap-1.5 text-text-muted">
            <span className="text-text-muted">Version:</span>
            <span className="font-mono text-text-secondary">
              {/* @ts-expect-error - Injected by Vite define */}
              {__APP_VERSION__}
            </span>
          </span>
        </div>
      </div>
      {/* Metrics Panel Dialog */}
      <MetricsPanel
        isOpen={isPanelOpen}
        onClose={(): void => {
          setIsPanelOpen(false);
        }}
        metrics={metrics}
        timestamp={timestamp}
        isLive={isLive}
        buttonRef={buttonRef}
      />
    </>
  );
};
