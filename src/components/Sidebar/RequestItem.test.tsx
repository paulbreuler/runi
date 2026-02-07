/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import type { CollectionRequest } from '@/types/collection';
import { RequestItem } from './RequestItem';

// Mock motion components to avoid animation delays in tests
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<any>): React.JSX.Element => (
      <div {...props}>{children}</div>
    ),
    span: ({ children, ...props }: React.PropsWithChildren<any>): React.JSX.Element => (
      <span {...props}>{children}</span>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<any>): React.JSX.Element => (
    <>{children}</>
  ),
  useReducedMotion: (): boolean => true,
}));

const baseRequest: CollectionRequest = {
  id: 'req_1',
  name: 'A very long request name that should truncate in the UI',
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
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a popout after hover delay when truncated', async () => {
    vi.useFakeTimers();
    render(<RequestItem request={baseRequest} collectionId="col_1" />);

    const row = screen.getByTestId('collection-request-req_1');
    const name = screen.getByTestId('request-name');

    Object.defineProperty(name, 'scrollWidth', { value: 200, configurable: true });
    Object.defineProperty(name, 'clientWidth', { value: 100, configurable: true });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    act(() => {
      fireEvent.mouseEnter(row);
      vi.advanceTimersByTime(260);
    });

    const popout = screen.getByTestId('request-popout');
    expect(popout).toBeInTheDocument();

    act(() => {
      fireEvent.mouseLeave(row);
    });

    expect(screen.queryByTestId('request-popout')).not.toBeInTheDocument();
  });

  it('does not show a popout when text is not truncated', () => {
    vi.useFakeTimers();
    render(<RequestItem request={baseRequest} collectionId="col_1" />);

    const row = screen.getByTestId('collection-request-req_1');
    const name = screen.getByTestId('request-name');

    Object.defineProperty(name, 'scrollWidth', { value: 100, configurable: true });
    Object.defineProperty(name, 'clientWidth', { value: 100, configurable: true });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    act(() => {
      fireEvent.mouseEnter(row);
      vi.advanceTimersByTime(260);
    });

    expect(screen.queryByTestId('request-popout')).not.toBeInTheDocument();
  });
});
