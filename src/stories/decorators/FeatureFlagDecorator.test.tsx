/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { ReactElement } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { StoryContext } from '@storybook/react';
import { FeatureFlagDecorator } from './FeatureFlagDecorator';
import { FeatureGate } from '@/components/Core/FeatureGate';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useFeatureFlagStore } from '@/stores/features/useFeatureFlagStore';

const renderDecorator = (args: Record<string, unknown>): void => {
  const Story = (): ReactElement => {
    const { enabled: canvasEnabled } = useFeatureFlag('canvas', 'enabled');
    const { enabled: importBruno } = useFeatureFlag('http', 'importBruno');
    return (
      <div>
        <span data-test-id="canvas-enabled">{canvasEnabled ? 'on' : 'off'}</span>
        <span data-test-id="import-bruno">{importBruno ? 'on' : 'off'}</span>
        <FeatureGate layer="canvas" flag="enabled" fallback={<div data-test-id="fallback" />}>
          <div data-test-id="gated-child" />
        </FeatureGate>
      </div>
    );
  };

  const rendered = FeatureFlagDecorator(Story, {
    args,
  } as unknown as StoryContext) as ReactElement;
  render(rendered);
};

describe('FeatureFlagDecorator', () => {
  beforeEach(() => {
    useFeatureFlagStore.getState().resetToDefaults();
  });

  it('provides flag overrides to children', async () => {
    renderDecorator({ featureFlags: { canvas: { enabled: true } } });
    await waitFor(() => {
      expect(screen.getByTestId('canvas-enabled')).toHaveTextContent('on');
    });
  });

  it('merges overrides with defaults', async () => {
    renderDecorator({ featureFlags: { canvas: { enabled: true } } });
    await waitFor(() => {
      expect(screen.getByTestId('import-bruno')).toHaveTextContent('on');
    });
  });

  it('works with FeatureGate', async () => {
    renderDecorator({ featureFlags: { canvas: { enabled: true } } });
    await waitFor(() => {
      expect(screen.getByTestId('gated-child')).toBeInTheDocument();
    });
  });
});
