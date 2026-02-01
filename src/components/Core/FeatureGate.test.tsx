/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { ComponentType } from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { FeatureGate } from './FeatureGate';
import { useFeatureFlagStore } from '@/stores/features/useFeatureFlagStore';
import { FLAG_METADATA } from '@/stores/features/metadata';
import type { FeatureState } from '@/stores/features/types';

const originalImportBrunoState = FLAG_METADATA.http.importBruno.state;

describe('FeatureGate', () => {
  beforeEach(() => {
    useFeatureFlagStore.getState().resetToDefaults();
  });

  afterEach(() => {
    FLAG_METADATA.http.importBruno.state = originalImportBrunoState;
  });

  it('renders children when flag is enabled and interactive', () => {
    render(
      <FeatureGate layer="http" flag="importBruno">
        <div data-test-id="feature-gate-child">Allowed</div>
      </FeatureGate>
    );

    expect(screen.getByTestId('feature-gate-child')).toBeInTheDocument();
  });

  it('renders nothing when flag is disabled and no fallback is provided', () => {
    useFeatureFlagStore.getState().setFlag('http', 'importBruno', false);

    render(
      <FeatureGate layer="http" flag="importBruno">
        <div data-test-id="feature-gate-child">Blocked</div>
      </FeatureGate>
    );

    expect(screen.queryByTestId('feature-gate-child')).toBeNull();
    expect(screen.queryByTestId('feature-gate')).toBeNull();
  });

  it('renders fallback when flag is disabled', () => {
    useFeatureFlagStore.getState().setFlag('http', 'importBruno', false);

    render(
      <FeatureGate
        layer="http"
        flag="importBruno"
        fallback={<div data-test-id="feature-gate-fallback">Fallback</div>}
      >
        <div data-test-id="feature-gate-child">Blocked</div>
      </FeatureGate>
    );

    expect(screen.getByTestId('feature-gate-fallback')).toBeInTheDocument();
  });

  it('renders fallback for teaser state even when enabled', () => {
    FLAG_METADATA.http.importBruno.state = 'teaser';

    render(
      <FeatureGate
        layer="http"
        flag="importBruno"
        fallback={<div data-test-id="feature-gate-fallback">Teaser</div>}
      >
        <div data-test-id="feature-gate-child">Child</div>
      </FeatureGate>
    );

    expect(screen.getByTestId('feature-gate-fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('feature-gate-child')).toBeNull();
  });

  it('renders children with badge for experimental state', () => {
    useFeatureFlagStore.getState().setFlag('canvas', 'enabled', true);

    render(
      <FeatureGate layer="canvas" flag="enabled">
        <div data-test-id="feature-gate-child">Experimental</div>
      </FeatureGate>
    );

    expect(screen.getByTestId('feature-gate-child')).toBeInTheDocument();
    expect(screen.getByTestId('feature-gate-badge')).toBeInTheDocument();
  });

  it('omits badge when showBadge is false', () => {
    useFeatureFlagStore.getState().setFlag('canvas', 'enabled', true);

    render(
      <FeatureGate layer="canvas" flag="enabled" showBadge={false}>
        <div data-test-id="feature-gate-child">Experimental</div>
      </FeatureGate>
    );

    expect(screen.getByTestId('feature-gate-child')).toBeInTheDocument();
    expect(screen.queryByTestId('feature-gate-badge')).toBeNull();
  });

  it('accepts a custom badge component', () => {
    useFeatureFlagStore.getState().setFlag('canvas', 'enabled', true);

    const CustomBadge: ComponentType<{ state: FeatureState }> = ({ state }) => (
      <div data-test-id="custom-badge">{state}</div>
    );

    render(
      <FeatureGate layer="canvas" flag="enabled" BadgeComponent={CustomBadge}>
        <div data-test-id="feature-gate-child">Experimental</div>
      </FeatureGate>
    );

    expect(screen.getByTestId('custom-badge')).toBeInTheDocument();
  });
});
