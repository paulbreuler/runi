/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFeatureFlag, useFeatureFlags, useFeatureFlagActions } from './useFeatureFlag';
import { useFeatureFlagStore } from '@/stores/features/useFeatureFlagStore';
import { FLAG_METADATA } from '@/stores/features/metadata';

describe('useFeatureFlag', () => {
  beforeEach(() => {
    useFeatureFlagStore.getState().resetToDefaults();
  });

  test('returns correct enabled value', () => {
    const { result } = renderHook(() => useFeatureFlag('http', 'importBruno'));
    expect(result.current.enabled).toBe(false);

    const { result: result2 } = renderHook(() => useFeatureFlag('canvas', 'enabled'));
    expect(result2.current.enabled).toBe(false);
  });

  test('returns state from metadata', () => {
    const { result } = renderHook(() => useFeatureFlag('http', 'importBruno'));
    expect(result.current.state).toBe(FLAG_METADATA.http.importBruno.state);
    expect(result.current.state).toBe('teaser');

    const { result: result2 } = renderHook(() => useFeatureFlag('canvas', 'connectionLines'));
    expect(result2.current.state).toBe('teaser');
  });

  test('returns isVisible correctly', () => {
    // Teaser feature
    const { result: teaser } = renderHook(() => useFeatureFlag('canvas', 'connectionLines'));
    expect(teaser.current.isVisible).toBe(true);

    // Stable feature
    const { result: stable } = renderHook(() => useFeatureFlag('http', 'collectionsEnabled'));
    expect(stable.current.isVisible).toBe(true);
  });

  test('returns isInteractive correctly', () => {
    // Teaser feature - not interactive
    const { result: teaser } = renderHook(() => useFeatureFlag('canvas', 'connectionLines'));
    expect(teaser.current.isInteractive).toBe(false);

    // Teaser feature - not interactive
    const { result: teaser2 } = renderHook(() => useFeatureFlag('canvas', 'enabled'));
    expect(teaser2.current.isInteractive).toBe(false);

    // Stable feature - interactive
    const { result: stable } = renderHook(() => useFeatureFlag('http', 'collectionsEnabled'));
    expect(stable.current.isInteractive).toBe(true);
  });

  test('updates when specific flag changes', () => {
    const { result } = renderHook(() => useFeatureFlag('canvas', 'enabled'));
    expect(result.current.enabled).toBe(false);

    act(() => {
      useFeatureFlagStore.getState().setFlag('canvas', 'enabled', true);
    });

    expect(result.current.enabled).toBe(true);
  });
});

describe('useFeatureFlags', () => {
  beforeEach(() => {
    useFeatureFlagStore.getState().resetToDefaults();
  });

  test('returns all flags', () => {
    const { result } = renderHook(() => useFeatureFlags());
    expect(result.current).toHaveProperty('http');
    expect(result.current).toHaveProperty('canvas');
    expect(result.current).toHaveProperty('comprehension');
    expect(result.current).toHaveProperty('ai');
    expect(result.current).toHaveProperty('debug');
  });
});

describe('useFeatureFlagActions', () => {
  beforeEach(() => {
    useFeatureFlagStore.getState().resetToDefaults();
  });

  test('setFlag updates flag value', () => {
    const { result } = renderHook(() => useFeatureFlagActions());

    act(() => {
      result.current.setFlag('canvas', 'enabled', true);
    });

    expect(useFeatureFlagStore.getState().flags.canvas.enabled).toBe(true);
  });

  test('hydrateFlags merges config', () => {
    const { result } = renderHook(() => useFeatureFlagActions());

    act(() => {
      result.current.hydrateFlags({ canvas: { enabled: true } });
    });

    expect(useFeatureFlagStore.getState().flags.canvas.enabled).toBe(true);
    expect(useFeatureFlagStore.getState().isHydrated).toBe(true);
  });

  test('resetToDefaults restores defaults', () => {
    const { result } = renderHook(() => useFeatureFlagActions());

    act(() => {
      result.current.setFlag('canvas', 'enabled', true);
      result.current.resetToDefaults();
    });

    expect(useFeatureFlagStore.getState().flags.canvas.enabled).toBe(false);
  });
});
