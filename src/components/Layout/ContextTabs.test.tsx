/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContextTabs } from './ContextTabs';
import { useCanvasStore } from '@/stores/useCanvasStore';
import type { CanvasContextDescriptor } from '@/types/canvas';

describe('ContextTabs', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('renders tabs from context order', () => {
    const { registerContext } = useCanvasStore.getState();

    const context1: CanvasContextDescriptor = {
      id: 'test-1',
      label: 'Context One',
      order: 0,
      layouts: [],
    };
    const context2: CanvasContextDescriptor = {
      id: 'test-2',
      label: 'Context Two',
      order: 1,
      layouts: [],
    };

    registerContext(context1);
    registerContext(context2);

    render(<ContextTabs />);

    expect(screen.getByTestId('context-tab-test-1')).toBeInTheDocument();
    expect(screen.getByTestId('context-tab-test-2')).toBeInTheDocument();
    expect(screen.getByText('Context One')).toBeInTheDocument();
    expect(screen.getByText('Context Two')).toBeInTheDocument();
  });

  it('shows active tab with Manila folder styling', () => {
    const { registerContext } = useCanvasStore.getState();

    const context: CanvasContextDescriptor = {
      id: 'test-active',
      label: 'Active Context',
      order: 0,
      layouts: [],
    };

    registerContext(context);

    render(<ContextTabs />);

    const activeTab = screen.getByTestId('context-tab-test-active');
    expect(activeTab).toHaveClass('bg-bg-app');
    expect(activeTab).toHaveClass('rounded-t-md');
  });

  it('shows arrow buttons when overflow detected', async () => {
    const { registerContext } = useCanvasStore.getState();

    // Register many contexts to trigger overflow
    for (let i = 0; i < 10; i++) {
      registerContext({
        id: `context-${i.toString()}`,
        label: `Very Long Context Name ${i.toString()}`,
        order: i,
        layouts: [],
      });
    }

    const { container } = render(<ContextTabs />);
    const scrollContainer = container.querySelector('[data-test-id="context-tabs-scroll"]');

    // Mock overflow by setting scroll properties
    if (scrollContainer) {
      Object.defineProperty(scrollContainer, 'scrollWidth', {
        value: 1000,
        configurable: true,
      });
      Object.defineProperty(scrollContainer, 'clientWidth', {
        value: 500,
        configurable: true,
      });
      Object.defineProperty(scrollContainer, 'scrollLeft', {
        value: 100,
        configurable: true,
      });

      // Trigger scroll event to update state
      await waitFor(() => {
        scrollContainer.dispatchEvent(new Event('scroll'));
      });
    }

    await waitFor(
      () => {
        expect(screen.queryByTestId('context-tabs-arrow-left')).toBeInTheDocument();
        expect(screen.queryByTestId('context-tabs-arrow-right')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('arrow buttons scroll by tab width', async () => {
    const { registerContext } = useCanvasStore.getState();
    const user = userEvent.setup();

    // Register many contexts
    for (let i = 0; i < 10; i++) {
      registerContext({
        id: `context-${i.toString()}`,
        label: `Context ${i.toString()}`,
        order: i,
        layouts: [],
      });
    }

    const { container } = render(<ContextTabs />);
    const scrollContainer = container.querySelector('[data-test-id="context-tabs-scroll"]');

    if (scrollContainer) {
      // Mock overflow
      Object.defineProperty(scrollContainer, 'scrollWidth', {
        value: 1000,
        configurable: true,
      });
      Object.defineProperty(scrollContainer, 'clientWidth', {
        value: 500,
        configurable: true,
      });
      Object.defineProperty(scrollContainer, 'scrollLeft', {
        value: 100,
        configurable: true,
      });

      const scrollBy = vi.fn();
      scrollContainer.scrollBy = scrollBy;

      // Trigger scroll event
      await waitFor(() => {
        scrollContainer.dispatchEvent(new Event('scroll'));
      });

      await waitFor(
        () => {
          expect(screen.queryByTestId('context-tabs-arrow-right')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      const rightArrow = screen.getByTestId('context-tabs-arrow-right');
      await user.click(rightArrow);

      expect(scrollBy).toHaveBeenCalledWith({ left: 200, behavior: 'smooth' });
    }
  });

  it('keyboard navigation works with arrow keys', async () => {
    const { registerContext } = useCanvasStore.getState();
    const user = userEvent.setup();

    registerContext({
      id: 'context-1',
      label: 'Context 1',
      order: 0,
      layouts: [],
    });
    registerContext({
      id: 'context-2',
      label: 'Context 2',
      order: 1,
      layouts: [],
    });

    render(<ContextTabs />);

    const tab1 = screen.getByTestId('context-tab-context-1');
    const tab2 = screen.getByTestId('context-tab-context-2');

    // Focus first tab
    tab1.focus();
    expect(tab1).toHaveFocus();

    // Press right arrow
    await user.keyboard('{ArrowRight}');

    // Should focus second tab
    await waitFor(() => {
      expect(tab2).toHaveFocus();
    });

    // Press left arrow
    await user.keyboard('{ArrowLeft}');

    // Should focus first tab again
    await waitFor(() => {
      expect(tab1).toHaveFocus();
    });
  });

  it('tab click sets active context', async () => {
    const { registerContext, setActiveContext } = useCanvasStore.getState();
    const user = userEvent.setup();

    registerContext({
      id: 'context-1',
      label: 'Context 1',
      order: 0,
      layouts: [],
    });
    registerContext({
      id: 'context-2',
      label: 'Context 2',
      order: 1,
      layouts: [],
    });

    // Set first as active
    setActiveContext('context-1');

    render(<ContextTabs />);

    const tab2 = screen.getByTestId('context-tab-context-2');
    await user.click(tab2);

    expect(useCanvasStore.getState().activeContextId).toBe('context-2');
  });

  it('returns null when no contexts registered', () => {
    const { container } = render(<ContextTabs />);
    expect(container.firstChild).toBeNull();
  });

  it('inactive tabs have secondary text styling', () => {
    const { registerContext, setActiveContext } = useCanvasStore.getState();

    registerContext({
      id: 'context-1',
      label: 'Context 1',
      order: 0,
      layouts: [],
    });
    registerContext({
      id: 'context-2',
      label: 'Context 2',
      order: 1,
      layouts: [],
    });

    setActiveContext('context-1');

    render(<ContextTabs />);

    const inactiveTab = screen.getByTestId('context-tab-context-2');
    expect(inactiveTab).toHaveClass('text-text-secondary');
  });
});
