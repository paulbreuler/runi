/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import type { CollectionRequest } from '@/types/collection';
import { RequestItem } from './RequestItem';
import { TooltipProvider } from '@/components/ui/Tooltip';

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
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a popout after hover delay when truncated', async () => {
    vi.useRealTimers();
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
    fireEvent.mouseEnter(wrapper);

    const popout = await screen.findByTestId('request-popout', {}, { timeout: 1000 });
    expect(popout).toBeInTheDocument();

    fireEvent.mouseLeave(wrapper);

    await waitFor(
      () => {
        expect(screen.queryByTestId('request-popout')).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('does not show a popout when text is not truncated', async () => {
    vi.useRealTimers();
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
    fireEvent.mouseEnter(wrapper);

    // Should not find it even after a delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(screen.queryByTestId('request-popout')).not.toBeInTheDocument();
  });
});
