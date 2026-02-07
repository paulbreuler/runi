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
  it('renders only stable/visible feature flags', () => {
    render(<FeaturesTab />);

    expect(screen.getByTestId('feature-flag-http-collectionsEnabled')).toBeInTheDocument();
  });

  it('hides hidden feature flags', () => {
    render(<FeaturesTab />);

    expect(screen.queryByTestId('feature-flag-http-importBruno')).not.toBeInTheDocument();
    expect(screen.queryByTestId('feature-flag-canvas-connectionLines')).not.toBeInTheDocument();
  });

  it('toggles interactive flags via setFlag', async () => {
    const user = userEvent.setup();
    render(<FeaturesTab />);

    await user.click(screen.getByTestId('feature-toggle-http-collectionsEnabled'));
    expect(setFlagMock).toHaveBeenCalledWith('http', 'collectionsEnabled', false);
  });
});
