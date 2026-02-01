/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useCallback } from 'react';
import { useFeatureFlagStore } from '../stores/features/useFeatureFlagStore';
import type { FeatureFlagState } from '../stores/features/useFeatureFlagStore';
import { FLAG_METADATA } from '../stores/features/metadata';
import { isFeatureInteractive, isFeatureVisible } from '../stores/features/types';
import type { FeatureFlags, FeatureState } from '../stores/features/types';

export interface UseFeatureFlagResult {
  /** Whether the flag is enabled */
  enabled: boolean;

  /** The disclosure state of the feature */
  state: FeatureState;

  /** Whether the feature is visible (not hidden) */
  isVisible: boolean;

  /** Whether the feature is interactive (not teaser) */
  isInteractive: boolean;
}

/**
 * Hook to access a feature flag with metadata.
 *
 * Uses atomic selector to prevent unnecessary re-renders.
 * Only re-renders when the specific flag changes.
 *
 * @example
 * ```tsx
 * const { enabled, state, isVisible } = useFeatureFlag('canvas', 'minimap');
 *
 * if (!isVisible) return null;
 * if (!enabled) return <ComingSoon />;
 * return <Minimap />;
 * ```
 */
export function useFeatureFlag<L extends keyof FeatureFlags>(
  layer: L,
  flag: keyof FeatureFlags[L]
): UseFeatureFlagResult {
  // Atomic selector - only re-renders when this specific flag changes
  const enabled = useFeatureFlagStore(
    useCallback((storeState) => storeState.flags[layer][flag] as boolean, [layer, flag])
  );

  // Metadata is static, no need for selector
  const metadata = FLAG_METADATA[layer][flag];
  const state = metadata.state;

  return {
    enabled,
    state,
    isVisible: isFeatureVisible(state),
    isInteractive: isFeatureInteractive(state),
  };
}

/**
 * Hook to access multiple flags at once.
 *
 * Use sparingly - prefer individual useFeatureFlag calls for
 * better render optimization.
 *
 * @example
 * ```tsx
 * const flags = useFeatureFlags();
 * const canvasEnabled = flags.canvas.enabled;
 * ```
 */
export function useFeatureFlags(): FeatureFlags {
  return useFeatureFlagStore((state) => state.flags);
}

/**
 * Hook to access feature flag actions.
 *
 * Actions are stable and don't cause re-renders.
 *
 * @example
 * ```tsx
 * const { setFlag, resetToDefaults } = useFeatureFlagActions();
 * setFlag('canvas', 'enabled', true);
 * ```
 */
export interface FeatureFlagActions {
  setFlag: FeatureFlagState['setFlag'];
  hydrateFlags: FeatureFlagState['hydrateFlags'];
  resetToDefaults: FeatureFlagState['resetToDefaults'];
}

export function useFeatureFlagActions(): FeatureFlagActions {
  const setFlag = useFeatureFlagStore((state) => state.setFlag);
  const hydrateFlags = useFeatureFlagStore((state) => state.hydrateFlags);
  const resetToDefaults = useFeatureFlagStore((state) => state.resetToDefaults);

  return { setFlag, hydrateFlags, resetToDefaults };
}
