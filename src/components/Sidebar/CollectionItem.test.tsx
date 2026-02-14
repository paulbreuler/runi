/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
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
      expect(screen.getByText('My Collection')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('manual')).toBeInTheDocument();
    });

    it('renders rename and delete action buttons', (): void => {
      render(<CollectionItem summary={simpleSummary} />);

      expect(screen.getByTestId('collection-rename-col_1')).toBeInTheDocument();
      expect(screen.getByTestId('collection-delete-col_1')).toBeInTheDocument();
    });

    it('has accessible labels on action buttons', (): void => {
      render(<CollectionItem summary={simpleSummary} />);

      expect(screen.getByTestId('collection-rename-col_1')).toHaveAttribute(
        'aria-label',
        'Rename My Collection'
      );
      expect(screen.getByTestId('collection-delete-col_1')).toHaveAttribute(
        'aria-label',
        'Delete My Collection'
      );
    });

    it('renders aria-expanded on toggle button', (): void => {
      render(<CollectionItem summary={simpleSummary} />);

      const toggleBtn = screen.getByTestId('collection-item-col_1');
      expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('rename action', (): void => {
    it('shows rename input when rename button is clicked', (): void => {
      render(<CollectionItem summary={simpleSummary} />);

      const renameBtn = screen.getByTestId('collection-rename-col_1');
      act(() => {
        fireEvent.click(renameBtn);
      });

      expect(screen.getByTestId('collection-rename-input-col_1')).toBeInTheDocument();
      expect(screen.getByTestId('collection-rename-input-col_1')).toHaveValue('My Collection');
    });

    it('calls onRename when Enter is pressed with new name', (): void => {
      const mockRename = vi.fn();
      render(<CollectionItem summary={simpleSummary} onRename={mockRename} />);

      const renameBtn = screen.getByTestId('collection-rename-col_1');
      act(() => {
        fireEvent.click(renameBtn);
      });

      const input = screen.getByTestId('collection-rename-input-col_1');
      fireEvent.change(input, { target: { value: 'Renamed Collection' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockRename).toHaveBeenCalledWith('col_1', 'Renamed Collection');
    });

    it('does not call onRename when name is unchanged', (): void => {
      const mockRename = vi.fn();
      render(<CollectionItem summary={simpleSummary} onRename={mockRename} />);

      const renameBtn = screen.getByTestId('collection-rename-col_1');
      act(() => {
        fireEvent.click(renameBtn);
      });

      const input = screen.getByTestId('collection-rename-input-col_1');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockRename).not.toHaveBeenCalled();
    });

    it('cancels rename on Escape', (): void => {
      const mockRename = vi.fn();
      render(<CollectionItem summary={simpleSummary} onRename={mockRename} />);

      const renameBtn = screen.getByTestId('collection-rename-col_1');
      act(() => {
        fireEvent.click(renameBtn);
      });

      const input = screen.getByTestId('collection-rename-input-col_1');
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

    it('has accessible label on rename input', (): void => {
      render(<CollectionItem summary={simpleSummary} />);

      const renameBtn = screen.getByTestId('collection-rename-col_1');
      act(() => {
        fireEvent.click(renameBtn);
      });

      expect(screen.getByTestId('collection-rename-input-col_1')).toHaveAttribute(
        'aria-label',
        'Rename collection My Collection'
      );
    });
  });

  describe('delete action', (): void => {
    it('shows delete confirmation popover when delete button is clicked', async (): Promise<void> => {
      const user = userEvent.setup();

      render(<CollectionItem summary={simpleSummary} />);

      const deleteBtn = screen.getByTestId('collection-delete-col_1');
      await user.click(deleteBtn);

      expect(screen.getByTestId('collection-delete-confirm-col_1')).toBeInTheDocument();
      expect(screen.getByTestId('collection-delete-confirm-btn-col_1')).toBeInTheDocument();
      expect(screen.getByTestId('collection-delete-cancel-col_1')).toBeInTheDocument();
    });

    it('calls onDelete when confirm button is clicked', async (): Promise<void> => {
      const user = userEvent.setup();
      const mockDelete = vi.fn();

      render(<CollectionItem summary={simpleSummary} onDelete={mockDelete} />);

      const deleteBtn = screen.getByTestId('collection-delete-col_1');
      await user.click(deleteBtn);

      const confirmBtn = screen.getByTestId('collection-delete-confirm-btn-col_1');
      await user.click(confirmBtn);

      expect(mockDelete).toHaveBeenCalledWith('col_1');
    });

    it('closes popover when cancel button is clicked', async (): Promise<void> => {
      const user = userEvent.setup();

      render(<CollectionItem summary={simpleSummary} />);

      const deleteBtn = screen.getByTestId('collection-delete-col_1');
      await user.click(deleteBtn);

      const cancelBtn = screen.getByTestId('collection-delete-cancel-col_1');
      await user.click(cancelBtn);

      expect(screen.queryByTestId('collection-delete-confirm-col_1')).not.toBeInTheDocument();
    });

    it('opens delete popover on Delete keydown', (): void => {
      render(<CollectionItem summary={simpleSummary} />);

      const row = screen.getByTestId('collection-item-col_1');
      fireEvent.keyDown(row, { key: 'Delete' });

      expect(screen.getByTestId('collection-delete-confirm-col_1')).toBeInTheDocument();
    });

    it('shows collection name in delete confirmation', async (): Promise<void> => {
      const user = userEvent.setup();

      render(<CollectionItem summary={simpleSummary} />);

      const deleteBtn = screen.getByTestId('collection-delete-col_1');
      await user.click(deleteBtn);

      const popover = screen.getByTestId('collection-delete-confirm-col_1');
      expect(popover).toHaveTextContent('My Collection');
    });
  });
});
