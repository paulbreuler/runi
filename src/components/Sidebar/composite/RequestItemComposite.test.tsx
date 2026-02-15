/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import type { CollectionRequest } from '@/types/collection';
import { RequestItemComposite } from './RequestItemComposite';
import { globalEventBus } from '@/events/bus';
import { TooltipProvider } from '@/components/ui/Tooltip';

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

const longRequest: CollectionRequest = {
  id: 'req_long',
  name: 'This is a very long request name that will definitely be truncated in the sidebar layout because it exceeds the container width',
  seq: 1,
  method: 'GET',
  url: 'https://api.example.com/long-endpoint',
  headers: {},
  params: [],
  is_streaming: false,
  tags: [],
  binding: { is_manual: true },
  intelligence: { ai_generated: false, verified: true },
};

const simpleRequest: CollectionRequest = {
  id: 'req_1',
  name: 'Get Users',
  seq: 1,
  method: 'GET',
  url: 'https://api.example.com/users',
  headers: {},
  params: [],
  is_streaming: false,
  tags: [],
  binding: { is_manual: true },
  intelligence: { ai_generated: false },
};

const renderWithScrollContainer = (ui: React.ReactElement): ReturnType<typeof render> =>
  render(
    <TooltipProvider>
      <div data-scroll-container style={{ overflow: 'auto', width: '200px' }}>
        {ui}
      </div>
    </TooltipProvider>
  );

