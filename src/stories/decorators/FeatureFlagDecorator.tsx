/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Decorator } from '@storybook/react';
import type { FeatureFlags, DeepPartial } from '@/stores/features/types';
import { FeatureFlagProvider } from '@/providers/FeatureFlagProvider';

export interface FeatureFlagDecoratorArgs {
  featureFlags?: DeepPartial<FeatureFlags>;
}

export const FeatureFlagDecorator: Decorator = (Story, context) => {
  const { featureFlags } = context.args as FeatureFlagDecoratorArgs;

  return (
    <FeatureFlagProvider skipHydration overrides={featureFlags}>
      <Story />
    </FeatureFlagProvider>
  );
};
