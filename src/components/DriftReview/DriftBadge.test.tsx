// Copyright (c) 2025 runi contributors
// SPDX-License-Identifier: MIT

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DriftBadge } from './DriftBadge';
import { useDriftReviewStore } from '@/stores/useDriftReviewStore';
import type { SpecRefreshResult } from '@/types/generated/SpecRefreshResult';

vi.mock('motion/react', () => ({
  motion: new Proxy({}, { get: (): string => 'div' }),
  useReducedMotion: vi.fn(() => false),
  AnimatePresence: ({ children }: { children: React.ReactNode }): React.JSX.Element => (
    <>{children}</>
  ),
}));

const makeResult = (removed: number, changed: number, added: number): SpecRefreshResult => ({
  changed: removed > 0 || changed > 0 || added > 0,
  operationsRemoved: Array.from({ length: removed }, (_, i) => ({
    method: 'DELETE',
    path: `/removed-${String(i)}`,
  })),
  operationsChanged: Array.from({ length: changed }, (_, i) => ({
    method: 'PUT',
    path: `/changed-${String(i)}`,
    changes: ['parameters'],
  })),
  operationsAdded: Array.from({ length: added }, (_, i) => ({
    method: 'POST',
    path: `/added-${String(i)}`,
  })),
});

describe('DriftBadge', () => {
  const collectionId = 'col_123';
  const collectionName = 'Bookshelf API';

  beforeEach(() => {
    useDriftReviewStore.setState({
      isOpen: false,
      collectionId: null,
      focusOperationKey: null,
      reviewState: {},
      dismissedBannerKeys: new Set(),
    });
  });

  it('renders nothing when driftResult is undefined', () => {
    const { container } = render(
      <DriftBadge
        collectionId={collectionId}
        collectionName={collectionName}
        driftResult={undefined}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when driftResult.changed is false', () => {
    const result: SpecRefreshResult = {
      changed: false,
      operationsRemoved: [],
      operationsChanged: [],
      operationsAdded: [],
    };
    const { container } = render(
      <DriftBadge
        collectionId={collectionId}
        collectionName={collectionName}
        driftResult={result}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the badge container with correct data-test-id', () => {
    const result = makeResult(4, 1, 2);
    render(
      <DriftBadge
        collectionId={collectionId}
        collectionName={collectionName}
        driftResult={result}
      />
    );
    expect(screen.getByTestId(`drift-badge-${collectionId}`)).toBeInTheDocument();
  });

  it('renders version range text when versions are provided as props', () => {
    const result = makeResult(4, 1, 2);
    render(
      <DriftBadge
        collectionId={collectionId}
        collectionName={collectionName}
        driftResult={result}
        fromVersion="v0.1.0"
        toVersion="v0.2.0"
      />
    );
    expect(screen.getByTestId(`drift-badge-${collectionId}`)).toHaveTextContent('v0.1.0');
    expect(screen.getByTestId(`drift-badge-${collectionId}`)).toHaveTextContent('v0.2.0');
  });

  it('renders red breaking count chip when there are removed operations', () => {
    const result = makeResult(4, 0, 0);
    render(
      <DriftBadge
        collectionId={collectionId}
        collectionName={collectionName}
        driftResult={result}
      />
    );
    const chip = screen.getByTestId(`drift-badge-breaking-${collectionId}`);
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveTextContent('4');
  });

  it('does not render breaking chip when no removed operations', () => {
    const result = makeResult(0, 2, 0);
    render(
      <DriftBadge
        collectionId={collectionId}
        collectionName={collectionName}
        driftResult={result}
      />
    );
    expect(screen.queryByTestId(`drift-badge-breaking-${collectionId}`)).toBeNull();
  });

  it('renders amber warning count chip when there are changed operations', () => {
    const result = makeResult(0, 2, 0);
    render(
      <DriftBadge
        collectionId={collectionId}
        collectionName={collectionName}
        driftResult={result}
      />
    );
    const chip = screen.getByTestId(`drift-badge-warning-${collectionId}`);
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveTextContent('2');
  });

  it('does not render warning chip when no changed operations', () => {
    const result = makeResult(4, 0, 0);
    render(
      <DriftBadge
        collectionId={collectionId}
        collectionName={collectionName}
        driftResult={result}
      />
    );
    expect(screen.queryByTestId(`drift-badge-warning-${collectionId}`)).toBeNull();
  });

  it('renders both breaking and warning chips when both exist', () => {
    const result = makeResult(4, 1, 2);
    render(
      <DriftBadge
        collectionId={collectionId}
        collectionName={collectionName}
        driftResult={result}
      />
    );
    expect(screen.getByTestId(`drift-badge-breaking-${collectionId}`)).toBeInTheDocument();
    expect(screen.getByTestId(`drift-badge-warning-${collectionId}`)).toBeInTheDocument();
  });

  it('calls openDrawer with correct collection ID on click', () => {
    const result = makeResult(4, 1, 0);
    render(
      <DriftBadge
        collectionId={collectionId}
        collectionName={collectionName}
        driftResult={result}
      />
    );
    const badge = screen.getByTestId(`drift-badge-${collectionId}`);
    fireEvent.click(badge);
    const state = useDriftReviewStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.collectionId).toBe(collectionId);
  });

  it('has aria-label for accessibility', () => {
    const result = makeResult(4, 1, 0);
    render(
      <DriftBadge
        collectionId={collectionId}
        collectionName={collectionName}
        driftResult={result}
      />
    );
    const badge = screen.getByTestId(`drift-badge-${collectionId}`);
    expect(badge).toHaveAttribute('aria-label', expect.stringContaining(collectionName));
  });

  it('renders nothing when all pending changes are reviewed (accepted/ignored)', () => {
    const result = makeResult(1, 1, 0);
    // Mark all as accepted
    useDriftReviewStore.setState({
      isOpen: false,
      collectionId: null,
      focusOperationKey: null,
      reviewState: {
        [`${collectionId}:DELETE:/removed-0`]: { status: 'accepted' },
        [`${collectionId}:PUT:/changed-0`]: { status: 'accepted' },
      },
      dismissedBannerKeys: new Set(),
    });
    const { container } = render(
      <DriftBadge
        collectionId={collectionId}
        collectionName={collectionName}
        driftResult={result}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
