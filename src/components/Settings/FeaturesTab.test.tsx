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
    expect(screen.queryByTestId('feature-flag-canvas-connectionLines')).not.toBeInTheDocument();
  });

  it('toggles flags via setFlag', async () => {
    const user = userEvent.setup();
    render(<FeaturesTab />);

    await user.click(screen.getByTestId('feature-toggle-http-importBruno'));
    expect(setFlagMock).toHaveBeenCalledWith('http', 'importBruno', false);
  });
});
