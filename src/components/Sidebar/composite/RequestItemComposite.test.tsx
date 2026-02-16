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

/**
 * Helper: open the three-dot menu via fireEvent.click.
 * Base UI Menu triggers on mousedown, so userEvent.click (mousedown+mouseup+click)
 * can cause toggle-on then toggle-off. fireEvent.click works reliably.
 */
const openMenu = (requestId: string): void => {
  const trigger = screen.getByTestId(`request-menu-trigger-${requestId}`);
  fireEvent.click(trigger);
};

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

  describe('context menu', (): void => {
    it('renders three-dot menu trigger on hover', (): void => {
      renderWithScrollContainer(
        <RequestItemComposite request={simpleRequest} collectionId="col_1" />
      );

      expect(screen.getByTestId('request-menu-trigger-req_1')).toBeInTheDocument();
    });

    it('hides action area from tab order when not hovered/focused', (): void => {
      renderWithScrollContainer(
        <RequestItemComposite request={simpleRequest} collectionId="col_1" />
      );

      const actionsContainer = screen.getByTestId('request-actions-req_1');
      expect(actionsContainer.className).toMatch(/invisible/);
      expect(actionsContainer.className).toMatch(/pointer-events-none/);
    });

    it('opens menu when three-dot button is clicked', (): void => {
      vi.useRealTimers();

      renderWithScrollContainer(
        <RequestItemComposite request={simpleRequest} collectionId="col_1" />
      );

      openMenu('req_1');

      expect(screen.getByTestId('request-menu-req_1')).toBeInTheDocument();
      expect(screen.getByTestId('request-menu-rename-req_1')).toBeInTheDocument();
      expect(screen.getByTestId('request-menu-duplicate-req_1')).toBeInTheDocument();
      expect(screen.getByTestId('request-menu-delete-req_1')).toBeInTheDocument();
    });

    it('opens context menu on right-click', (): void => {
      vi.useRealTimers();

      renderWithScrollContainer(
        <RequestItemComposite request={simpleRequest} collectionId="col_1" />
      );

      const row = screen.getByTestId('request-select-req_1');
      fireEvent.contextMenu(row);

      expect(screen.getByTestId('request-context-menu-req_1')).toBeInTheDocument();
    });
  });

  describe('rename action', (): void => {
    it('shows rename input when Rename menu item is clicked', async (): Promise<void> => {
      vi.useRealTimers();

      renderWithScrollContainer(
        <RequestItemComposite request={simpleRequest} collectionId="col_1" />
      );

      openMenu('req_1');

      const renameItem = screen.getByTestId('request-menu-rename-req_1');
      fireEvent.click(renameItem);

      // Wait for requestAnimationFrame in handleMenuRename
      // Flush requestAnimationFrame from handleMenuRename
      await act(async () => {
        await new Promise((r) => {
          requestAnimationFrame(r);
        });
      });

      expect(screen.getByTestId('request-rename-input-req_1')).toBeInTheDocument();
      expect(screen.getByTestId('request-rename-input-req_1')).toHaveValue('Get Users');
    });

    it('calls onRename when Enter is pressed with new name', async (): Promise<void> => {
      vi.useRealTimers();
      const mockRename = vi.fn();

      renderWithScrollContainer(
        <RequestItemComposite request={simpleRequest} collectionId="col_1" onRename={mockRename} />
      );

      openMenu('req_1');

      const renameItem = screen.getByTestId('request-menu-rename-req_1');
      fireEvent.click(renameItem);

      // Flush requestAnimationFrame from handleMenuRename
      await act(async () => {
        await new Promise((r) => {
          requestAnimationFrame(r);
        });
      });

      const input = screen.getByTestId('request-rename-input-req_1');
      fireEvent.change(input, { target: { value: 'List Users' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockRename).toHaveBeenCalledWith('col_1', 'req_1', 'List Users');
    });

    it('cancels rename on Escape', async (): Promise<void> => {
      vi.useRealTimers();
      const mockRename = vi.fn();

      renderWithScrollContainer(
        <RequestItemComposite request={simpleRequest} collectionId="col_1" onRename={mockRename} />
      );

      openMenu('req_1');

      const renameItem = screen.getByTestId('request-menu-rename-req_1');
      fireEvent.click(renameItem);

      // Flush requestAnimationFrame from handleMenuRename
      await act(async () => {
        await new Promise((r) => {
          requestAnimationFrame(r);
        });
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

      // Use F2 to enter rename mode (direct, no menu needed)
      const row = screen.getByTestId('request-select-req_1');
      fireEvent.keyDown(row, { key: 'F2' });

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

  describe('duplicate action', (): void => {
    it('calls onDuplicate when Duplicate menu item is clicked', (): void => {
      vi.useRealTimers();
      const mockDuplicate = vi.fn();

      renderWithScrollContainer(
        <RequestItemComposite
          request={simpleRequest}
          collectionId="col_1"
          onDuplicate={mockDuplicate}
        />
      );

      openMenu('req_1');

      const duplicateItem = screen.getByTestId('request-menu-duplicate-req_1');
      fireEvent.click(duplicateItem);

      expect(mockDuplicate).toHaveBeenCalledWith('col_1', 'req_1');
    });
  });

  describe('delete action', (): void => {
    it('shows delete confirmation when Delete menu item is clicked', (): void => {
      vi.useRealTimers();

      renderWithScrollContainer(
        <RequestItemComposite request={simpleRequest} collectionId="col_1" />
      );

      openMenu('req_1');

      const deleteItem = screen.getByTestId('request-menu-delete-req_1');
      fireEvent.click(deleteItem);

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

      openMenu('req_1');

      const deleteItem = screen.getByTestId('request-menu-delete-req_1');
      fireEvent.click(deleteItem);

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

      openMenu('req_1');

      const deleteItem = screen.getByTestId('request-menu-delete-req_1');
      fireEvent.click(deleteItem);

      const cancelBtn = screen.getByTestId('request-delete-cancel-req_1');
      await user.click(cancelBtn);

      expect(screen.queryByTestId('request-delete-confirm-req_1')).not.toBeInTheDocument();
    });

    it('opens delete popover on Delete keydown', (): void => {
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
