/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import type { Collection, CollectionSummary } from '@/types/collection';
import { CollectionList } from '@/components/Sidebar/CollectionList';
import { useFeatureFlagStore } from '@/stores/features/useFeatureFlagStore';
import { Sidebar } from './Sidebar';

const mockToast = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}));
vi.mock('@/components/ui/Toast', () => ({ toast: mockToast }));

interface MockCollectionStoreState {
  summaries: CollectionSummary[];
  isLoading: boolean;
  error: string | null;
  pendingRenameId: string | null;
  driftResults: Record<string, unknown>;
  loadCollections: () => Promise<void>;
  addHttpbinCollection: () => Promise<Collection | null>;
  createCollection: (name: string) => Promise<Collection | null>;
  importCollection: (request: unknown) => Promise<Collection | null>;
  clearPendingRename: () => void;
  refreshCollectionSpec: (id: string) => Promise<void>;
  dismissDriftResult: (id: string) => void;
}

let mockCollectionState: MockCollectionStoreState;

const createCollectionState = (): MockCollectionStoreState => ({
  summaries: [],
  isLoading: false,
  error: null,
  pendingRenameId: null,
  driftResults: {},
  loadCollections: vi.fn(async (): Promise<void> => undefined),
  addHttpbinCollection: vi.fn(async (): Promise<Collection | null> => null),
  createCollection: vi.fn(async (): Promise<Collection | null> => null),
  importCollection: vi.fn(async (): Promise<Collection | null> => null),
  clearPendingRename: vi.fn(),
  refreshCollectionSpec: vi.fn(async (): Promise<void> => undefined),
  dismissDriftResult: vi.fn(),
});

vi.mock('@/stores/useCollectionStore', () => ({
  useCollectionStore: (selector: (state: MockCollectionStoreState) => unknown): unknown =>
    selector(mockCollectionState),
  useIsExpanded: vi.fn(() => true),
  useCollection: vi.fn(() => undefined),
  useSortedRequests: vi.fn(() => []),
}));

describe('Sidebar', (): void => {
  beforeEach((): void => {
    useFeatureFlagStore.getState().resetToDefaults();
    useFeatureFlagStore.getState().setFlag('http', 'collectionsEnabled', true);
    mockCollectionState = createCollectionState();

    // Mock scrollable content
    mockCollectionState.summaries = Array.from({ length: 20 }, (_, i) => ({
      id: `col-${String(i)}`,
      name: `Collection ${String(i + 1)}`,
      request_count: 5,
      source_type: 'manual',
      modified_at: new Date().toISOString(),
    }));
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
    expect(screen.getByTestId('collection-list')).toBeInTheDocument();
  });

  it('uses contained focus ring styles on drawer headers to avoid clipping', (): void => {
    render(<Sidebar />);

    const collectionsButton = screen.getByTestId('collections-drawer-toggle');

    expect(collectionsButton.className).toContain('focus-visible:ring-inset');
    expect(collectionsButton.className).toContain('focus-visible:!ring-offset-0');
  });

  it('renders the collections list content', (): void => {
    render(<Sidebar />);
    expect(screen.getByTestId('collection-list')).toBeInTheDocument();
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

  it('has a scroll container with fade-out delay classes', async (): Promise<void> => {
    render(<Sidebar />);
    const scrollRoot = screen.getByTestId('sidebar-scroll-root');
    expect(scrollRoot).toBeInTheDocument();

    // Verify scrollbar has the manual opacity classes including hover on the bar area
    const scrollbar = screen.getByTestId('sidebar-scroll-scrollbar');
    // Note: It might start with opacity-100 because of showBriefly() on mount when isOpen=true
    // but in JSDOM scrollHeight might be 0, causing it to be opacity-0.
    // We just verify it has the correct classes for manual control.
    expect(scrollbar).toHaveClass('transition-opacity');
    expect(scrollbar).toHaveClass('duration-300');
    expect(scrollbar).toHaveClass('hover:opacity-100');
    expect(scrollbar).not.toHaveClass('group-hover/scroll:opacity-100');

    // Verify inset classes
    expect(scrollbar).toHaveClass('absolute');
    expect(scrollbar).toHaveClass('right-0');
    expect(scrollbar).toHaveClass('top-0');
    expect(scrollbar).toHaveClass('bottom-0');
    expect(scrollbar).toHaveClass('z-20');
  });

  it('renders a vertical scrollbar in the drawer body', (): void => {
    render(<Sidebar />);
    const scrollbar = screen.getByTestId('sidebar-scroll-scrollbar');
    expect(scrollbar).toBeInTheDocument();
    expect(scrollbar).toHaveAttribute('orientation', 'vertical');
  });

  it('shows create collection button when collectionsEnabled is true', (): void => {
    render(<Sidebar />);
    const button = screen.getByTestId('create-collection-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Create collection');
  });

  it('hides create collection button when collectionsEnabled is false', (): void => {
    useFeatureFlagStore.getState().setFlag('http', 'collectionsEnabled', false);
    render(<Sidebar />);
    expect(screen.queryByTestId('create-collection-button')).not.toBeInTheDocument();
  });

  it('calls createCollection when button is clicked', async (): Promise<void> => {
    render(<Sidebar />);
    const button = screen.getByTestId('create-collection-button');
    await userEvent.click(button);
    expect(mockCollectionState.createCollection).toHaveBeenCalledWith('Untitled Collection');
  });

  it('generates unique name when "Untitled Collection" already exists', async (): Promise<void> => {
    mockCollectionState.summaries = [
      {
        id: 'col-existing',
        name: 'Untitled Collection',
        request_count: 0,
        source_type: 'manual',
        modified_at: new Date().toISOString(),
      },
    ];
    render(<Sidebar />);
    const button = screen.getByTestId('create-collection-button');
    await userEvent.click(button);
    expect(mockCollectionState.createCollection).toHaveBeenCalledWith('Untitled Collection (2)');
  });

  it('generates unique name skipping existing numbered names', async (): Promise<void> => {
    mockCollectionState.summaries = [
      {
        id: 'col-1',
        name: 'Untitled Collection',
        request_count: 0,
        source_type: 'manual',
        modified_at: new Date().toISOString(),
      },
      {
        id: 'col-2',
        name: 'Untitled Collection (2)',
        request_count: 0,
        source_type: 'manual',
        modified_at: new Date().toISOString(),
      },
    ];
    render(<Sidebar />);
    const button = screen.getByTestId('create-collection-button');
    await userEvent.click(button);
    expect(mockCollectionState.createCollection).toHaveBeenCalledWith('Untitled Collection (3)');
  });

  it('shows error toast when createCollection fails', async (): Promise<void> => {
    mockCollectionState.createCollection = vi.fn(async (): Promise<Collection | null> => null);
    render(<Sidebar />);
    const button = screen.getByTestId('create-collection-button');
    await userEvent.click(button);
    expect(mockToast.error).toHaveBeenCalledWith({ message: 'Failed to create collection' });
  });
});

// Note: OpenItems integration tests removed — Sidebar currently renders
// only the Collections drawer. OpenItems will be re-added when the
// tab-based sidebar section is implemented.

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
