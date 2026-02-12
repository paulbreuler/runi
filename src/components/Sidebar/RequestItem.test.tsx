/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import type { CollectionRequest } from '@/types/collection';
import { RequestItem } from './RequestItem';
import { TooltipProvider } from '@/components/ui/Tooltip';
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

const baseRequest: CollectionRequest = {
  id: 'req_1',
  name: 'A very long request name that should truncate in the UI because it is definitely longer than one hundred characters to trigger the logic',
  seq: 1,
  method: 'GET',
  url: 'https://httpbin.org/get',
  headers: {},
  params: [],
  is_streaming: false,
  binding: { is_manual: false },
  intelligence: { ai_generated: false },
  tags: [],
};

describe('RequestItem', () => {
  beforeEach((): void => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses custom Tooltip for full name on hover', async (): Promise<void> => {
    render(
      <TooltipProvider>
        <RequestItem request={baseRequest} collectionId="col_1" />
      </TooltipProvider>
    );

    const row = screen.getByTestId('collection-request-req_1');

    // Tooltip content should be hidden initially
    expect(screen.queryByText(baseRequest.name)).not.toBeInTheDocument();

    // Trigger tooltip via focus
    act(() => {
      fireEvent.focus(row);
    });

    // Advance timers past the 100ms delay
    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Now tooltip content should be visible
    expect(screen.getByTestId('request-tooltip-req_1-content')).toBeInTheDocument();
    expect(screen.getByText(baseRequest.name)).toBeInTheDocument();
  });

  describe('Event-driven request selection', (): void => {
    it('emits collection.request-selected event when clicked', (): void => {
      const emitSpy = vi.spyOn(globalEventBus, 'emit');

      render(
        <TooltipProvider>
          <RequestItem request={baseRequest} collectionId="col_1" />
        </TooltipProvider>
      );

      const row = screen.getByTestId('collection-request-req_1');

      act(() => {
        fireEvent.click(row);
      });

      expect(emitSpy).toHaveBeenCalledWith(
        'collection.request-selected',
        { collectionId: 'col_1', request: baseRequest },
        'RequestItem'
      );

      emitSpy.mockRestore();
    });

    it('emits event with correct payload for different requests', (): void => {
      const emitSpy = vi.spyOn(globalEventBus, 'emit');
      const postRequest: CollectionRequest = {
        ...baseRequest,
        id: 'req_2',
        name: 'Create User',
        method: 'POST',
        url: 'https://api.example.com/users',
        body: { type: 'raw', content: '{"name": "Test"}' },
      };

      render(
        <TooltipProvider>
          <RequestItem request={postRequest} collectionId="col_2" />
        </TooltipProvider>
      );

      const row = screen.getByTestId('collection-request-req_2');

      act(() => {
        fireEvent.click(row);
      });

      expect(emitSpy).toHaveBeenCalledWith(
        'collection.request-selected',
        { collectionId: 'col_2', request: postRequest },
        'RequestItem'
      );

      emitSpy.mockRestore();
    });
  });
});
