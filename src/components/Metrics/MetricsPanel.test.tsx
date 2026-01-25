/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MetricsPanel } from './MetricsPanel';
import type { AppMetrics } from '@/types/metrics';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock stores
const mockSetMetrics = vi.fn();
const mockMetricsVisible = true;
const mockSetMetricsVisible = vi.fn();

vi.mock('@/stores/useMetricsStore', () => ({
  useMetricsStore: vi.fn((selector) => {
    if (selector.toString().includes('setMetrics')) {
      return mockSetMetrics;
    }
    return undefined;
  }),
}));

vi.mock('@/stores/useSettingsStore', () => ({
  useSettingsStore: vi.fn((selector) => {
    if (selector.toString().includes('metricsVisible')) {
      return mockMetricsVisible;
    }
    if (selector.toString().includes('setMetricsVisible')) {
      return mockSetMetricsVisible;
    }
    return undefined;
  }),
}));

describe('MetricsPanel', () => {
  const mockOnClose = vi.fn();
  const mockButtonRef = { current: document.createElement('button') };
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockButtonRef.current.getBoundingClientRect = vi.fn(() => ({
      left: 100,
      top: 0,
      right: 200,
      bottom: 0,
      width: 100,
      height: 0,
      x: 100,
      y: 0,
      toJSON: vi.fn(),
    }));
  });

  it('renders dialog with header and content', () => {
    render(
      <MetricsPanel
        isOpen={true}
        onClose={mockOnClose}
        buttonRef={mockButtonRef}
        metrics={mockMetrics}
        timestamp={Date.now()}
        isLive={true}
      />
    );

    expect(screen.getByTestId('metrics-panel')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-header')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-grid')).toBeInTheDocument();
  });

  it('renders DialogHeader with title and MetricsToggle in actions', () => {
    render(
      <MetricsPanel
        isOpen={true}
        onClose={mockOnClose}
        buttonRef={mockButtonRef}
        metrics={mockMetrics}
        timestamp={Date.now()}
        isLive={true}
      />
    );

    expect(screen.getByText('App Metrics')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-toggle')).toBeInTheDocument();
  });

  it('renders MetricsGrid with metrics data', () => {
    render(
      <MetricsPanel
        isOpen={true}
        onClose={mockOnClose}
        buttonRef={mockButtonRef}
        metrics={mockMetrics}
        timestamp={Date.now()}
        isLive={true}
      />
    );

    expect(screen.getByTestId('metrics-grid-label-current')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-grid-value-current')).toBeInTheDocument();
  });

  it('fetches immediate stats on open', async () => {
    const { invoke } = await import('@tauri-apps/api/core');

    // Mock Tauri environment
    Object.defineProperty(window, '__TAURI__', {
      value: {},
      writable: true,
    });

    vi.mocked(invoke).mockResolvedValue({
      current: 250.0,
      average: 240.0,
      peak: 310.0,
      samplesCount: 11,
      thresholdExceeded: false,
      thresholdMb: 500.0,
      thresholdPercent: 0.5,
    });

    render(
      <MetricsPanel
        isOpen={true}
        onClose={mockOnClose}
        buttonRef={mockButtonRef}
        metrics={mockMetrics}
        timestamp={Date.now()}
        isLive={true}
      />
    );

    await waitFor(
      () => {
        expect(invoke).toHaveBeenCalledWith('get_ram_stats');
      },
      { timeout: 2000 }
    );
  });

  it('does not render when isOpen is false', () => {
    render(
      <MetricsPanel
        isOpen={false}
        onClose={mockOnClose}
        buttonRef={mockButtonRef}
        metrics={mockMetrics}
        timestamp={Date.now()}
        isLive={true}
      />
    );

    expect(screen.queryByTestId('metrics-panel')).not.toBeInTheDocument();
  });
});
