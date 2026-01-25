/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { AppMetricsContainer } from './AppMetricsContainer';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useMetricsStore } from '@/stores/useMetricsStore';
import * as tauriApi from '@tauri-apps/api/core';
import * as tauriEvent from '@tauri-apps/api/event';

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}));

// Mock stores
vi.mock('@/stores/useSettingsStore', () => ({
  useSettingsStore: vi.fn(),
}));

vi.mock('@/stores/useMetricsStore', () => ({
  useMetricsStore: vi.fn(),
}));

describe('AppMetricsContainer', () => {
  const mockSetMetricsStore = vi.fn();
  const mockSetMetricsVisible = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default store mocks
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      metricsVisible: false,
      setMetricsVisible: mockSetMetricsVisible,
    });

    (useMetricsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      setMetrics: mockSetMetricsStore,
    });

    // Mock window.__TAURI__
    (window as { __TAURI__?: unknown }).__TAURI__ = {};
  });

  afterEach(() => {
    delete (window as { __TAURI__?: unknown }).__TAURI__;
  });

  it('disables monitoring when metricsVisible is false', async () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      metricsVisible: false,
      setMetricsVisible: mockSetMetricsVisible,
    });

    render(<AppMetricsContainer />);

    await waitFor(() => {
      expect(tauriApi.invoke).toHaveBeenCalledWith('set_memory_monitoring_enabled', {
        enabled: false,
      });
    });
  });

  it('enables monitoring when metricsVisible is true', async () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      metricsVisible: true,
      setMetricsVisible: mockSetMetricsVisible,
    });

    vi.mocked(tauriApi.invoke).mockResolvedValue({
      current: 100,
      average: 95,
      peak: 110,
      samplesCount: 1,
      thresholdExceeded: false,
      thresholdMb: 500,
      thresholdPercent: 0,
    });

    const mockUnlisten = vi.fn();
    vi.mocked(tauriEvent.listen).mockResolvedValue(mockUnlisten as never);

    render(<AppMetricsContainer />);

    await waitFor(() => {
      expect(tauriApi.invoke).toHaveBeenCalledWith('set_memory_monitoring_enabled', {
        enabled: true,
      });
    });
  });

  it('calls collect_ram_sample when metrics are enabled', async () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      metricsVisible: true,
      setMetricsVisible: mockSetMetricsVisible,
    });

    vi.mocked(tauriApi.invoke).mockImplementation((cmd) => {
      if (cmd === 'set_memory_monitoring_enabled') {
        return Promise.resolve(undefined);
      }
      if (cmd === 'collect_ram_sample') {
        return Promise.resolve({
          current: 100,
          average: 95,
          peak: 110,
          samplesCount: 1,
          thresholdExceeded: false,
          thresholdMb: 500,
          thresholdPercent: 0,
        });
      }
      return Promise.resolve(null);
    });

    const mockUnlisten = vi.fn();
    vi.mocked(tauriEvent.listen).mockResolvedValue(mockUnlisten as never);

    render(<AppMetricsContainer />);

    await waitFor(() => {
      expect(tauriApi.invoke).toHaveBeenCalledWith('collect_ram_sample');
    });
  });

  it('sets up event listener when metrics are enabled', async () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      metricsVisible: true,
      setMetricsVisible: mockSetMetricsVisible,
    });

    vi.mocked(tauriApi.invoke).mockResolvedValue({
      current: 100,
      average: 95,
      peak: 110,
      samplesCount: 1,
      thresholdExceeded: false,
      thresholdMb: 500,
      thresholdPercent: 0,
    });

    const mockUnlisten = vi.fn();
    vi.mocked(tauriEvent.listen).mockResolvedValue(mockUnlisten as never);

    const { unmount } = render(<AppMetricsContainer />);

    await waitFor(() => {
      expect(tauriEvent.listen).toHaveBeenCalledWith('memory:update', expect.any(Function));
    });

    unmount();

    // Unlisten should be called on cleanup
    await waitFor(() => {
      expect(mockUnlisten).toHaveBeenCalled();
    });
  });

  it('calls set_memory_monitoring_enabled(false) on cleanup when monitoring was enabled', async () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      metricsVisible: true,
      setMetricsVisible: mockSetMetricsVisible,
    });

    vi.mocked(tauriApi.invoke).mockImplementation((cmd) => {
      if (cmd === 'set_memory_monitoring_enabled') {
        return Promise.resolve(undefined);
      }
      if (cmd === 'collect_ram_sample') {
        return Promise.resolve({
          current: 100,
          average: 95,
          peak: 110,
          samplesCount: 1,
          thresholdExceeded: false,
          thresholdMb: 500,
          thresholdPercent: 0,
        });
      }
      return Promise.resolve(null);
    });

    const mockUnlisten = vi.fn();
    vi.mocked(tauriEvent.listen).mockResolvedValue(mockUnlisten as never);

    const { unmount } = render(<AppMetricsContainer />);

    // Wait for enable call
    await waitFor(() => {
      expect(tauriApi.invoke).toHaveBeenCalledWith('set_memory_monitoring_enabled', {
        enabled: true,
      });
    });

    // Clear previous calls to track cleanup
    vi.clearAllMocks();

    unmount();

    // Should call disable on cleanup
    await waitFor(() => {
      expect(tauriApi.invoke).toHaveBeenCalledWith('set_memory_monitoring_enabled', {
        enabled: false,
      });
    });
  });
});
