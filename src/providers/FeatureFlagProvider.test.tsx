/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FeatureFlagProvider } from './FeatureFlagProvider';
import { useFeatureFlagStore } from '@/stores/features/useFeatureFlagStore';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const { invoke } = await import('@tauri-apps/api/core');

describe('FeatureFlagProvider', () => {
  beforeEach(() => {
    useFeatureFlagStore.getState().resetToDefaults();
    useFeatureFlagStore.getState().setHydrated(false);
    vi.clearAllMocks();
  });

  it('renders children immediately', () => {
    render(
      <FeatureFlagProvider skipHydration>
        <div data-test-id="child">Ready</div>
      </FeatureFlagProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('calls load_feature_flags on mount', async () => {
    (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

    render(
      <FeatureFlagProvider>
        <div data-test-id="child">Ready</div>
      </FeatureFlagProvider>
    );

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith('load_feature_flags');
    });
  });

  it('hydrates store with loaded config', async () => {
    (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      canvas: { enabled: true },
    });

    render(
      <FeatureFlagProvider>
        <div data-test-id="child">Ready</div>
      </FeatureFlagProvider>
    );

    await waitFor(() => {
      expect(useFeatureFlagStore.getState().flags.canvas.enabled).toBe(true);
    });
  });

  it('sets isHydrated after load', async () => {
    (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

    render(
      <FeatureFlagProvider>
        <div data-test-id="child">Ready</div>
      </FeatureFlagProvider>
    );

    await waitFor(() => {
      expect(useFeatureFlagStore.getState().isHydrated).toBe(true);
    });
  });

  it('skipHydration prevents Tauri call', () => {
    render(
      <FeatureFlagProvider skipHydration>
        <div data-test-id="child">Ready</div>
      </FeatureFlagProvider>
    );

    expect(invoke).not.toHaveBeenCalled();
  });

  it('overrides prop sets flags directly', async () => {
    render(
      <FeatureFlagProvider overrides={{ canvas: { enabled: true } }}>
        <div data-test-id="child">Ready</div>
      </FeatureFlagProvider>
    );

    await waitFor(() => {
      expect(useFeatureFlagStore.getState().flags.canvas.enabled).toBe(true);
      expect(useFeatureFlagStore.getState().isHydrated).toBe(true);
    });
  });

  it('handles Tauri errors gracefully', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    (invoke as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('boom'));

    render(
      <FeatureFlagProvider>
        <div data-test-id="child">Ready</div>
      </FeatureFlagProvider>
    );

    await waitFor(() => {
      expect(useFeatureFlagStore.getState().isHydrated).toBe(true);
    });

    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