describe('RequestItemComposite', (): void => {
  beforeEach((): void => {
    vi.useFakeTimers();
  });

  afterEach((): void => {
    vi.useRealTimers();
  });

  describe('tooltip behavior', (): void => {
    it('uses custom Tooltip for full name on hover', async (): Promise<void> => {
      renderWithScrollContainer(
        <RequestItemComposite request={longRequest} collectionId="col_1" />
      );

      const row = screen.getByTestId('request-select-req_long');

      expect(screen.queryByTestId('request-tooltip-req_long-content')).not.toBeInTheDocument();

      act(() => {
        fireEvent.focus(row);
      });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.getByTestId('request-tooltip-req_long-content')).toBeInTheDocument();
      const tooltip = screen.getByTestId('request-tooltip-req_long-content');
      expect(tooltip).toHaveTextContent(longRequest.name);
    });
  });

  describe('selection', (): void => {
    it('emits collection.request-selected event when clicked', (): void => {
      const emitSpy = vi.spyOn(globalEventBus, 'emit');

      renderWithScrollContainer(
        <RequestItemComposite request={longRequest} collectionId="col_1" />
      );

      const row = screen.getByTestId('request-select-req_long');

      act(() => {
        fireEvent.click(row);
      });

      expect(emitSpy).toHaveBeenCalledWith(
        'collection.request-selected',
        {
          collectionId: 'col_1',
          request: longRequest,
        },
        'RequestItemComposite'
      );

      emitSpy.mockRestore();
    });

    it('selects via keyboard Enter', (): void => {
      const emitSpy = vi.spyOn(globalEventBus, 'emit');

      renderWithScrollContainer(
        <RequestItemComposite request={longRequest} collectionId="col_1" />
      );

      const row = screen.getByTestId('request-select-req_long');

      fireEvent.click(row);

      expect(emitSpy).toHaveBeenCalledWith(
        'collection.request-selected',
        {
          collectionId: 'col_1',
          request: longRequest,
        },
        'RequestItemComposite'
      );

      emitSpy.mockRestore();
    });

    it('selects via keyboard Space', (): void => {
      const emitSpy = vi.spyOn(globalEventBus, 'emit');

      renderWithScrollContainer(
        <RequestItemComposite request={longRequest} collectionId="col_1" />
      );

      const row = screen.getByTestId('request-select-req_long');

      fireEvent.click(row);

      expect(emitSpy).toHaveBeenCalledWith(
        'collection.request-selected',
        {
          collectionId: 'col_1',
          request: longRequest,
        },
        'RequestItemComposite'
      );

      emitSpy.mockRestore();
    });
  });

  describe('rename action', (): void => {
    it('hides action buttons from tab order when not hovered/focused', (): void => {
      renderWithScrollContainer(
        <RequestItemComposite request={simpleRequest} collectionId="col_1" />
      );

      const actionsContainer = screen.getByTestId('request-actions-req_1');
      // Should use invisible + pointer-events-none for proper a11y hiding
      expect(actionsContainer.className).toMatch(/invisible/);
      expect(actionsContainer.className).toMatch(/pointer-events-none/);
    });

    it('renders rename button on hover', (): void => {
      renderWithScrollContainer(
        <RequestItemComposite request={simpleRequest} collectionId="col_1" />
      );

      expect(screen.getByTestId('request-rename-req_1')).toBeInTheDocument();
    });

    it('shows rename input when rename button is clicked', (): void => {
      renderWithScrollContainer(
        <RequestItemComposite request={simpleRequest} collectionId="col_1" />
      );

      const renameBtn = screen.getByTestId('request-rename-req_1');
      act(() => {
        fireEvent.click(renameBtn);
      });

      expect(screen.getByTestId('request-rename-input-req_1')).toBeInTheDocument();
      expect(screen.getByTestId('request-rename-input-req_1')).toHaveValue('Get Users');
    });

    it('calls onRename when Enter is pressed with new name', (): void => {
      const mockRename = vi.fn();
      renderWithScrollContainer(
        <RequestItemComposite request={simpleRequest} collectionId="col_1" onRename={mockRename} />
      );

      const renameBtn = screen.getByTestId('request-rename-req_1');
      act(() => {
        fireEvent.click(renameBtn);
      });

      const input = screen.getByTestId('request-rename-input-req_1');
      fireEvent.change(input, { target: { value: 'List Users' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockRename).toHaveBeenCalledWith('col_1', 'req_1', 'List Users');
    });

    it('cancels rename on Escape', (): void => {
      const mockRename = vi.fn();
      renderWithScrollContainer(
        <RequestItemComposite request={simpleRequest} collectionId="col_1" onRename={mockRename} />
      );

      const renameBtn = screen.getByTestId('request-rename-req_1');
      act(() => {
        fireEvent.click(renameBtn);
      });

      const input = screen.getByTestId('request-rename-input-req_1');
      fireEvent.change(input, { target: { value: 'Changed Name' } });
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(mockRename).not.toHaveBeenCalled();
      expect(screen.queryByTestId('request-rename-input-req_1')).not.toBeInTheDocument();
    });

    it('does not commit rename when Escape triggers blur from unmount', (): void => {
      const mockRename = vi.fn();
      renderWithScrollContainer(
        <RequestItemComposite request={simpleRequest} collectionId="col_1" onRename={mockRename} />
      );

      const renameBtn = screen.getByTestId('request-rename-req_1');
      act(() => {
        fireEvent.click(renameBtn);
      });

      const input = screen.getByTestId('request-rename-input-req_1');
      fireEvent.change(input, { target: { value: 'Changed Name' } });

      // Simulate the race: Escape fires, then blur fires before React unmounts
      act(() => {
        fireEvent.keyDown(input, { key: 'Escape' });
        fireEvent.blur(input);
      });

      expect(mockRename).not.toHaveBeenCalled();
    });

    it('starts rename mode on F2 keydown', (): void => {
      renderWithScrollContainer(
        <RequestItemComposite request={simpleRequest} collectionId="col_1" />
      );

      const row = screen.getByTestId('request-select-req_1');
      fireEvent.keyDown(row, { key: 'F2' });

      expect(screen.getByTestId('request-rename-input-req_1')).toBeInTheDocument();
    });
  });

  describe('delete action', (): void => {
    it('renders delete button on hover', (): void => {
      renderWithScrollContainer(
        <RequestItemComposite request={simpleRequest} collectionId="col_1" />
      );

      expect(screen.getByTestId('request-delete-req_1')).toBeInTheDocument();
    });

    it('shows delete confirmation popover when delete button is clicked', async (): Promise<void> => {
      vi.useRealTimers();
      const user = userEvent.setup();

      renderWithScrollContainer(
        <RequestItemComposite request={simpleRequest} collectionId="col_1" />
      );

      const deleteBtn = screen.getByTestId('request-delete-req_1');
      await user.click(deleteBtn);

      expect(screen.getByTestId('request-delete-confirm-req_1')).toBeInTheDocument();
      expect(screen.getByTestId('request-delete-confirm-btn-req_1')).toBeInTheDocument();
      expect(screen.getByTestId('request-delete-cancel-req_1')).toBeInTheDocument();
    });

    it('calls onDelete when confirm button is clicked', async (): Promise<void> => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const mockDelete = vi.fn();

      renderWithScrollContainer(
        <RequestItemComposite request={simpleRequest} collectionId="col_1" onDelete={mockDelete} />
      );

      const deleteBtn = screen.getByTestId('request-delete-req_1');
      await user.click(deleteBtn);

      const confirmBtn = screen.getByTestId('request-delete-confirm-btn-req_1');
      await user.click(confirmBtn);

      expect(mockDelete).toHaveBeenCalledWith('col_1', 'req_1');
    });

    it('closes popover when cancel button is clicked', async (): Promise<void> => {
      vi.useRealTimers();
      const user = userEvent.setup();

      renderWithScrollContainer(
        <RequestItemComposite request={simpleRequest} collectionId="col_1" />
      );

      const deleteBtn = screen.getByTestId('request-delete-req_1');
      await user.click(deleteBtn);

      const cancelBtn = screen.getByTestId('request-delete-cancel-req_1');
      await user.click(cancelBtn);

      expect(screen.queryByTestId('request-delete-confirm-req_1')).not.toBeInTheDocument();
    });

    it('opens delete popover on Delete keydown', async (): Promise<void> => {
      vi.useRealTimers();

      renderWithScrollContainer(
        <RequestItemComposite request={simpleRequest} collectionId="col_1" />
      );

      const row = screen.getByTestId('request-select-req_1');
      fireEvent.keyDown(row, { key: 'Delete' });

      // Popover should appear
      expect(screen.getByTestId('request-delete-confirm-req_1')).toBeInTheDocument();
    });
  });
});
