// Copyright (c) 2025 runi contributors
// SPDX-License-Identifier: MIT

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DriftContextBanner } from './DriftContextBanner';
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

describe('DriftContextBanner', () => {
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

  it('returns null when driftResult is undefined', () => {
    const { container } = render(
      <DriftContextBanner
        collectionId={collectionId}
        method="DELETE"
        path="/books/{id}"
        driftResult={undefined}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when operation is not in any drift group', () => {
    const result = makeResult([{ method: 'DELETE', path: '/authors/{id}' }], [], []);
    const { container } = render(
      <DriftContextBanner
        collectionId={collectionId}
        method="GET"
        path="/books"
        driftResult={result}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when operation is only in added group (not removal or change)', () => {
    const result = makeResult([], [], [{ method: 'POST', path: '/books/{id}/reserve' }]);
    const { container } = render(
      <DriftContextBanner
        collectionId={collectionId}
        method="POST"
        path="/books/{id}/reserve"
        driftResult={result}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows red banner for a removed operation', () => {
    const result = makeResult([{ method: 'DELETE', path: '/books/{id}' }], [], []);
    render(
      <DriftContextBanner
        collectionId={collectionId}
        method="DELETE"
        path="/books/{id}"
        driftResult={result}
      />
    );
    const banner = screen.getByTestId('drift-context-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('removed');
  });

  it('shows amber banner for a changed operation', () => {
    const result = makeResult(
      [],
      [{ method: 'PUT', path: '/books/{id}', changes: ['parameters', 'responses'] }],
      []
    );
    render(
      <DriftContextBanner
        collectionId={collectionId}
        method="PUT"
        path="/books/{id}"
        driftResult={result}
      />
    );
    const banner = screen.getByTestId('drift-context-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('Spec change');
    expect(banner).toHaveTextContent('parameters, responses');
  });

  it('has Review and Dismiss buttons', () => {
    const result = makeResult([{ method: 'DELETE', path: '/books/{id}' }], [], []);
    render(
      <DriftContextBanner
        collectionId={collectionId}
        method="DELETE"
        path="/books/{id}"
        driftResult={result}
      />
    );
    expect(screen.getByTestId('drift-banner-review')).toBeInTheDocument();
    expect(screen.getByTestId('drift-banner-dismiss')).toBeInTheDocument();
  });

  it('Dismiss button hides the banner for the session', () => {
    const result = makeResult([{ method: 'DELETE', path: '/books/{id}' }], [], []);
    render(
      <DriftContextBanner
        collectionId={collectionId}
        method="DELETE"
        path="/books/{id}"
        driftResult={result}
      />
    );
    fireEvent.click(screen.getByTestId('drift-banner-dismiss'));
    expect(screen.queryByTestId('drift-context-banner')).toBeNull();
    expect(
      useDriftReviewStore.getState().dismissedBannerKeys.has(`${collectionId}:DELETE:/books/{id}`)
    ).toBe(true);
  });

  it('does not show banner for dismissed key', () => {
    const bannerKey = `${collectionId}:DELETE:/books/{id}`;
    useDriftReviewStore.setState({
      isOpen: false,
      collectionId: null,
      focusOperationKey: null,
      reviewState: {},
      dismissedBannerKeys: new Set([bannerKey]),
    });
    const result = makeResult([{ method: 'DELETE', path: '/books/{id}' }], [], []);
    const { container } = render(
      <DriftContextBanner
        collectionId={collectionId}
        method="DELETE"
        path="/books/{id}"
        driftResult={result}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('Review button opens drawer with focusOperationKey', () => {
    const result = makeResult([{ method: 'DELETE', path: '/books/{id}' }], [], []);
    render(
      <DriftContextBanner
        collectionId={collectionId}
        method="DELETE"
        path="/books/{id}"
        driftResult={result}
      />
    );
    fireEvent.click(screen.getByTestId('drift-banner-review'));
    const state = useDriftReviewStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.focusOperationKey).toBe(`${collectionId}:DELETE:/books/{id}`);
  });

  it('does not show banner when the change has already been accepted', () => {
    useDriftReviewStore.setState({
      isOpen: false,
      collectionId: null,
      focusOperationKey: null,
      reviewState: {
        [`${collectionId}:DELETE:/books/{id}`]: { status: 'accepted' },
      },
      dismissedBannerKeys: new Set(),
    });
    const result = makeResult([{ method: 'DELETE', path: '/books/{id}' }], [], []);
    const { container } = render(
      <DriftContextBanner
        collectionId={collectionId}
        method="DELETE"
        path="/books/{id}"
        driftResult={result}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
