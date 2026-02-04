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
    expect(updated.flags.http.importBruno).toBe(false);
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
    expect(flags.http.importBruno).toBe(false);
  });

  test('hydrateFlags ignores unknown flags silently', () => {
    const store = useFeatureFlagStore.getState();

    const config = {
      canvas: { enabled: true },
      unknownLayer: { someFlag: true },
    } as unknown as Parameters<typeof store.hydrateFlags>[0];

    store.hydrateFlags(config);

    const { flags } = useFeatureFlagStore.getState();
    expect(flags.canvas.enabled).toBe(true);
    expect((flags as unknown as Record<string, unknown>).unknownLayer).toBeUndefined();
  });

  test('hydrateFlags ignores unknown flags within known layers', () => {
    const store = useFeatureFlagStore.getState();

    const config = {
      canvas: {
        enabled: true,
        unknownFlag: true,
      },
    } as unknown as Parameters<typeof store.hydrateFlags>[0];

    store.hydrateFlags(config);

    const { flags } = useFeatureFlagStore.getState();
    expect(flags.canvas.enabled).toBe(true);
    expect((flags.canvas as unknown as Record<string, unknown>).unknownFlag).toBeUndefined();
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
