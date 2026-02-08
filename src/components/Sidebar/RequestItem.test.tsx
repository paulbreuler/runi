/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import type { CollectionRequest } from '@/types/collection';
import { RequestItem } from './RequestItem';
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

  it('shows a popout after hover delay when truncated', () => {
    render(
      <TooltipProvider>
        <RequestItem request={baseRequest} collectionId="col_1" />
      </TooltipProvider>
    );

    const row = screen.getByTestId('collection-request-req_1');
    const name = screen.getByTestId('request-name');

    // Mock truncation conditions
    Object.defineProperty(name, 'scrollWidth', { value: 200, configurable: true });
    Object.defineProperty(name, 'clientWidth', { value: 100, configurable: true });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    const wrapper = row.parentElement!;
    act(() => {
      fireEvent.mouseEnter(wrapper);
    });

    // Advance past the 250ms hover delay
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(screen.getByTestId('request-popout')).toBeInTheDocument();

    act(() => {
      fireEvent.mouseLeave(wrapper);
    });

    expect(screen.queryByTestId('request-popout')).not.toBeInTheDocument();
  });

  it('does not show a popout when text is not truncated', () => {
    const shortRequest = { ...baseRequest, name: 'Short Name' };
    render(
      <TooltipProvider>
        <RequestItem request={shortRequest} collectionId="col_1" />
      </TooltipProvider>
    );

    const row = screen.getByTestId('collection-request-req_1');
    const name = screen.getByTestId('request-name');

    // Mock non-truncation conditions
    Object.defineProperty(name, 'scrollWidth', { value: 100, configurable: true });
    Object.defineProperty(name, 'clientWidth', { value: 100, configurable: true });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    const wrapper = row.parentElement!;
    act(() => {
      fireEvent.mouseEnter(wrapper);
    });

    // Advance past the hover delay
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByTestId('request-popout')).not.toBeInTheDocument();
  });
});
