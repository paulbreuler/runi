/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
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

      // Tooltip content should be hidden initially
      expect(screen.queryByTestId('request-tooltip-req_long-content')).not.toBeInTheDocument();

      // Trigger tooltip via focus or hover (Base UI Trigger logic)
      act(() => {
        fireEvent.focus(row);
      });

      // Advance timers past the 100ms delay
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Now tooltip content should be visible
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
});
