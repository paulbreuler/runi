// Copyright (c) 2025 runi contributors
// SPDX-License-Identifier: MIT

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DriftReviewDrawer } from './DriftReviewDrawer';
import { useDriftReviewStore } from '@/stores/useDriftReviewStore';
import type { SpecRefreshResult } from '@/types/generated/SpecRefreshResult';

vi.mock('motion/react', () => ({
  motion: new Proxy({}, { get: (): string => 'div' }),
  useReducedMotion: vi.fn(() => false),
  AnimatePresence: ({ children }: { children: React.ReactNode }): React.JSX.Element => (
    <>{children}</>
  ),
}));

const makeResult = (
  removed: Array<{ method: string; path: string }> = [],
  changed: Array<{ method: string; path: string; changes: string[] }> = [],
  added: Array<{ method: string; path: string }> = []
): SpecRefreshResult => ({
  changed: removed.length > 0 || changed.length > 0 || added.length > 0,
  operationsRemoved: removed,
  operationsChanged: changed,
  operationsAdded: added,
});

describe('DriftReviewDrawer', () => {
  const collectionId = 'col_123';

  beforeEach(() => {
    useDriftReviewStore.setState({
      isOpen: false,
      collectionId: null,
      focusOperationKey: null,
      reviewState: {},
      dismissedBannerKeys: new Set(),
    });
  });

  it('renders nothing when isOpen is false', () => {
    const result = makeResult([{ method: 'DELETE', path: '/books/{id}' }], [], []);
    const { container } = render(
      <DriftReviewDrawer collectionId={collectionId} driftResult={result} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the drawer panel when open', () => {
    useDriftReviewStore.setState({
      isOpen: true,
      collectionId,
      focusOperationKey: null,
      reviewState: {},
      dismissedBannerKeys: new Set(),
    });
    const result = makeResult([{ method: 'DELETE', path: '/books/{id}' }], [], []);
    render(<DriftReviewDrawer collectionId={collectionId} driftResult={result} />);
    expect(screen.getByTestId('drift-review-drawer')).toBeInTheDocument();
  });

  it('renders REMOVED group first with correct cards', () => {
    useDriftReviewStore.setState({
      isOpen: true,
      collectionId,
      focusOperationKey: null,
      reviewState: {},
      dismissedBannerKeys: new Set(),
    });
    const result = makeResult(
      [
        { method: 'DELETE', path: '/books/{id}' },
        { method: 'DELETE', path: '/authors/{id}' },
      ],
      [{ method: 'PUT', path: '/books/{id}', changes: ['parameters'] }],
      [{ method: 'POST', path: '/books/{id}/reserve' }]
    );
    render(<DriftReviewDrawer collectionId={collectionId} driftResult={result} />);
    const groups = screen.getAllByTestId(/^drift-group-/);
    expect(groups.map((node) => node.getAttribute('data-test-id'))).toEqual([
      'drift-group-removed',
      'drift-group-changed',
      'drift-group-added',
    ]);
  });

  it('renders change cards with correct data-test-id attributes', () => {
    useDriftReviewStore.setState({
      isOpen: true,
      collectionId,
      focusOperationKey: null,
      reviewState: {},
      dismissedBannerKeys: new Set(),
    });
    const result = makeResult(
      [{ method: 'DELETE', path: '/books/{id}' }],
      [{ method: 'PUT', path: '/books/{id}', changes: ['parameters'] }],
      [{ method: 'POST', path: '/books/{id}/reserve' }]
    );
    render(<DriftReviewDrawer collectionId={collectionId} driftResult={result} />);
    expect(screen.getByTestId('drift-change-card-DELETE-/books/{id}')).toBeInTheDocument();
    expect(screen.getByTestId('drift-change-card-PUT-/books/{id}')).toBeInTheDocument();
    expect(screen.getByTestId('drift-change-card-POST-/books/{id}/reserve')).toBeInTheDocument();
  });

  it('has close button with correct data-test-id', () => {
    useDriftReviewStore.setState({
      isOpen: true,
      collectionId,
      focusOperationKey: null,
      reviewState: {},
      dismissedBannerKeys: new Set(),
    });
    const result = makeResult([{ method: 'DELETE', path: '/books/{id}' }], [], []);
    render(<DriftReviewDrawer collectionId={collectionId} driftResult={result} />);
    expect(screen.getByTestId('drift-drawer-close')).toBeInTheDocument();
  });

  it('closes drawer when close button is clicked', () => {
    useDriftReviewStore.setState({
      isOpen: true,
      collectionId,
      focusOperationKey: null,
      reviewState: {},
      dismissedBannerKeys: new Set(),
    });
    const result = makeResult([{ method: 'DELETE', path: '/books/{id}' }], [], []);
    render(<DriftReviewDrawer collectionId={collectionId} driftResult={result} />);
    fireEvent.click(screen.getByTestId('drift-drawer-close'));
    expect(useDriftReviewStore.getState().isOpen).toBe(false);
  });

  it('closes drawer on Escape key', () => {
    useDriftReviewStore.setState({
      isOpen: true,
      collectionId,
      focusOperationKey: null,
      reviewState: {},
      dismissedBannerKeys: new Set(),
    });
    const result = makeResult([{ method: 'DELETE', path: '/books/{id}' }], [], []);
    render(<DriftReviewDrawer collectionId={collectionId} driftResult={result} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(useDriftReviewStore.getState().isOpen).toBe(false);
  });

  it('closes drawer when backdrop is clicked', () => {
    useDriftReviewStore.setState({
      isOpen: true,
      collectionId,
      focusOperationKey: null,
      reviewState: {},
      dismissedBannerKeys: new Set(),
    });
    const result = makeResult([{ method: 'DELETE', path: '/books/{id}' }], [], []);
    render(<DriftReviewDrawer collectionId={collectionId} driftResult={result} />);
    fireEvent.click(screen.getByTestId('drift-drawer-backdrop'));
    expect(useDriftReviewStore.getState().isOpen).toBe(false);
  });

  it('Ignore button marks change as ignored', () => {
    useDriftReviewStore.setState({
      isOpen: true,
      collectionId,
      focusOperationKey: null,
      reviewState: {},
      dismissedBannerKeys: new Set(),
    });
    const result = makeResult([{ method: 'DELETE', path: '/books/{id}' }], [], []);
    render(<DriftReviewDrawer collectionId={collectionId} driftResult={result} />);
    fireEvent.click(screen.getByTestId('drift-change-ignore-DELETE-/books/{id}'));
    expect(
      useDriftReviewStore.getState().reviewState[`${collectionId}:DELETE:/books/{id}`]?.status
    ).toBe('ignored');
  });

  it('Accept button marks change as accepted', () => {
    useDriftReviewStore.setState({
      isOpen: true,
      collectionId,
      focusOperationKey: null,
      reviewState: {},
      dismissedBannerKeys: new Set(),
    });
    const result = makeResult([{ method: 'DELETE', path: '/books/{id}' }], [], []);
    render(<DriftReviewDrawer collectionId={collectionId} driftResult={result} />);
    fireEvent.click(screen.getByTestId('drift-change-accept-DELETE-/books/{id}'));
    expect(
      useDriftReviewStore.getState().reviewState[`${collectionId}:DELETE:/books/{id}`]?.status
    ).toBe('accepted');
  });

  it('has accept-all button with correct data-test-id', () => {
    useDriftReviewStore.setState({
      isOpen: true,
      collectionId,
      focusOperationKey: null,
      reviewState: {},
      dismissedBannerKeys: new Set(),
    });
    const result = makeResult([{ method: 'DELETE', path: '/books/{id}' }], [], []);
    render(<DriftReviewDrawer collectionId={collectionId} driftResult={result} />);
    expect(screen.getByTestId('drift-drawer-accept-all')).toBeInTheDocument();
  });

  it('has dismiss-all button with correct data-test-id', () => {
    useDriftReviewStore.setState({
      isOpen: true,
      collectionId,
      focusOperationKey: null,
      reviewState: {},
      dismissedBannerKeys: new Set(),
    });
    const result = makeResult([{ method: 'DELETE', path: '/books/{id}' }], [], []);
    render(<DriftReviewDrawer collectionId={collectionId} driftResult={result} />);
    expect(screen.getByTestId('drift-drawer-dismiss-all')).toBeInTheDocument();
  });

  it('accept-all marks all pending changes as accepted', () => {
    useDriftReviewStore.setState({
      isOpen: true,
      collectionId,
      focusOperationKey: null,
      reviewState: {},
      dismissedBannerKeys: new Set(),
    });
    const result = makeResult(
      [{ method: 'DELETE', path: '/books/{id}' }],
      [{ method: 'PUT', path: '/books/{id}', changes: ['parameters'] }],
      [{ method: 'POST', path: '/books' }]
    );
    render(<DriftReviewDrawer collectionId={collectionId} driftResult={result} />);
    fireEvent.click(screen.getByTestId('drift-drawer-accept-all'));
    const state = useDriftReviewStore.getState().reviewState;
    expect(state[`${collectionId}:DELETE:/books/{id}`]?.status).toBe('accepted');
    expect(state[`${collectionId}:PUT:/books/{id}`]?.status).toBe('accepted');
    expect(state[`${collectionId}:POST:/books`]?.status).toBe('accepted');
  });

  it('dismiss-all marks all pending changes as ignored', () => {
    useDriftReviewStore.setState({
      isOpen: true,
      collectionId,
      focusOperationKey: null,
      reviewState: {},
      dismissedBannerKeys: new Set(),
    });
    const result = makeResult(
      [{ method: 'DELETE', path: '/books/{id}' }],
      [{ method: 'PUT', path: '/books/{id}', changes: ['parameters'] }],
      []
    );
    render(<DriftReviewDrawer collectionId={collectionId} driftResult={result} />);
    fireEvent.click(screen.getByTestId('drift-drawer-dismiss-all'));
    const state = useDriftReviewStore.getState().reviewState;
    expect(state[`${collectionId}:DELETE:/books/{id}`]?.status).toBe('ignored');
    expect(state[`${collectionId}:PUT:/books/{id}`]?.status).toBe('ignored');
  });

  it('has proper ARIA role=dialog and aria-modal attributes', () => {
    useDriftReviewStore.setState({
      isOpen: true,
      collectionId,
      focusOperationKey: null,
      reviewState: {},
      dismissedBannerKeys: new Set(),
    });
    const result = makeResult([{ method: 'DELETE', path: '/books/{id}' }], [], []);
    render(<DriftReviewDrawer collectionId={collectionId} driftResult={result} />);
    const drawer = screen.getByTestId('drift-review-drawer');
    expect(drawer).toHaveAttribute('role', 'dialog');
    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(drawer).toHaveAttribute('tabindex', '-1');
  });

  it('hides reviewed (ignored) changes from the list', () => {
    useDriftReviewStore.setState({
      isOpen: true,
      collectionId,
      focusOperationKey: null,
      reviewState: {
        [`${collectionId}:DELETE:/books/{id}`]: { status: 'ignored' },
      },
      dismissedBannerKeys: new Set(),
    });
    const result = makeResult([{ method: 'DELETE', path: '/books/{id}' }], [], []);
    render(<DriftReviewDrawer collectionId={collectionId} driftResult={result} />);
    expect(screen.queryByTestId('drift-change-card-DELETE-/books/{id}')).toBeNull();
  });

  it('retains ignored state when drawer is closed and reopened', () => {
    useDriftReviewStore.setState({
      isOpen: true,
      collectionId,
      focusOperationKey: null,
      reviewState: {},
      dismissedBannerKeys: new Set(),
    });
    const result = makeResult([{ method: 'DELETE', path: '/books/{id}' }], [], []);
    const { unmount } = render(
      <DriftReviewDrawer collectionId={collectionId} driftResult={result} />
    );
    fireEvent.click(screen.getByTestId('drift-change-ignore-DELETE-/books/{id}'));
    unmount();

    // Close and reopen
    useDriftReviewStore.setState({ isOpen: false });
    useDriftReviewStore.setState({ isOpen: true });

    render(<DriftReviewDrawer collectionId={collectionId} driftResult={result} />);
    // Card should not appear since it was ignored
    expect(screen.queryByTestId('drift-change-card-DELETE-/books/{id}')).toBeNull();
  });
});
