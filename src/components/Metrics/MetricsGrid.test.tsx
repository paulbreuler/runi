/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricsGrid } from './MetricsGrid';
import { TooltipProvider } from '@/components/ui/Tooltip';
import type { AppMetrics } from '@/types/metrics';

describe('MetricsGrid', () => {
  const mockMetrics: AppMetrics = {
    memory: {
      current: 245.5,
      average: 230.0,
      peak: 300.0,
      threshold: 500.0,
      thresholdPercent: 0.5,
      samplesCount: 10,
    },
  };

  it('renders 2-column grid with labels left, values right', () => {
    render(
      <TooltipProvider>
        <MetricsGrid metrics={mockMetrics} />
      </TooltipProvider>
    );

    const grid = screen.getByTestId('metrics-grid');
    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('grid-cols-[auto_1fr]');
  });

  it('renders Current row with MetricCell', () => {
    render(
      <TooltipProvider>
        <MetricsGrid metrics={mockMetrics} />
      </TooltipProvider>
    );

    expect(screen.getByTestId('metrics-grid-label-current')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-grid-value-current')).toBeInTheDocument();
  });

  it('renders Average row with MetricCell', () => {
    render(
      <TooltipProvider>
        <MetricsGrid metrics={mockMetrics} />
      </TooltipProvider>
    );

    expect(screen.getByTestId('metrics-grid-label-average')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-grid-value-average')).toBeInTheDocument();
  });

  it('renders Peak row with MetricCell', () => {
    render(
      <TooltipProvider>
        <MetricsGrid metrics={mockMetrics} />
      </TooltipProvider>
    );

    expect(screen.getByTestId('metrics-grid-label-peak')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-grid-value-peak')).toBeInTheDocument();
  });

  it('renders Threshold row with muted text (not MetricCell)', () => {
    render(
      <TooltipProvider>
        <MetricsGrid metrics={mockMetrics} />
      </TooltipProvider>
    );

    expect(screen.getByTestId('metrics-grid-label-threshold')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-grid-value-threshold')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-grid-value-threshold')).toHaveClass('text-text-muted');
  });

  it('renders placeholder values when metrics are undefined', () => {
    const emptyMetrics: AppMetrics = {};
    render(
      <TooltipProvider>
        <MetricsGrid metrics={emptyMetrics} />
      </TooltipProvider>
    );

    // Grid should still render with all labels
    expect(screen.getByTestId('metrics-grid')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-grid-label-current')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-grid-label-average')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-grid-label-peak')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-grid-label-threshold')).toBeInTheDocument();

    // Values should show placeholder "--"
    expect(screen.getByTestId('metrics-grid-value-current')).toHaveTextContent('--');
    expect(screen.getByTestId('metrics-grid-value-average')).toHaveTextContent('--');
    expect(screen.getByTestId('metrics-grid-value-peak')).toHaveTextContent('--');
    expect(screen.getByTestId('metrics-grid-value-threshold')).toHaveTextContent('--');
  });
});
