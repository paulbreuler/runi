/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { create } from 'zustand';
import type { FeatureFlags, DeepPartial } from './types';
import { DEFAULT_FLAGS } from './defaults';

export interface FeatureFlagState {
  /** Current flag values */
  flags: FeatureFlags;

  /** Whether config has been hydrated from filesystem */
  isHydrated: boolean;

  /** Set a single flag value */
  setFlag: <L extends keyof FeatureFlags>(
    layer: L,
    flag: keyof FeatureFlags[L],
    value: boolean
  ) => void;

  /** Bulk update flags from config */
  hydrateFlags: (config: DeepPartial<FeatureFlags>) => void;

  /** Reset all flags to defaults */
  resetToDefaults: () => void;

  /** Mark hydration complete */
  setHydrated: (hydrated: boolean) => void;
}

/**
 * Deep merge partial config with defaults.
 * Unknown keys are silently ignored for forward compatibility.
 */
const deepMerge = (defaults: FeatureFlags, partial: DeepPartial<FeatureFlags>): FeatureFlags => {
  const result = structuredClone(defaults);

  for (const layerKey of Object.keys(partial) as Array<keyof FeatureFlags>) {
    const layerValue = partial[layerKey];
    if (layerValue !== undefined && typeof layerValue === 'object' && layerKey in result) {
      for (const flagKey of Object.keys(layerValue) as Array<keyof typeof layerValue>) {
        const flagValue = layerValue[flagKey];
        if (typeof flagValue === 'boolean' && flagKey in result[layerKey]) {
          // Double cast required: TypeScript can't directly convert typed flag interfaces
          // (e.g., HttpFlags) to Record<string, boolean> because they lack index signatures.
          // We've validated layerKey and flagKey exist via runtime checks above.
          (result[layerKey] as unknown as Record<string, boolean>)[flagKey as string] = flagValue;
        }
      }
    }
  }

  return result;
};

export const useFeatureFlagStore = create<FeatureFlagState>((set) => ({
  flags: structuredClone(DEFAULT_FLAGS),
  isHydrated: false,

  setFlag: (layer, flag, value): void => {
    set((state) => ({
      flags: {
        ...state.flags,
        [layer]: {
          ...state.flags[layer],
          [flag]: value,
        },
      },
    }));
  },

  hydrateFlags: (config): void => {
    set((state) => ({
      flags: deepMerge(state.flags, config),
      isHydrated: true,
    }));
  },

  resetToDefaults: (): void => {
    set({
      flags: structuredClone(DEFAULT_FLAGS),
      isHydrated: false,
    });
  },

  setHydrated: (hydrated): void => {
    set({ isHydrated: hydrated });
  },
}));
