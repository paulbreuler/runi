/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import type { Collection, CollectionSummary } from '@/types/collection';
import { CollectionList } from '@/components/Sidebar/CollectionList';
import { useFeatureFlagStore } from '@/stores/features/useFeatureFlagStore';
import { Sidebar } from './Sidebar';

interface MockCollectionStoreState {
  summaries: CollectionSummary[];
  isLoading: boolean;
  error: string | null;
  loadCollections: () => Promise<void>;
  addHttpbinCollection: () => Promise<Collection | null>;
}

let mockCollectionState: MockCollectionStoreState;

const createCollectionState = (): MockCollectionStoreState => ({
  summaries: [],
  isLoading: false,
  error: null,
  loadCollections: vi.fn(async (): Promise<void> => undefined),
  addHttpbinCollection: vi.fn(async (): Promise<Collection | null> => null),
});

vi.mock('@/stores/useCollectionStore', () => ({
  useCollectionStore: (selector: (state: MockCollectionStoreState) => unknown): unknown =>
    selector(mockCollectionState),
}));

describe('Sidebar', (): void => {
  beforeEach((): void => {
    useFeatureFlagStore.getState().resetToDefaults();
    useFeatureFlagStore.getState().setFlag('http', 'collectionsEnabled', true);
    mockCollectionState = createCollectionState();
  });
  it('renders sidebar with proper structure', (): void => {
    render(<Sidebar />);

    const sidebar = screen.getByTestId('sidebar-content');
    expect(sidebar).toBeInTheDocument();
  });

  it('has Collections drawer section', (): void => {
    render(<Sidebar />);

    expect(screen.getByTestId('collections-drawer-title')).toBeInTheDocument();
    expect(screen.getByTestId('collections-drawer')).toBeInTheDocument();
  });

  it('drawer sections are open by default', (): void => {
    render(<Sidebar />);

    const collectionsButton = screen.getByTestId('collections-drawer-toggle');
    expect(collectionsButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('collection-list-empty')).toBeInTheDocument();
  });

  it('uses contained focus ring styles on drawer headers to avoid clipping', (): void => {
    render(<Sidebar />);

    const collectionsButton = screen.getByTestId('collections-drawer-toggle');

    expect(collectionsButton.className).toContain('focus-visible:ring-inset');
    expect(collectionsButton.className).toContain('focus-visible:!ring-offset-0');
  });

  it('renders the collections list content', (): void => {
    render(<Sidebar />);
    expect(screen.getByTestId('collection-list-empty')).toBeInTheDocument();
  });

  it('fills its container width', (): void => {
    render(<Sidebar />);

    const sidebar = screen.getByTestId('sidebar-content');
    expect(sidebar).toHaveClass('flex-1');
  });

  it('has proper background styling', (): void => {
    render(<Sidebar />);

    const sidebar = screen.getByTestId('sidebar-content');
    expect(sidebar).toHaveClass('bg-bg-surface');
  });

  it('drawer headers have uppercase styling', (): void => {
    render(<Sidebar />);

    const collectionsTitle = screen.getByTestId('collections-drawer-title');
    expect(collectionsTitle).toHaveClass('uppercase');
    expect(collectionsTitle).toHaveClass('tracking-wider');
  });

  it('renders a scroll container for the drawer body', (): void => {
    const { container } = render(<Sidebar />);
    const scrollContainer = container.querySelector('[data-scroll-container]');
    expect(scrollContainer).toBeInTheDocument();
  });

  it('has a scroll container with fade-out delay classes', (): void => {
    const { container } = render(<Sidebar />);
    // The ScrollArea.Root mock overwrites className with the one passed in prop
    const scrollRoot = container.querySelector('.group\\/scroll');
    expect(scrollRoot).toBeInTheDocument();

    // Verify scrollbar has the manual opacity classes including hover on the bar area
    const scrollbar = container.querySelector('.scroll-area-scrollbar');
    expect(scrollbar).toHaveClass('opacity-0');
    expect(scrollbar).toHaveClass('hover:opacity-100');
    expect(scrollbar).not.toHaveClass('group-hover/scroll:opacity-100');
  });

  it('renders a vertical scrollbar in the drawer body', (): void => {
    const { container } = render(<Sidebar />);
    const scrollbar = container.querySelector('.scroll-area-scrollbar');
    expect(scrollbar).toBeInTheDocument();
    expect(scrollbar).toHaveAttribute('orientation', 'vertical');
  });
});

describe('CollectionList', (): void => {
  beforeEach((): void => {
    useFeatureFlagStore.getState().resetToDefaults();
    mockCollectionState = createCollectionState();
  });

  it('shows disabled state when collections flag is off', (): void => {
    useFeatureFlagStore.getState().setFlag('http', 'collectionsEnabled', false);

    render(<CollectionList />);

    expect(screen.getByTestId('collection-list-disabled')).toBeInTheDocument();
    expect(mockCollectionState.loadCollections).not.toHaveBeenCalled();
  });

  it('loads collections when flag is enabled', async (): Promise<void> => {
    useFeatureFlagStore.getState().setFlag('http', 'collectionsEnabled', true);

    render(<CollectionList />);

    await waitFor(() => {
      expect(mockCollectionState.loadCollections).toHaveBeenCalledTimes(1);
    });
  });

  it('renders empty state when enabled with no summaries', (): void => {
    useFeatureFlagStore.getState().setFlag('http', 'collectionsEnabled', true);

    render(<CollectionList />);

    expect(screen.getByTestId('collection-list-empty')).toBeInTheDocument();
  });
});
