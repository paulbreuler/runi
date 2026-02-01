/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { ComponentType, ReactNode } from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import type { FeatureFlags, FeatureState } from '@/stores/features/types';

interface DefaultBadgeProps {
  state: FeatureState;
}

const DefaultExperimentalBadge = ({ state }: DefaultBadgeProps): React.JSX.Element | null => {
  if (state !== 'experimental') {
    return null;
  }

  return (
    <div
      className="absolute -top-2 -right-2 rounded-full border border-signal-warning/30 bg-signal-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-signal-warning"
      data-test-id="feature-gate-badge"
    >
      Experimental
    </div>
  );
};

export interface FeatureGateProps<L extends keyof FeatureFlags> {
  layer: L;
  flag: keyof FeatureFlags[L];
  children: ReactNode;
  fallback?: ReactNode;
  showBadge?: boolean;
  BadgeComponent?: ComponentType<{ state: FeatureState }>;
}

export const FeatureGate = <L extends keyof FeatureFlags>({
  layer,
  flag,
  children,
  fallback,
  showBadge = true,
  BadgeComponent,
}: FeatureGateProps<L>): React.JSX.Element | null => {
  const { enabled, state, isVisible, isInteractive } = useFeatureFlag(layer, flag);

  if (!isVisible) {
    return null;
  }

  if (!enabled || !isInteractive) {
    if (fallback !== undefined && fallback !== null) {
      return <>{fallback}</>;
    }
    return null;
  }

  const Badge = BadgeComponent ?? DefaultExperimentalBadge;
  const shouldShowBadge = showBadge && state === 'experimental';

  return (
    <div className="relative inline-flex" data-test-id="feature-gate">
      {shouldShowBadge && <Badge state={state} />}
      {children}
    </div>
  );
};
