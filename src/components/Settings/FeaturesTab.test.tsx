/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeaturesTab } from './FeaturesTab';
import { DEFAULT_FLAGS } from '@/stores/features/defaults';

const setFlagMock = vi.fn();

vi.mock('@/hooks/useFeatureFlag', () => ({
  useFeatureFlags: (): typeof DEFAULT_FLAGS => DEFAULT_FLAGS,
  useFeatureFlagActions: (): {
    setFlag: typeof setFlagMock;
    hydrateFlags: ReturnType<typeof vi.fn>;
    resetToDefaults: ReturnType<typeof vi.fn>;
  } => ({
    setFlag: setFlagMock,
    hydrateFlags: vi.fn(),
    resetToDefaults: vi.fn(),
  }),
}));

describe('FeaturesTab', () => {
  it('renders visible feature flags and hides hidden ones', () => {
    render(<FeaturesTab />);

    expect(screen.getByTestId('feature-flag-http-importBruno')).toBeInTheDocument();
    expect(screen.getByTestId('feature-flag-canvas-connectionLines')).toBeInTheDocument();
  });

  it('disables toggles for teaser flags', () => {
    render(<FeaturesTab />);

    expect(screen.getByTestId('feature-toggle-http-importBruno')).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  it('toggles interactive flags via setFlag', async () => {
    const user = userEvent.setup();
    render(<FeaturesTab />);

    await user.click(screen.getByTestId('feature-toggle-http-collectionsEnabled'));
    expect(setFlagMock).toHaveBeenCalledWith('http', 'collectionsEnabled', true);
  });
});
