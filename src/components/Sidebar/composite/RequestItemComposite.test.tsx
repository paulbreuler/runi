/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import type { CollectionRequest } from '@/types/collection';
import { RequestItemComposite } from './RequestItemComposite';
import { globalEventBus } from '@/events/bus';

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

const shortRequest: CollectionRequest = {
  id: 'req_short',
  name: 'Short',
  seq: 1,
  method: 'GET',
  url: 'https://api.example.com/short',
  headers: {},
  params: [],
  is_streaming: false,
  tags: [],
  binding: { is_manual: true },
  intelligence: { ai_generated: false, verified: true },
};

const renderWithScrollContainer = (ui: React.ReactElement): ReturnType<typeof render> =>
  render(
    <div data-scroll-container style={{ overflow: 'auto', width: '200px' }}>
      {ui}
    </div>
  );

describe('RequestItemComposite', () => {
  beforeEach((): void => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('popout behavior', () => {
    it('shows popout after hover delay when text is truncated', () => {
      renderWithScrollContainer(
        <RequestItemComposite request={longRequest} collectionId="col_1" />
      );

      const row = screen.getByTestId('request-select-req_long');
      const nameSpan = screen.getByTestId('request-name');

      // Mock truncation
      Object.defineProperty(nameSpan, 'scrollWidth', { value: 300, configurable: true });
      Object.defineProperty(nameSpan, 'clientWidth', { value: 100, configurable: true });

      // Trigger truncation evaluation
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      const wrapper = row.closest('.relative')!;
      act(() => {
        fireEvent.mouseEnter(wrapper);
      });

      // Advance past 250ms hover delay
      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(screen.getByTestId('request-popout')).toBeInTheDocument();
    });

    it('does not show popout when text is not truncated', () => {
      renderWithScrollContainer(
        <RequestItemComposite request={shortRequest} collectionId="col_1" />
      );

      const row = screen.getByTestId('request-select-req_short');
      const nameSpan = screen.getByTestId('request-name');

      // Mock no truncation
      Object.defineProperty(nameSpan, 'scrollWidth', { value: 50, configurable: true });
      Object.defineProperty(nameSpan, 'clientWidth', { value: 100, configurable: true });

      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      const wrapper = row.closest('.relative')!;
      act(() => {
        fireEvent.mouseEnter(wrapper);
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.queryByTestId('request-popout')).not.toBeInTheDocument();
    });

    it('popout shows full request name without truncation', () => {
      renderWithScrollContainer(
        <RequestItemComposite request={longRequest} collectionId="col_1" />
      );

      const row = screen.getByTestId('request-select-req_long');
      const nameSpan = screen.getByTestId('request-name');

      Object.defineProperty(nameSpan, 'scrollWidth', { value: 300, configurable: true });
      Object.defineProperty(nameSpan, 'clientWidth', { value: 100, configurable: true });

      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      const wrapper = row.closest('.relative')!;
      act(() => {
        fireEvent.mouseEnter(wrapper);
      });

      act(() => {
        vi.advanceTimersByTime(250);
      });

      const popout = screen.getByTestId('request-popout');
      expect(popout).toHaveTextContent(longRequest.name);

      // Popout content should NOT have w-full (would constrain width)
      const popoutContent = popout.querySelector('[data-test-id="request-item-content"]');
      expect(popoutContent).not.toBeNull();
      expect(popoutContent!.className).not.toContain('w-full');
    });

    it('dismisses popout on mouse leave', () => {
      renderWithScrollContainer(
        <RequestItemComposite request={longRequest} collectionId="col_1" />
      );

      const row = screen.getByTestId('request-select-req_long');
      const nameSpan = screen.getByTestId('request-name');

      Object.defineProperty(nameSpan, 'scrollWidth', { value: 300, configurable: true });
      Object.defineProperty(nameSpan, 'clientWidth', { value: 100, configurable: true });

      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      const wrapper = row.closest('.relative')!;
      act(() => {
        fireEvent.mouseEnter(wrapper);
      });

      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(screen.getByTestId('request-popout')).toBeInTheDocument();

      act(() => {
        fireEvent.mouseLeave(wrapper);
      });

      expect(screen.queryByTestId('request-popout')).not.toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('emits collection.request-selected event when clicked', () => {
      const emitSpy = vi.spyOn(globalEventBus, 'emit');

      renderWithScrollContainer(
        <RequestItemComposite request={longRequest} collectionId="col_1" />
      );

      const row = screen.getByTestId('request-select-req_long');

      act(() => {
        fireEvent.click(row);
      });

      expect(emitSpy).toHaveBeenCalledWith('collection.request-selected', {
        collectionId: 'col_1',
        request: longRequest,
      });

      emitSpy.mockRestore();
    });

    it('selects via keyboard Enter', () => {
      const emitSpy = vi.spyOn(globalEventBus, 'emit');

      renderWithScrollContainer(
        <RequestItemComposite request={longRequest} collectionId="col_1" />
      );

      const row = screen.getByTestId('request-select-req_long');

      act(() => {
        fireEvent.keyDown(row, { key: 'Enter' });
      });

      expect(emitSpy).toHaveBeenCalledWith('collection.request-selected', {
        collectionId: 'col_1',
        request: longRequest,
      });

      emitSpy.mockRestore();
    });

    it('selects via keyboard Space', () => {
      const emitSpy = vi.spyOn(globalEventBus, 'emit');

      renderWithScrollContainer(
        <RequestItemComposite request={longRequest} collectionId="col_1" />
      );

      const row = screen.getByTestId('request-select-req_long');

      act(() => {
        fireEvent.keyDown(row, { key: ' ' });
      });

      expect(emitSpy).toHaveBeenCalledWith('collection.request-selected', {
        collectionId: 'col_1',
        request: longRequest,
      });

      emitSpy.mockRestore();
    });
  });
});
