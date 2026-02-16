/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CollectionSummary } from '@/types/collection';
import { CollectionItem } from './CollectionItem';

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
  toggleExpanded: (id: string) => void;
  loadCollection: (id: string) => Promise<void>;
  selectCollection: (id: string | null) => void;
}

let mockCollectionState: MockCollectionStoreState;

vi.mock('@/stores/useCollectionStore', () => ({
  useCollectionStore: (selector: (state: MockCollectionStoreState) => unknown): unknown =>
    selector(mockCollectionState),
  useIsExpanded: vi.fn(() => false),
  useCollection: vi.fn(() => undefined),
  useSortedRequests: vi.fn(() => []),
}));

const simpleSummary: CollectionSummary = {
  id: 'col_1',
  name: 'My Collection',
  request_count: 5,
  source_type: 'manual',
  modified_at: '2026-01-01T00:00:00Z',
};

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
      toggleExpanded: vi.fn(),
      loadCollection: vi.fn(async (): Promise<void> => undefined),
      selectCollection: vi.fn(),
    };
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

      const row = screen.getByTestId('collection-item-col_1');
      const groupDiv = row.closest('.group\\/collection');
      expect(groupDiv).not.toBeNull();
      fireEvent.contextMenu(groupDiv!);

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
});
