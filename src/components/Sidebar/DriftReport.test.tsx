/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DriftReport } from './DriftReport';
import type { SpecRefreshResult } from '@/types/generated/SpecRefreshResult';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const noChangeResult: SpecRefreshResult = {
  changed: false,
  operationsAdded: [],
  operationsRemoved: [],
  operationsChanged: [],
};

const changedResult: SpecRefreshResult = {
  changed: true,
  operationsAdded: [
    { method: 'POST', path: '/users' },
    { method: 'GET', path: '/users/{id}/avatar' },
  ],
  operationsRemoved: [{ method: 'DELETE', path: '/users/{id}' }],
  operationsChanged: [
    { method: 'GET', path: '/users', changes: ['parameters', 'response schema'] },
    { method: 'PUT', path: '/users/{id}', changes: ['request body'] },
  ],
};

describe('DriftReport', () => {
  const onDismiss = vi.fn();
  const onAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when result has no changes', () => {
    const { container } = render(
      <DriftReport result={noChangeResult} onDismiss={onDismiss} onAction={onAction} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders drift report when changes detected', () => {
    render(<DriftReport result={changedResult} onDismiss={onDismiss} onAction={onAction} />);

    expect(screen.getByTestId('drift-report')).toBeInTheDocument();
  });

  it('shows summary with correct counts', () => {
    render(<DriftReport result={changedResult} onDismiss={onDismiss} onAction={onAction} />);

    const summary = screen.getByTestId('drift-report-summary');
    expect(summary).toHaveTextContent('1 breaking');
    expect(summary).toHaveTextContent('2 warnings');
  });

  it('renders removed operations as breaking cards', () => {
    render(<DriftReport result={changedResult} onDismiss={onDismiss} onAction={onAction} />);

    const cards = screen.getAllByTestId('drift-action-card');
    // 1 removed + 2 changed + 2 added = 5 cards
    expect(cards.length).toBe(5);
  });

  it('renders added operations as info cards', () => {
    render(<DriftReport result={changedResult} onDismiss={onDismiss} onAction={onAction} />);

    // Check that we see the added endpoint paths (may appear in multiple cards)
    const allPaths = screen.getAllByTestId('drift-path');
    const pathTexts = allPaths.map((el) => el.textContent);
    expect(pathTexts).toContain('/users');
    expect(pathTexts).toContain('/users/{id}/avatar');
  });

  it('renders changed operations as warning cards', () => {
    render(<DriftReport result={changedResult} onDismiss={onDismiss} onAction={onAction} />);

    // Check that change descriptions include the changes list
    expect(screen.getByText(/parameters, response schema/)).toBeInTheDocument();
    expect(screen.getByText(/request body/)).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button clicked', async () => {
    render(<DriftReport result={changedResult} onDismiss={onDismiss} onAction={onAction} />);

    await userEvent.click(screen.getByTestId('drift-report-dismiss'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onAction when a card action is clicked', async () => {
    render(<DriftReport result={changedResult} onDismiss={onDismiss} onAction={onAction} />);

    // Click the first ignore button
    const ignoreButtons = screen.getAllByTestId('drift-action-ignore');
    const firstIgnoreButton = ignoreButtons[0];
    expect(firstIgnoreButton).toBeDefined();
    await userEvent.click(firstIgnoreButton!);

    expect(onAction).toHaveBeenCalledWith('ignore');
  });
});
