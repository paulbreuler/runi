/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPanel } from './SettingsPanel';
import { DEFAULT_SETTINGS } from '@/types/settings-defaults';

describe('SettingsPanel', () => {
  it('renders when open', () => {
    render(<SettingsPanel isOpen />);
    expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<SettingsPanel isOpen={false} />);
    expect(screen.queryByTestId('settings-panel')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<SettingsPanel isOpen onClose={onClose} />);

    await user.click(screen.getByTestId('settings-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders all tab buttons', () => {
    render(<SettingsPanel isOpen />);

    expect(screen.getByTestId('settings-tab-general')).toBeInTheDocument();
    expect(screen.getByTestId('settings-tab-features')).toBeInTheDocument();
    expect(screen.getByTestId('settings-tab-mcp')).toBeInTheDocument();
    expect(screen.getByTestId('settings-tab-about')).toBeInTheDocument();
  });

  it('resets to defaults and notifies consumer', async () => {
    const onSettingsChange = vi.fn();
    const user = userEvent.setup();
    const customSettings = {
      ...DEFAULT_SETTINGS,
      http: { ...DEFAULT_SETTINGS.http, timeout: 12345 },
    };

    render(
      <SettingsPanel isOpen initialSettings={customSettings} onSettingsChange={onSettingsChange} />
    );

    await user.click(screen.getByTestId('settings-reset'));
    expect(onSettingsChange).toHaveBeenCalled();
    const calls = onSettingsChange.mock.calls;
    const lastCall = calls[calls.length - 1]?.[0];
    expect(lastCall).toEqual(DEFAULT_SETTINGS);
  });

  it('toggles JSON mode', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel isOpen />);

    await user.click(screen.getByTestId('settings-json-toggle'));
    expect(screen.getByTestId('settings-json-editor')).toBeInTheDocument();
  });

  it('applies valid JSON updates', async () => {
    const user = userEvent.setup();
    const onSettingsChange = vi.fn();

    render(<SettingsPanel isOpen onSettingsChange={onSettingsChange} />);

    await user.click(screen.getByTestId('settings-json-toggle'));
    const editor = screen.getByTestId('settings-json-editor');

    fireEvent.change(editor, { target: { value: '{"http":{"timeout":1000}}' } });

    expect(onSettingsChange).toHaveBeenCalled();
    const calls = onSettingsChange.mock.calls;
    const lastCall = calls[calls.length - 1]?.[0];
    expect(lastCall.http.timeout).toBe(1000);
  });

  it('shows error on invalid JSON', async () => {
    const user = userEvent.setup();
    const onSettingsChange = vi.fn();

    render(<SettingsPanel isOpen onSettingsChange={onSettingsChange} />);

    await user.click(screen.getByTestId('settings-json-toggle'));
    const editor = screen.getByTestId('settings-json-editor');

    fireEvent.change(editor, { target: { value: '{' } });

    expect(screen.getByTestId('settings-json-error')).toBeInTheDocument();
  });
});
