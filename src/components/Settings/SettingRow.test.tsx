/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingRow } from './SettingRow';
import { SETTINGS_SCHEMA } from '@/types/settings-meta';

describe('SettingRow', () => {
  it('renders boolean setting and toggles via switch', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <SettingRow
        category="http"
        settingKey="followRedirects"
        schema={SETTINGS_SCHEMA.http.followRedirects}
        value={true}
        onChange={onChange}
        categoryKey="http"
      />
    );

    expect(screen.getByText('Follow Redirects')).toBeInTheDocument();

    await user.click(screen.getByTestId('setting-http-followRedirects'));
    expect(onChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it('shows validation error for invalid number input', async () => {
    const onChange = vi.fn();

    render(
      <SettingRow
        category="http"
        settingKey="timeout"
        schema={SETTINGS_SCHEMA.http.timeout}
        value={30000}
        onChange={onChange}
        categoryKey="http"
      />
    );

    const input = screen.getByTestId('setting-http-timeout');
    fireEvent.change(input, { target: { value: '0' } });

    expect(await screen.findByText(/Minimum/i)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalledWith(0);
  });
});
