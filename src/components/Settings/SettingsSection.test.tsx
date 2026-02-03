/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsSection } from './SettingsSection';
import { DEFAULT_SETTINGS } from '@/types/settings-defaults';

describe('SettingsSection', () => {
  it('toggles expansion for non-default sections', async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();

    render(
      <SettingsSection
        category="storage"
        settings={DEFAULT_SETTINGS}
        onUpdate={onUpdate}
        searchResults={null}
      />
    );

    expect(screen.queryByTestId('setting-row-storage-autoSave')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('settings-section-toggle-storage'));
    expect(screen.getByTestId('setting-row-storage-autoSave')).toBeInTheDocument();
  });

  it('invokes onUpdate when a setting changes', async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();

    render(
      <SettingsSection
        category="storage"
        settings={DEFAULT_SETTINGS}
        onUpdate={onUpdate}
        searchResults={null}
      />
    );

    await user.click(screen.getByTestId('settings-section-toggle-storage'));
    await user.click(screen.getByTestId('setting-storage-autoSave'));

    expect(onUpdate).not.toHaveBeenCalled();
  });
});
