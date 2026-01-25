/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { Activity } from 'lucide-react';
import { AppMetricsContainer } from '@/components/Console/AppMetricsContainer';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { cn } from '@/utils/cn';

export const StatusBar = (): React.JSX.Element => {
  const metricsVisible = useSettingsStore((state) => state.metricsVisible);
  const toggleMetrics = useSettingsStore((state) => state.toggleMetrics);

  return (
    <div
      className="h-8 border-t border-border-subtle bg-bg-surface/80 flex items-center justify-between px-5 text-xs"
      data-testid="status-bar"
    >
      <div className="flex items-center gap-4 opacity-70">
        <span className="flex items-center gap-1.5">
          <span className="text-text-muted">Environment:</span>
          <span className="font-mono text-text-secondary">default</span>
        </span>
        {/* Metrics toggle and display */}
        <button
          type="button"
          onClick={toggleMetrics}
          className={cn(
            'flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors',
            metricsVisible
              ? 'bg-bg-raised text-text-primary'
              : 'text-text-muted hover:text-text-secondary hover:bg-bg-raised'
          )}
          data-testid="metrics-toggle"
          aria-label={metricsVisible ? 'Hide metrics' : 'Show metrics'}
        >
          <Activity className="w-3 h-3" />
          <span>Metrics</span>
        </button>
        {metricsVisible && (
          <div className="flex items-center" data-testid="status-bar-metrics">
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
  );
};
