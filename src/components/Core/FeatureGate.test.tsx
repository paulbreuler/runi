/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { ComponentType } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { FeatureGate } from './FeatureGate';
import { useFeatureFlagStore } from '@/stores/features/useFeatureFlagStore';
import type { FeatureState } from '@/stores/features/types';

// Mock the metadata module to control feature states in tests
vi.mock('@/stores/features/metadata', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const original = await importOriginal<typeof import('@/stores/features/metadata')>();
  return {
    ...original,
    FLAG_METADATA: {
      ...original.FLAG_METADATA,
      http: {
        ...original.FLAG_METADATA.http,
        // Override importBruno to be teaser for specific test
        importBruno: {
          ...original.FLAG_METADATA.http.importBruno,
          // Default to stable, individual tests can override via mockReturnValue
          get state(): FeatureState {
            return mockImportBrunoState;
          },
        },
      },
    },
  };
});

// Mutable state for the mock - controlled by tests
let mockImportBrunoState: FeatureState = 'stable';

describe('FeatureGate', () => {
  beforeEach(() => {
    useFeatureFlagStore.getState().resetToDefaults();
    // Reset mock state to default
    mockImportBrunoState = 'stable';
  });

  it('renders children when flag is enabled and interactive', () => {
    useFeatureFlagStore.getState().setFlag('http', 'collectionsEnabled', true);

    render(
      <FeatureGate layer="http" flag="collectionsEnabled">
        <div data-test-id="feature-gate-child">Allowed</div>
      </FeatureGate>
    );

    expect(screen.getByTestId('feature-gate-child')).toBeInTheDocument();
  });

  it('renders nothing when flag is disabled and no fallback is provided', () => {
    useFeatureFlagStore.getState().setFlag('http', 'collectionsEnabled', false);

    render(
      <FeatureGate layer="http" flag="collectionsEnabled">
        <div data-test-id="feature-gate-child">Blocked</div>
      </FeatureGate>
    );

    expect(screen.queryByTestId('feature-gate-child')).toBeNull();
    expect(screen.queryByTestId('feature-gate')).toBeNull();
  });

  it('renders fallback when flag is disabled', () => {
    useFeatureFlagStore.getState().setFlag('http', 'collectionsEnabled', false);

    render(
      <FeatureGate
        layer="http"
        flag="collectionsEnabled"
        fallback={<div data-test-id="feature-gate-fallback">Fallback</div>}
      >
        <div data-test-id="feature-gate-child">Blocked</div>
      </FeatureGate>
    );

    expect(screen.getByTestId('feature-gate-fallback')).toBeInTheDocument();
  });

  it('renders fallback for teaser state even when enabled', () => {
    // Set mock state to teaser for this test
    mockImportBrunoState = 'teaser';

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
    mockImportBrunoState = 'experimental';
    useFeatureFlagStore.getState().setFlag('http', 'importBruno', true);

    render(
      <FeatureGate layer="http" flag="importBruno">
        <div data-test-id="feature-gate-child">Experimental</div>
      </FeatureGate>
    );

    expect(screen.getByTestId('feature-gate-child')).toBeInTheDocument();
    expect(screen.getByTestId('feature-gate-badge')).toBeInTheDocument();
  });

  it('omits badge when showBadge is false', () => {
    mockImportBrunoState = 'experimental';
    useFeatureFlagStore.getState().setFlag('http', 'importBruno', true);

    render(
      <FeatureGate layer="http" flag="importBruno" showBadge={false}>
        <div data-test-id="feature-gate-child">Experimental</div>
      </FeatureGate>
    );

    expect(screen.getByTestId('feature-gate-child')).toBeInTheDocument();
    expect(screen.queryByTestId('feature-gate-badge')).toBeNull();
  });

  it('accepts a custom badge component', () => {
    mockImportBrunoState = 'experimental';
    useFeatureFlagStore.getState().setFlag('http', 'importBruno', true);

    const CustomBadge: ComponentType<{ state: FeatureState }> = ({ state }) => (
      <div data-test-id="custom-badge">{state}</div>
    );

    render(
      <FeatureGate layer="http" flag="importBruno" BadgeComponent={CustomBadge}>
        <div data-test-id="feature-gate-child">Experimental</div>
      </FeatureGate>
    );

    expect(screen.getByTestId('custom-badge')).toBeInTheDocument();
  });
});
