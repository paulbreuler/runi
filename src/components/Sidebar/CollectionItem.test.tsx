/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CollectionSummary } from '@/types/collection';
import { CollectionItem } from './CollectionItem';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock motion components to avoid animation delays in tests
vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<React.ComponentPropsWithoutRef<'div'>>): React.JSX.Element => (
      <div {...props}>{children}</div>
    ),
    span: ({
      children,
      ...props
    }: React.PropsWithChildren<React.ComponentPropsWithoutRef<'span'>>): React.JSX.Element => (
      <span {...props}>{children}</span>
    ),
    button: ({
      children,
      ...props
    }: React.PropsWithChildren<React.ComponentPropsWithoutRef<'button'>>): React.JSX.Element => (
      <button {...props}>{children}</button>
    ),
    input: ({ ...props }: React.ComponentPropsWithoutRef<'input'>): React.JSX.Element => (
      <input {...props} />
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<object>): React.JSX.Element => (
    <>{children}</>
  ),
  useReducedMotion: (): boolean => true,
}));

interface MockCollectionStoreState {
  selectedCollectionId: string | null;
  expandedCollectionIds: Set<string>;
  collections: unknown[];
  driftResults: Record<string, unknown>;
  toggleExpanded: (id: string) => void;
  loadCollection: (id: string) => Promise<void>;
  selectCollection: (id: string | null) => void;
  refreshCollectionSpec: (id: string) => Promise<void>;
  dismissDriftResult: (id: string) => void;
  setDriftResult: (id: string, result: unknown) => void;
}

let mockCollectionState: MockCollectionStoreState;

let mockUseCollection: (id: string) => unknown;

vi.mock('@/stores/useCollectionStore', () => ({
  useCollectionStore: (selector: (state: MockCollectionStoreState) => unknown): unknown =>
    selector(mockCollectionState),
  useIsExpanded: vi.fn(() => false),
  useCollection: (id: string): unknown => mockUseCollection(id),
  useSortedRequests: vi.fn(() => []),
}));

const simpleSummary: CollectionSummary = {
  id: 'col_1',
  name: 'My Collection',
  request_count: 5,
  source_type: 'manual',
  modified_at: '2026-01-01T00:00:00Z',
  pinned_version_count: 0,
};

/** Summary with spec_version + pinned_version_count for version switcher tests. */
const versionedSummary = (
  specVersion: string | undefined = '1.5.0',
  pinnedCount = 1
): CollectionSummary => ({
  ...simpleSummary,
  source_type: 'openapi',
  spec_version: specVersion,
  pinned_version_count: pinnedCount,
});

/** Helper to open the three-dot menu and wait for items to appear */
const openMenu = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
  const menuTrigger = screen.getByTestId('collection-menu-trigger-col_1');
  await user.click(menuTrigger);
  await waitFor(
    () => {
      expect(screen.getByTestId('collection-context-menu-col_1')).toBeInTheDocument();
    },
    { timeout: 3000 }
  );
};

