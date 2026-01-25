/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { create } from 'zustand';
import type { AppMetrics } from '@/types/metrics';

interface MetricsState {
  metrics: AppMetrics;
  timestamp: number;
  isLive: boolean;
  setMetrics: (metrics: AppMetrics, timestamp: number, isLive: boolean) => void;
}

/**
 * Zustand store for managing application metrics state.
 *
 * Provides global access to metrics data for components that need it
 * (StatusBar, MetricsPanel, AppMetricsContainer, etc.).
 */
export const useMetricsStore = create<MetricsState>((set) => ({
  metrics: {},
  timestamp: Date.now(),
  isLive: false,

  setMetrics: (metrics, timestamp, isLive): void => {
    set({ metrics, timestamp, isLive });
  },
}));
