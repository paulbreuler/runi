/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { ReactElement } from 'react';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/utils/cn';
import { useFeatureFlags, useFeatureFlagActions } from '@/hooks/useFeatureFlag';
import { FLAG_METADATA } from '@/stores/features/metadata';
import type { FeatureFlags, FeatureState } from '@/stores/features/types';
import { isFeatureInteractive, isFeatureVisible } from '@/stores/features/types';

const LAYER_LABELS: Record<keyof FeatureFlags, string> = {
  http: 'HTTP Client',
  canvas: 'Spatial Canvas',
  comprehension: 'Comprehension',
  ai: 'AI-Native',
  debug: 'Debug',
};

const humanizeFlag = (value: string): string =>
  value
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());

const stateBadgeClasses: Record<FeatureState, string> = {
  hidden: 'bg-border-subtle text-fg-muted',
  teaser: 'bg-amber-3 text-amber-11',
  experimental: 'bg-amber-3 text-amber-11',
  stable: 'bg-border-subtle text-fg-muted',
};

export function FeaturesTab(): ReactElement {
  const flags = useFeatureFlags();
  const { setFlag } = useFeatureFlagActions();

  return (
    <div className="flex flex-col" data-test-id="settings-features-tab">
      {(Object.keys(FLAG_METADATA) as Array<keyof FeatureFlags>).map((layer) => {
        const entries = Object.entries(FLAG_METADATA[layer]).filter(([, meta]) =>
          isFeatureVisible(meta.state)
        );

        if (entries.length === 0) {
          return null;
        }

        return (
          <section
            key={layer}
            className="border-b border-border-subtle last:border-b-0"
            data-test-id={`feature-section-${layer}`}
          >
            <div className="px-4 py-3 flex items-center gap-2">
              <span className="text-fg-muted text-xs font-semibold tracking-wide uppercase">
                {LAYER_LABELS[layer]}
              </span>
              <span className="text-xs text-fg-muted/70">
                {entries.length} flag{entries.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="px-4 pb-2 space-y-2">
              {entries.map(([flagKey, meta]) => {
                const enabled = flags[layer][
                  flagKey as keyof FeatureFlags[typeof layer]
                ] as boolean;
                const interactive = isFeatureInteractive(meta.state);
                const label = humanizeFlag(flagKey);

                return (
                  <div
                    key={flagKey}
                    className="flex items-start justify-between gap-4 py-2 px-2 -mx-2 rounded-lg transition-colors hover:bg-bg-raised/50"
                    data-test-id={`feature-flag-${layer}-${flagKey}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-fg-default font-medium">{label}</span>
                        {meta.state !== 'stable' && (
                          <span
                            className={cn(
                              'text-xs font-medium px-1.5 py-0.5 rounded-full',
                              stateBadgeClasses[meta.state]
                            )}
                          >
                            {meta.state === 'teaser' ? 'Coming soon' : meta.state}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-fg-muted mt-0.5">{meta.description}</p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => {
                        setFlag(layer, flagKey as keyof FeatureFlags[typeof layer], checked);
                      }}
                      disabled={!interactive}
                      data-test-id={`feature-toggle-${layer}-${flagKey}`}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
