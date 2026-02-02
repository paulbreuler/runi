/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { ReactElement, ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { DeepPartial, FeatureFlags } from '@/stores/features/types';
import { useFeatureFlagStore } from '@/stores/features/useFeatureFlagStore';

export interface FeatureFlagProviderProps {
  children: ReactNode;
  skipHydration?: boolean;
  overrides?: DeepPartial<FeatureFlags>;
}

export const FeatureFlagProvider = ({
  children,
  skipHydration = false,
  overrides,
}: FeatureFlagProviderProps): ReactElement => {
  const hydrateFlags = useFeatureFlagStore((state) => state.hydrateFlags);
  const setHydrated = useFeatureFlagStore((state) => state.setHydrated);
  const hydrationAttempted = useRef(false);

  useEffect(() => {
    if (hydrationAttempted.current) {
      return;
    }

    hydrationAttempted.current = true;

    if (skipHydration) {
      setHydrated(true);
      return;
    }

    if (overrides !== undefined) {
      hydrateFlags(overrides);
      setHydrated(true);
      return;
    }

    invoke<Record<string, unknown>>('load_feature_flags')
      .then((config) => {
        hydrateFlags(config as DeepPartial<FeatureFlags>);
        setHydrated(true);
      })
      .catch((error: unknown) => {
        console.warn('Failed to load feature flags:', error);
        setHydrated(true);
      });
  }, [skipHydration, overrides, hydrateFlags, setHydrated]);

  return <>{children}</>;
};
