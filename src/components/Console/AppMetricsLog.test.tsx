/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppMetricsLog } from './AppMetricsLog';
import type { AppMetrics } from '@/types/metrics';

describe('AppMetricsLog', () => {
  const mockMetrics: AppMetrics = {
    memory: {
      current: 245.5,
      average: 220.3,
      peak: 300.0,
      threshold: 1536.0,
      thresholdPercent: 0.4,
      samplesCount: 10,
    },
  };

  it('renders memory stats', () => {
    render(<AppMetricsLog metrics={mockMetrics} timestamp={Date.now()} />);

    expect(screen.getByTestId('app-metrics-log')).toBeInTheDocument();
    expect(screen.getByTestId('memory-metrics-display')).toBeInTheDocument();
  });

  it('displays formatted memory metrics', () => {
    render(<AppMetricsLog metrics={mockMetrics} timestamp={Date.now()} />);

    const display = screen.getByTestId('memory-metrics-display');
    expect(display).toHaveTextContent('Current: 245.5 MB');
    expect(display).toHaveTextContent('Average: 220.3 MB');
    expect(display).toHaveTextContent('Peak: 300.0 MB');
  });

  it('handles metrics without memory data', () => {
    const metricsWithoutMemory: AppMetrics = {};
    render(<AppMetricsLog metrics={metricsWithoutMemory} timestamp={Date.now()} />);

    expect(screen.getByTestId('app-metrics-log')).toBeInTheDocument();
    expect(screen.queryByTestId('memory-metrics-display')).not.toBeInTheDocument();
  });

  it('shows updating indicator when isUpdating is true', () => {
    render(<AppMetricsLog metrics={mockMetrics} timestamp={Date.now()} isUpdating={true} />);

    const log = screen.getByTestId('app-metrics-log');
    expect(log).toHaveAttribute('data-updating', 'true');
  });

  it('does not show updating indicator when isUpdating is false', () => {
    render(<AppMetricsLog metrics={mockMetrics} timestamp={Date.now()} isUpdating={false} />);

    const log = screen.getByTestId('app-metrics-log');
    expect(log).toHaveAttribute('data-updating', 'false');
  });
});