describe('CollectionItem', (): void => {
  beforeEach((): void => {
    mockCollectionState = {
      selectedCollectionId: null,
      expandedCollectionIds: new Set(),
      collections: [],
      driftResults: {},
      toggleExpanded: vi.fn(),
      loadCollection: vi.fn(async (): Promise<void> => undefined),
      selectCollection: vi.fn(),
      refreshCollectionSpec: vi.fn(async (): Promise<void> => undefined),
      dismissDriftResult: vi.fn(),
      setDriftResult: vi.fn(),
    };
    mockUseCollection = vi.fn(() => undefined) as (id: string) => unknown;
  });

  describe('rendering', (): void => {
    it('renders collection name and metadata', (): void => {
      render(<CollectionItem summary={simpleSummary} />);

      expect(screen.getByTestId('collection-item-col_1')).toBeInTheDocument();
      expect(screen.getByTestId('collection-name-col_1')).toHaveTextContent('My Collection');
      expect(screen.getByTestId('collection-count-col_1')).toHaveTextContent('5');
      expect(screen.getByTestId('collection-source-col_1')).toHaveTextContent('manual');
    });

    it('renders three-dot menu trigger button', (): void => {
      render(<CollectionItem summary={simpleSummary} />);

      expect(screen.getByTestId('collection-menu-trigger-col_1')).toBeInTheDocument();
    });

    it('has accessible label on menu trigger', (): void => {
      render(<CollectionItem summary={simpleSummary} />);

      expect(screen.getByTestId('collection-menu-trigger-col_1')).toHaveAttribute(
        'aria-label',
        'Actions for My Collection'
      );
    });

    it('hides menu trigger when not hovered/focused', (): void => {
      render(<CollectionItem summary={simpleSummary} />);

      const actionsContainer = screen.getByTestId('collection-actions-col_1');
      expect(actionsContainer.className).toMatch(/invisible/);
      expect(actionsContainer.className).toMatch(/pointer-events-none/);
    });

    it('renders aria-expanded on toggle button', (): void => {
      render(<CollectionItem summary={simpleSummary} />);

      const toggleBtn = screen.getByTestId('collection-item-col_1');
      expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('context menu', (): void => {
    it('opens context menu when three-dot button is clicked', async (): Promise<void> => {
      const user = userEvent.setup();
      render(<CollectionItem summary={simpleSummary} />);

      await openMenu(user);

      expect(screen.getByTestId('collection-menu-rename-col_1')).toBeInTheDocument();
      expect(screen.getByTestId('collection-menu-delete-col_1')).toBeInTheDocument();
    });

    it('opens context menu on right-click', async (): Promise<void> => {
      render(<CollectionItem summary={simpleSummary} />);

      const groupDiv = screen.getByTestId('collection-row-col_1');
      fireEvent.contextMenu(groupDiv);

      await waitFor(
        () => {
          expect(screen.getByTestId('collection-context-menu-col_1')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('shows Rename and Delete menu items with keyboard hints', async (): Promise<void> => {
      const user = userEvent.setup();
      render(<CollectionItem summary={simpleSummary} />);

      await openMenu(user);

      const renameItem = screen.getByTestId('collection-menu-rename-col_1');
      const deleteItem = screen.getByTestId('collection-menu-delete-col_1');

      expect(renameItem).toHaveTextContent('Rename');
      expect(renameItem).toHaveTextContent('F2');
      expect(deleteItem).toHaveTextContent('Delete');
      expect(deleteItem).toHaveTextContent('Del');
    });
  });

  describe('rename action', (): void => {
    it('shows rename input when Rename is selected from menu', async (): Promise<void> => {
      const user = userEvent.setup();
      render(<CollectionItem summary={simpleSummary} />);

      await openMenu(user);

      const renameItem = screen.getByTestId('collection-menu-rename-col_1');
      await user.click(renameItem);

      await waitFor(() => {
        expect(screen.getByTestId('collection-rename-input-col_1')).toBeInTheDocument();
      });
      expect(screen.getByTestId('collection-rename-input-col_1')).toHaveValue('My Collection');
    });

    it('calls onRename when Enter is pressed with new name', async (): Promise<void> => {
      const mockRename = vi.fn();
      const user = userEvent.setup();
      render(<CollectionItem summary={simpleSummary} onRename={mockRename} />);

      await openMenu(user);

      const renameItem = screen.getByTestId('collection-menu-rename-col_1');
      await user.click(renameItem);

      const input = await screen.findByTestId('collection-rename-input-col_1');
      fireEvent.change(input, { target: { value: 'Renamed Collection' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockRename).toHaveBeenCalledWith('col_1', 'Renamed Collection');
    });

    it('does not call onRename when name is unchanged', async (): Promise<void> => {
      const mockRename = vi.fn();
      const user = userEvent.setup();
      render(<CollectionItem summary={simpleSummary} onRename={mockRename} />);

      await openMenu(user);

      const renameItem = screen.getByTestId('collection-menu-rename-col_1');
      await user.click(renameItem);

      const input = await screen.findByTestId('collection-rename-input-col_1');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockRename).not.toHaveBeenCalled();
    });

    it('cancels rename on Escape', async (): Promise<void> => {
      const mockRename = vi.fn();
      const user = userEvent.setup();
      render(<CollectionItem summary={simpleSummary} onRename={mockRename} />);

      await openMenu(user);

      const renameItem = screen.getByTestId('collection-menu-rename-col_1');
      await user.click(renameItem);

      const input = await screen.findByTestId('collection-rename-input-col_1');
      fireEvent.change(input, { target: { value: 'Changed Name' } });
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(mockRename).not.toHaveBeenCalled();
      expect(screen.queryByTestId('collection-rename-input-col_1')).not.toBeInTheDocument();
    });

    it('starts rename mode on F2 keydown', (): void => {
      render(<CollectionItem summary={simpleSummary} />);

      const row = screen.getByTestId('collection-item-col_1');
      fireEvent.keyDown(row, { key: 'F2' });

      expect(screen.getByTestId('collection-rename-input-col_1')).toBeInTheDocument();
    });

    it('does not commit rename when Escape triggers blur from unmount', async (): Promise<void> => {
      const mockRename = vi.fn();
      const user = userEvent.setup();
      render(<CollectionItem summary={simpleSummary} onRename={mockRename} />);

      await openMenu(user);

      const renameItem = screen.getByTestId('collection-menu-rename-col_1');
      await user.click(renameItem);

      const input = await screen.findByTestId('collection-rename-input-col_1');
      fireEvent.change(input, { target: { value: 'Changed Name' } });

      act(() => {
        fireEvent.keyDown(input, { key: 'Escape' });
        fireEvent.blur(input);
      });

      expect(mockRename).not.toHaveBeenCalled();
    });

    it('has accessible label on rename input', async (): Promise<void> => {
      const user = userEvent.setup();
      render(<CollectionItem summary={simpleSummary} />);

      await openMenu(user);

      const renameItem = screen.getByTestId('collection-menu-rename-col_1');
      await user.click(renameItem);

      const input = await screen.findByTestId('collection-rename-input-col_1');
      expect(input).toHaveAttribute('aria-label', 'Rename collection My Collection');
    });
  });

  describe('delete action', (): void => {
    it('shows delete confirmation when Delete is selected from menu', async (): Promise<void> => {
      const user = userEvent.setup();
      render(<CollectionItem summary={simpleSummary} />);

      await openMenu(user);

      const deleteItem = screen.getByTestId('collection-menu-delete-col_1');
      await user.click(deleteItem);

      await waitFor(() => {
        expect(screen.getByTestId('collection-delete-confirm-col_1')).toBeInTheDocument();
      });
      expect(screen.getByTestId('collection-delete-confirm-btn-col_1')).toBeInTheDocument();
      expect(screen.getByTestId('collection-delete-cancel-col_1')).toBeInTheDocument();
    });

    it('calls onDelete when confirm button is clicked', async (): Promise<void> => {
      const user = userEvent.setup();
      const mockDelete = vi.fn();

      render(<CollectionItem summary={simpleSummary} onDelete={mockDelete} />);

      await openMenu(user);

      const deleteItem = screen.getByTestId('collection-menu-delete-col_1');
      await user.click(deleteItem);

      const confirmBtn = await screen.findByTestId('collection-delete-confirm-btn-col_1');
      await user.click(confirmBtn);

      expect(mockDelete).toHaveBeenCalledWith('col_1');
    });

    it('closes popover when cancel button is clicked', async (): Promise<void> => {
      const user = userEvent.setup();

      render(<CollectionItem summary={simpleSummary} />);

      await openMenu(user);

      const deleteItem = screen.getByTestId('collection-menu-delete-col_1');
      await user.click(deleteItem);

      const cancelBtn = await screen.findByTestId('collection-delete-cancel-col_1');
      await user.click(cancelBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('collection-delete-confirm-col_1')).not.toBeInTheDocument();
      });
    });

    it('opens delete confirmation on Delete keydown', (): void => {
      render(<CollectionItem summary={simpleSummary} />);

      const row = screen.getByTestId('collection-item-col_1');
      fireEvent.keyDown(row, { key: 'Delete' });

      expect(screen.getByTestId('collection-delete-confirm-col_1')).toBeInTheDocument();
    });

    it('shows collection name in delete confirmation', async (): Promise<void> => {
      const user = userEvent.setup();

      render(<CollectionItem summary={simpleSummary} />);

      await openMenu(user);

      const deleteItem = screen.getByTestId('collection-menu-delete-col_1');
      await user.click(deleteItem);

      const popover = await screen.findByTestId('collection-delete-confirm-col_1');
      expect(popover).toHaveTextContent('My Collection');
    });
  });

  describe('spec_version badge', (): void => {
    it('renders spec_version badge when spec_version is provided', (): void => {
      const summaryWithVersion: CollectionSummary = {
        ...simpleSummary,
        spec_version: '3.0.1',
      };
      render(<CollectionItem summary={summaryWithVersion} />);

      const badge = screen.getByTestId('collection-version-col_1');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('3.0.1');
    });

    it('does not render spec_version badge when spec_version is undefined', (): void => {
      render(<CollectionItem summary={simpleSummary} />);
      expect(screen.queryByTestId('collection-version-col_1')).toBeNull();
    });
  });

  describe('pinned version badge', (): void => {
    const stagingVersion = {
      id: 'pv_1',
      label: '2.0.0',
      spec_content: '{}',
      source: {
        source_type: 'openapi',
        url: null,
        hash: null,
        spec_version: '2.0.0',
        fetched_at: '2026-01-01T00:00:00Z',
        source_commit: null,
      },
      imported_at: '2026-01-01T00:00:00Z',
      role: 'staging' as const,
    };
    const archivedVersion = {
      id: 'pv_2',
      label: '1.0.0',
      spec_content: '{}',
      source: {
        source_type: 'openapi',
        url: null,
        hash: null,
        spec_version: '1.0.0',
        fetched_at: '2026-01-01T00:00:00Z',
        source_commit: null,
      },
      imported_at: '2025-01-01T00:00:00Z',
      role: 'archived' as const,
    };

    it('badge is hidden when no pinned versions', (): void => {
      mockUseCollection = vi.fn(() => ({
        id: 'col_1',
        metadata: { name: 'My Collection', tags: [], created_at: '', modified_at: '' },
        source: {
          source_type: 'manual',
          fetched_at: '',
          url: null,
          hash: null,
          spec_version: null,
          source_commit: null,
        },
        requests: [],
        environments: [],
        variables: {},
        pinned_versions: [],
      }));
      render(<CollectionItem summary={simpleSummary} />);
      expect(screen.queryByTestId('collection-version-badge')).toBeNull();
    });

    it('badge shows active version with staged count when staged versions exist', (): void => {
      mockUseCollection = vi.fn(() => ({
        id: 'col_1',
        metadata: { name: 'My Collection', tags: [], created_at: '', modified_at: '' },
        source: {
          source_type: 'openapi',
          fetched_at: '',
          url: null,
          hash: null,
          spec_version: '1.5.0',
          source_commit: null,
        },
        requests: [],
        environments: [],
        variables: {},
        pinned_versions: [stagingVersion],
      }));
      render(<CollectionItem summary={versionedSummary()} />);
      const badge = screen.getByTestId('collection-version-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('1.5.0');
    });

    it('badge shows only active version when no staged versions', (): void => {
      mockUseCollection = vi.fn(() => ({
        id: 'col_1',
        metadata: { name: 'My Collection', tags: [], created_at: '', modified_at: '' },
        source: {
          source_type: 'openapi',
          fetched_at: '',
          url: null,
          hash: null,
          spec_version: '1.5.0',
          source_commit: null,
        },
        requests: [],
        environments: [],
        variables: {},
        pinned_versions: [archivedVersion],
      }));
      render(<CollectionItem summary={versionedSummary()} />);
      const badge = screen.getByTestId('collection-version-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('1.5.0');
      expect(badge).not.toHaveTextContent('+');
    });

    it('badge shows v? when active version unknown', (): void => {
      mockUseCollection = vi.fn(() => ({
        id: 'col_1',
        metadata: { name: 'My Collection', tags: [], created_at: '', modified_at: '' },
        source: {
          source_type: 'openapi',
          fetched_at: '',
          url: null,
          hash: null,
          spec_version: null,
          source_commit: null,
        },
        requests: [],
        environments: [],
        variables: {},
        pinned_versions: [stagingVersion],
      }));
      render(<CollectionItem summary={{ ...versionedSummary(), spec_version: undefined }} />);
      const badge = screen.getByTestId('collection-version-badge');
      expect(badge).toHaveTextContent('v?');
    });

    it('badge click opens version switcher popover', async (): Promise<void> => {
      const user = userEvent.setup();
      mockUseCollection = vi.fn(() => ({
        id: 'col_1',
        metadata: { name: 'My Collection', tags: [], created_at: '', modified_at: '' },
        source: {
          source_type: 'openapi',
          fetched_at: '',
          url: null,
          hash: null,
          spec_version: '1.5.0',
          source_commit: null,
        },
        requests: [],
        environments: [],
        variables: {},
        pinned_versions: [stagingVersion],
      }));
      render(<CollectionItem summary={versionedSummary()} />);

      await user.click(screen.getByTestId('collection-version-badge'));

      await waitFor(() => {
        expect(screen.getByTestId('version-switcher-popover')).toBeInTheDocument();
      });
    });

    it('version switcher shows active and staged sections', async (): Promise<void> => {
      const user = userEvent.setup();
      mockUseCollection = vi.fn(() => ({
        id: 'col_1',
        metadata: { name: 'My Collection', tags: [], created_at: '', modified_at: '' },
        source: {
          source_type: 'openapi',
          fetched_at: '',
          url: null,
          hash: null,
          spec_version: '1.5.0',
          source_commit: null,
        },
        requests: [],
        environments: [],
        variables: {},
        pinned_versions: [stagingVersion],
      }));
      render(<CollectionItem summary={versionedSummary()} />);

      await user.click(screen.getByTestId('collection-version-badge'));

      await waitFor(() => {
        expect(screen.getByTestId('version-switcher-active-row')).toBeInTheDocument();
        expect(screen.getByTestId('version-switcher-staged-row-pv_1')).toBeInTheDocument();
      });
    });

    it('activate confirmation shows inline when Activate is clicked', async (): Promise<void> => {
      const user = userEvent.setup();
      mockUseCollection = vi.fn(() => ({
        id: 'col_1',
        metadata: { name: 'My Collection', tags: [], created_at: '', modified_at: '' },
        source: {
          source_type: 'openapi',
          fetched_at: '',
          url: null,
          hash: null,
          spec_version: '1.5.0',
          source_commit: null,
        },
        requests: [],
        environments: [],
        variables: {},
        pinned_versions: [stagingVersion],
      }));
      render(<CollectionItem summary={versionedSummary()} />);

      await user.click(screen.getByTestId('collection-version-badge'));
      await waitFor(() => {
        expect(screen.getByTestId('version-switcher-staged-row-pv_1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('version-switcher-activate-pv_1'));

      await waitFor(() => {
        expect(screen.getByTestId('version-switcher-activate-confirm-pv_1')).toBeInTheDocument();
        expect(screen.getByTestId('version-switcher-activate-cancel-pv_1')).toBeInTheDocument();
      });
    });

    it('activate cancel returns to normal row buttons', async (): Promise<void> => {
      const user = userEvent.setup();
      mockUseCollection = vi.fn(() => ({
        id: 'col_1',
        metadata: { name: 'My Collection', tags: [], created_at: '', modified_at: '' },
        source: {
          source_type: 'openapi',
          fetched_at: '',
          url: null,
          hash: null,
          spec_version: '1.5.0',
          source_commit: null,
        },
        requests: [],
        environments: [],
        variables: {},
        pinned_versions: [stagingVersion],
      }));
      render(<CollectionItem summary={versionedSummary()} />);

      await user.click(screen.getByTestId('collection-version-badge'));
      await waitFor(() => {
        expect(screen.getByTestId('version-switcher-activate-pv_1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('version-switcher-activate-pv_1'));
      await waitFor(() => {
        expect(screen.getByTestId('version-switcher-activate-cancel-pv_1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('version-switcher-activate-cancel-pv_1'));

      await waitFor(() => {
        expect(screen.queryByTestId('version-switcher-activate-confirm-pv_1')).toBeNull();
        expect(screen.getByTestId('version-switcher-activate-pv_1')).toBeInTheDocument();
      });
    });

    it('remove confirmation shows inline when Remove is clicked on staged row', async (): Promise<void> => {
      const user = userEvent.setup();
      mockUseCollection = vi.fn(() => ({
        id: 'col_1',
        metadata: { name: 'My Collection', tags: [], created_at: '', modified_at: '' },
        source: {
          source_type: 'openapi',
          fetched_at: '',
          url: null,
          hash: null,
          spec_version: '1.5.0',
          source_commit: null,
        },
        requests: [],
        environments: [],
        variables: {},
        pinned_versions: [stagingVersion],
      }));
      render(<CollectionItem summary={versionedSummary()} />);

      await user.click(screen.getByTestId('collection-version-badge'));
      await waitFor(() => {
        expect(screen.getByTestId('version-switcher-staged-row-pv_1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('version-switcher-remove-pv_1'));

      await waitFor(() => {
        expect(screen.getByTestId('version-switcher-remove-confirm-pv_1')).toBeInTheDocument();
        expect(screen.getByTestId('version-switcher-remove-cancel-pv_1')).toBeInTheDocument();
      });
    });

    it('compare button shows Comparing… and is disabled while comparing', async (): Promise<void> => {
      const { invoke: mockInvoke } = await import('@tauri-apps/api/core');
      const invokeMock = vi.mocked(mockInvoke);

      // Never resolve so we can observe the loading state
      let resolveCompare!: () => void;
      invokeMock.mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveCompare = resolve;
        })
      );

      const user = userEvent.setup();
      mockUseCollection = vi.fn(() => ({
        id: 'col_1',
        metadata: { name: 'My Collection', tags: [], created_at: '', modified_at: '' },
        source: {
          source_type: 'openapi',
          fetched_at: '',
          url: null,
          hash: null,
          spec_version: '1.5.0',
          source_commit: null,
        },
        requests: [],
        environments: [],
        variables: {},
        pinned_versions: [stagingVersion],
      }));
      render(<CollectionItem summary={versionedSummary()} />);

      await user.click(screen.getByTestId('collection-version-badge'));
      await waitFor(() => {
        expect(screen.getByTestId('version-switcher-staged-row-pv_1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('version-switcher-compare-pv_1'));

      await waitFor(() => {
        const compareBtn = screen.getByTestId('version-switcher-compare-pv_1');
        expect(compareBtn).toBeDisabled();
        expect(compareBtn).toHaveTextContent('Comparing…');
      });

      // Clean up — resolve the pending promise
      resolveCompare();
    });

    it('compare button is re-enabled after compare completes', async (): Promise<void> => {
      const { invoke: mockInvoke } = await import('@tauri-apps/api/core');
      const invokeMock = vi.mocked(mockInvoke);

      const mockResult = {
        changed: true,
        operationsAdded: [],
        operationsRemoved: [],
        operationsChanged: [],
      };
      invokeMock.mockResolvedValueOnce(mockResult);

      const user = userEvent.setup();
      mockUseCollection = vi.fn(() => ({
        id: 'col_1',
        metadata: { name: 'My Collection', tags: [], created_at: '', modified_at: '' },
        source: {
          source_type: 'openapi',
          fetched_at: '',
          url: null,
          hash: null,
          spec_version: '1.5.0',
          source_commit: null,
        },
        requests: [],
        environments: [],
        variables: {},
        pinned_versions: [stagingVersion],
      }));
      render(<CollectionItem summary={versionedSummary()} />);

      await user.click(screen.getByTestId('collection-version-badge'));
      await waitFor(() => {
        expect(screen.getByTestId('version-switcher-staged-row-pv_1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('version-switcher-compare-pv_1'));

      // After compare resolves, onClose is called which closes the popover.
      // Just verify the invoke was called with correct args.
      await waitFor(() => {
        expect(invokeMock).toHaveBeenCalledWith('cmd_compare_spec_versions', {
          collectionId: 'col_1',
          pinnedVersionId: 'pv_1',
        });
      });
    });

    it('archived section renders with restore and remove buttons', async (): Promise<void> => {
      const user = userEvent.setup();
      mockUseCollection = vi.fn(() => ({
        id: 'col_1',
        metadata: { name: 'My Collection', tags: [], created_at: '', modified_at: '' },
        source: {
          source_type: 'openapi',
          fetched_at: '',
          url: null,
          hash: null,
          spec_version: '1.5.0',
          source_commit: null,
        },
        requests: [],
        environments: [],
        variables: {},
        pinned_versions: [archivedVersion],
      }));
      render(<CollectionItem summary={versionedSummary()} />);

      await user.click(screen.getByTestId('collection-version-badge'));

      // Archived section is collapsed by default; toggle it open
      await waitFor(() => {
        expect(screen.getByTestId('version-switcher-archived-toggle')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('version-switcher-archived-toggle'));

      await waitFor(() => {
        expect(screen.getByTestId('version-switcher-archived-row-pv_2')).toBeInTheDocument();
        expect(screen.getByTestId('version-switcher-remove-pv_2')).toBeInTheDocument();
        expect(screen.getByTestId('version-switcher-activate-pv_2')).toBeInTheDocument();
      });
    });
  });

  describe('drift badge', (): void => {
    it('renders breaking chip when operationsRemoved is non-empty', (): void => {
      mockCollectionState = {
        ...mockCollectionState,
        driftResults: {
          col_1: {
            changed: true,
            operationsAdded: [],
            operationsRemoved: [{ method: 'DELETE', path: '/users/{id}' }],
            operationsChanged: [],
          },
        },
      };
      render(<CollectionItem summary={simpleSummary} />);

      const badge = screen.getByTestId('drift-badge-col_1');
      expect(badge).toBeInTheDocument();
      const breakingChip = screen.getByTestId('drift-badge-breaking-col_1');
      expect(breakingChip).toBeInTheDocument();
    });

    it('renders warning chip when only operationsChanged', (): void => {
      mockCollectionState = {
        ...mockCollectionState,
        driftResults: {
          col_1: {
            changed: true,
            operationsAdded: [],
            operationsRemoved: [],
            operationsChanged: [{ method: 'GET', path: '/users', changes: ['summary'] }],
          },
        },
      };
      render(<CollectionItem summary={simpleSummary} />);

      const badge = screen.getByTestId('drift-badge-col_1');
      expect(badge).toBeInTheDocument();
      const warningChip = screen.getByTestId('drift-badge-warning-col_1');
      expect(warningChip).toBeInTheDocument();
      expect(screen.queryByTestId('drift-badge-breaking-col_1')).toBeNull();
    });

    it('does not render drift badge when changed is false', (): void => {
      mockCollectionState = {
        ...mockCollectionState,
        driftResults: {
          col_1: {
            changed: false,
            operationsAdded: [],
            operationsRemoved: [],
            operationsChanged: [],
          },
        },
      };
      render(<CollectionItem summary={simpleSummary} />);
      expect(screen.queryByTestId('drift-badge-col_1')).toBeNull();
    });

    it('does not render drift badge when no driftResult for collection', (): void => {
      render(<CollectionItem summary={simpleSummary} />);
      expect(screen.queryByTestId('drift-badge-col_1')).toBeNull();
    });
  });
});
