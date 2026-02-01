/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { useFeatureFlagStore } from './useFeatureFlagStore';
import { DEFAULT_FLAGS } from './defaults';

describe('useFeatureFlagStore', () => {
  beforeEach(() => {
    useFeatureFlagStore.getState().resetToDefaults();
  });

  test('initializes with DEFAULT_FLAGS', () => {
    const { flags } = useFeatureFlagStore.getState();
    expect(flags).toEqual(DEFAULT_FLAGS);
  });

  test('flags matches FeatureFlags shape', () => {
    const { flags } = useFeatureFlagStore.getState();
    expect(flags).toHaveProperty('http');
    expect(flags).toHaveProperty('canvas');
    expect(flags).toHaveProperty('comprehension');
    expect(flags).toHaveProperty('ai');
    expect(flags).toHaveProperty('debug');
  });

  test('setFlag updates single flag value', () => {
    const store = useFeatureFlagStore.getState();
    expect(store.flags.canvas.enabled).toBe(false);

    store.setFlag('canvas', 'enabled', true);

    const updated = useFeatureFlagStore.getState();
    expect(updated.flags.canvas.enabled).toBe(true);
    // Other flags unchanged
    expect(updated.flags.canvas.minimap).toBe(false);
    expect(updated.flags.http.importBruno).toBe(true);
  });

  test('hydrateFlags merges partial config with defaults', () => {
    const store = useFeatureFlagStore.getState();

    store.hydrateFlags({
      canvas: { enabled: true, minimap: true },
      debug: { verboseLogging: true },
    });

    const { flags } = useFeatureFlagStore.getState();
    // Merged values
    expect(flags.canvas.enabled).toBe(true);
    expect(flags.canvas.minimap).toBe(true);
    expect(flags.debug.verboseLogging).toBe(true);
    // Defaults preserved
    expect(flags.canvas.connectionLines).toBe(false);
    expect(flags.http.importBruno).toBe(true);
  });

  test('hydrateFlags ignores unknown flags silently', () => {
    const store = useFeatureFlagStore.getState();

    store.hydrateFlags({
      canvas: { enabled: true },
      // @ts-expect-error - testing unknown layer
      unknownLayer: { someFlag: true },
    } as never);

    const { flags } = useFeatureFlagStore.getState();
    expect(flags.canvas.enabled).toBe(true);
    expect((flags as Record<string, unknown>).unknownLayer).toBeUndefined();
  });

  test('hydrateFlags ignores unknown flags within known layers', () => {
    const store = useFeatureFlagStore.getState();

    store.hydrateFlags({
      canvas: {
        enabled: true,
        // @ts-expect-error - testing unknown flag
        unknownFlag: true,
      },
    } as never);

    const { flags } = useFeatureFlagStore.getState();
    expect(flags.canvas.enabled).toBe(true);
    expect((flags.canvas as Record<string, unknown>).unknownFlag).toBeUndefined();
  });

  test('resetToDefaults restores DEFAULT_FLAGS', () => {
    const store = useFeatureFlagStore.getState();
    store.setFlag('canvas', 'enabled', true);
    store.setFlag('debug', 'verboseLogging', true);
    store.setHydrated(true);

    store.resetToDefaults();

    const reset = useFeatureFlagStore.getState();
    expect(reset.flags).toEqual(DEFAULT_FLAGS);
    expect(reset.isHydrated).toBe(false);
  });

  test('isHydrated starts false, changes on hydrateFlags', () => {
    expect(useFeatureFlagStore.getState().isHydrated).toBe(false);

    useFeatureFlagStore.getState().hydrateFlags({ canvas: { enabled: true } });

    expect(useFeatureFlagStore.getState().isHydrated).toBe(true);
  });

  test('setHydrated updates hydration state', () => {
    const store = useFeatureFlagStore.getState();
    expect(store.isHydrated).toBe(false);

    store.setHydrated(true);

    expect(useFeatureFlagStore.getState().isHydrated).toBe(true);
  });
});
