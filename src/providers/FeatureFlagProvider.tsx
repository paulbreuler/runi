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
  const lastOverrides = useRef<DeepPartial<FeatureFlags> | undefined>(undefined);

  useEffect(() => {
    const previousOverrides = lastOverrides.current;
    if (previousOverrides !== overrides) {
      lastOverrides.current = overrides;
    }

    if (overrides !== undefined) {
      if (previousOverrides !== overrides) {
        hydrateFlags(overrides);
        setHydrated(true);
      }
      return;
    }

    if (previousOverrides !== undefined) {
      hydrationAttempted.current = false;
    }

    if (skipHydration) {
      setHydrated(true);
      return;
    }

    if (hydrationAttempted.current) {
      return;
    }

    hydrationAttempted.current = true;

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
