/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 *
 * Integration-style keyboard tests for PanelTabs using REAL Base UI Tabs.
 * Mocks only motion/react so we test actual focus and arrow-key behavior.
 * These tests FAIL if keyboard navigation is broken.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PanelTabs } from './PanelTabs';

// Mock only motion/react so we test real Base UI and real keyboard handler
vi.mock('motion/react', () => ({
  motion: {
    button: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>): React.JSX.Element => (
      <button {...props}>{children}</button>
    ),
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>): React.JSX.Element => (
      <div {...props}>{children}</div>
    ),
  },
  LayoutGroup: ({ children }: React.PropsWithChildren<object>): React.JSX.Element => (
    <>{children}</>
  ),
  useReducedMotion: (): boolean => false,
}));

describe('PanelTabs keyboard (integration)', () => {
  const onTabChange = vi.fn();

  beforeEach(() => {
    onTabChange.mockClear();
  });

  it('Arrow Right moves focus to Console tab and activates it', async () => {
    const user = userEvent.setup();
    render(<PanelTabs activeTab="network" onTabChange={onTabChange} />);

    const networkTab = screen.getByTestId('panel-tab-network');
    const consoleTab = screen.getByTestId('panel-tab-console');

    await user.click(networkTab);
    expect(networkTab).toHaveFocus();

    await user.keyboard('{ArrowRight}');

    expect(consoleTab).toHaveFocus();
    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('console');
  });

  it('Arrow Left moves focus to Network tab and activates it', async () => {
    const user = userEvent.setup();
    render(<PanelTabs activeTab="console" onTabChange={onTabChange} />);

    const networkTab = screen.getByTestId('panel-tab-network');
    const consoleTab = screen.getByTestId('panel-tab-console');

    await user.click(consoleTab);
    expect(consoleTab).toHaveFocus();

    await user.keyboard('{ArrowLeft}');

    expect(networkTab).toHaveFocus();
    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('network');
  });

  it('Arrow Right from Network then Arrow Left returns to Network', async () => {
    const user = userEvent.setup();
    render(<PanelTabs activeTab="network" onTabChange={onTabChange} />);

    const networkTab = screen.getByTestId('panel-tab-network');
    const consoleTab = screen.getByTestId('panel-tab-console');

    await user.click(networkTab);
    await user.keyboard('{ArrowRight}');
    expect(consoleTab).toHaveFocus();
    expect(onTabChange).toHaveBeenLastCalledWith('console');

    await user.keyboard('{ArrowLeft}');
    expect(networkTab).toHaveFocus();
    expect(onTabChange).toHaveBeenLastCalledWith('network');
  });

  it('only active tab is in tab order (Tab moves focus out of list)', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button" data-testid="before">
          Before
        </button>
        <PanelTabs activeTab="network" onTabChange={onTabChange} />
        <button type="button" data-testid="after">
          After
        </button>
      </div>
    );

    const before = screen.getByTestId('before');
    const networkTab = screen.getByTestId('panel-tab-network');
    const after = screen.getByTestId('after');

    await user.click(before);
    expect(before).toHaveFocus();

    await user.tab();
    expect(networkTab).toHaveFocus();

    await user.tab();
    expect(after).toHaveFocus();
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it('Enter activates focused tab', async () => {
    const user = userEvent.setup();
    render(<PanelTabs activeTab="network" onTabChange={onTabChange} />);

    const networkTab = screen.getByTestId('panel-tab-network');
    const consoleTab = screen.getByTestId('panel-tab-console');

    await user.click(networkTab);
    await user.keyboard('{ArrowRight}');
    expect(consoleTab).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(onTabChange).toHaveBeenCalled();
    expect(onTabChange.mock.calls[0][0]).toBe('console');
  });
});
