/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { act } from '@testing-library/react';
import { createElement, Fragment } from 'react';
import type { FC, ReactNode } from 'react';
import type { FeatureFlags, DeepPartial } from '@/stores/features/types';
import { useFeatureFlagStore } from '@/stores/features/useFeatureFlagStore';

export const withFeatureFlags = (flags: DeepPartial<FeatureFlags>): FC<{ children: ReactNode }> => {
  const store = useFeatureFlagStore.getState();
  act(() => {
    store.hydrateFlags(flags);
    store.setHydrated(true);
  });

  return function FeatureFlagWrapper({ children }: { children: ReactNode }) {
    return createElement(Fragment, null, children);
  };
};

export const resetFeatureFlags = (): void => {
  const store = useFeatureFlagStore.getState();
  act(() => {
    store.resetToDefaults();
    store.setHydrated(false);
  });
};

export const getFlag = <L extends keyof FeatureFlags>(
  layer: L,
  flag: keyof FeatureFlags[L]
): boolean => {
  return useFeatureFlagStore.getState().flags[layer][flag] as boolean;
};

export const setFlag = <L extends keyof FeatureFlags>(
  layer: L,
  flag: keyof FeatureFlags[L],
  value: boolean
): void => {
  useFeatureFlagStore.getState().setFlag(layer, flag, value);
};
