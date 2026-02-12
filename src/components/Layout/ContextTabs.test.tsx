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
    if (typeof HTMLElement.prototype.scrollIntoView !== 'function') {
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
        value: vi.fn(),
        writable: true,
        configurable: true,
      });
    }
  });

  it('renders tabs from context order', () => {
    const { registerContext } = useCanvasStore.getState();

    const context1: CanvasContextDescriptor = {
      id: 'test-1',
      label: 'Context One',
      order: 0,
      panels: {},
      layouts: [],
    };
    const context2: CanvasContextDescriptor = {
      id: 'test-2',
      label: 'Context Two',
      order: 1,
      panels: {},
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
      panels: {},
      layouts: [],
    };

    registerContext(context);

    render(<ContextTabs />);

    const activeTab = screen.getByTestId('context-tab-test-active');
    expect(activeTab).toHaveClass('bg-bg-app');
    expect(activeTab).toHaveClass('rounded-t-lg');
  });

  it('shows arrow buttons when overflow detected', async () => {
    const { registerContext } = useCanvasStore.getState();

    // Register many contexts to trigger overflow
    for (let i = 0; i < 10; i++) {
      registerContext({
        id: `context-${i.toString()}`,
        label: `Very Long Context Name ${i.toString()}`,
        order: i,
        panels: {},
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
        panels: {},
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
      panels: {},
      layouts: [],
    });
    registerContext({
      id: 'context-2',
      label: 'Context 2',
      order: 1,
      panels: {},
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
      panels: {},
      layouts: [],
    });
    registerContext({
      id: 'context-2',
      label: 'Context 2',
      order: 1,
      panels: {},
      layouts: [],
    });

    // Set first as active
    setActiveContext('context-1');

    render(<ContextTabs />);

    const tab2 = screen.getByTestId('context-tab-context-2');
    await user.click(tab2);

    expect(useCanvasStore.getState().activeContextId).toBe('context-2');
  });

  it('scrolls active tab into view when active context changes', async () => {
    const { registerContext, setActiveContext } = useCanvasStore.getState();
    const scrollIntoViewSpy = vi
      .spyOn(HTMLElement.prototype, 'scrollIntoView')
      .mockImplementation(() => undefined);

    registerContext({
      id: 'context-1',
      label: 'Context 1',
      order: 0,
      panels: {},
      layouts: [],
    });
    registerContext({
      id: 'context-2',
      label: 'Context 2',
      order: 1,
      panels: {},
      layouts: [],
    });

    render(<ContextTabs />);

    // Clear mount-time calls before triggering the explicit context change.
    scrollIntoViewSpy.mockClear();

    setActiveContext('context-2');

    await waitFor(() => {
      expect(scrollIntoViewSpy).toHaveBeenCalled();
      const lastCallIndex = scrollIntoViewSpy.mock.calls.length - 1;
      const call = scrollIntoViewSpy.mock.calls[lastCallIndex]?.[0] as
        | ScrollIntoViewOptions
        | undefined;
      expect(call).toMatchObject({
        block: 'nearest',
        inline: 'nearest',
      });
      expect(['auto', 'smooth']).toContain(call?.behavior ?? 'auto');
    });

    scrollIntoViewSpy.mockRestore();
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
      panels: {},
      layouts: [],
    });
    registerContext({
      id: 'context-2',
      label: 'Context 2',
      order: 1,
      panels: {},
      layouts: [],
    });

    setActiveContext('context-1');

    render(<ContextTabs />);

    const inactiveTab = screen.getByTestId('context-tab-context-2');
    expect(inactiveTab).toHaveClass('text-text-secondary');
  });
});

describe('ContextTabs - Close Button (Feature #2)', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('close button shows on hover for request tabs', async () => {
    const user = userEvent.setup();
    const { registerContext } = useCanvasStore.getState();

    // Create a request tab (ID starts with 'request-')
    registerContext({
      id: 'request-12345',
      label: 'GET /api/users',
      order: 0,
      panels: {},
      layouts: [],
    });

    render(<ContextTabs />);

    // Close button should exist with test ID
    const closeButton = screen.getByTestId('close-tab-request-12345');
    expect(closeButton).toBeInTheDocument();

    // Close button should have aria-label
    expect(closeButton).toHaveAttribute('aria-label');

    // Hover should work (opacity changes are CSS, so we just verify the button exists)
    await user.hover(closeButton);
  });

  it('no close button for static contexts', () => {
    const { registerContext } = useCanvasStore.getState();

    // Static context (not a request tab - doesn't start with 'request-')
    registerContext({
      id: 'request',
      label: 'Request Template',
      order: 0,
      panels: {},
      layouts: [],
    });

    render(<ContextTabs />);

    // No close button for non-request-tab contexts
    const closeButton = screen.queryByTestId('close-tab-request');
    expect(closeButton).not.toBeInTheDocument();
  });

  it('clicking close button closes tab', async () => {
    const user = userEvent.setup();
    const { registerContext } = useCanvasStore.getState();

    // Create a request tab
    registerContext({
      id: 'request-12345',
      label: 'GET /api/users',
      order: 0,
      panels: {},
      layouts: [],
    });

    render(<ContextTabs />);

    // Tab should exist
    expect(useCanvasStore.getState().contexts.has('request-12345')).toBe(true);

    // Click close button
    const closeButton = screen.getByTestId('close-tab-request-12345');
    await user.click(closeButton);

    // Tab should be closed
    expect(useCanvasStore.getState().contexts.has('request-12345')).toBe(false);
  });

  it('close button prevents tab activation', async () => {
    const user = userEvent.setup();
    const { registerContext, setActiveContext } = useCanvasStore.getState();

    // Create two request tabs
    registerContext({
      id: 'request-1',
      label: 'GET /api/users',
      order: 0,
      panels: {},
      layouts: [],
    });
    registerContext({
      id: 'request-2',
      label: 'POST /api/users',
      order: 1,
      panels: {},
      layouts: [],
    });

    // Set first tab as active
    setActiveContext('request-1');

    render(<ContextTabs />);

    // Click close button on second tab
    const closeButton = screen.getByTestId('close-tab-request-2');
    await user.click(closeButton);

    // Active tab should still be the first one (not switched to second)
    expect(useCanvasStore.getState().activeContextId).toBe('request-1');

    // Second tab should be closed
    expect(useCanvasStore.getState().contexts.has('request-2')).toBe(false);
  });

  it('close button has keyboard access', () => {
    const { registerContext } = useCanvasStore.getState();

    // Create a request tab
    registerContext({
      id: 'request-12345',
      label: 'GET /api/users',
      order: 0,
      panels: {},
      layouts: [],
    });

    render(<ContextTabs />);

    const closeButton = screen.getByTestId('close-tab-request-12345');

    // Should be a button element (naturally keyboard accessible)
    expect(closeButton.tagName).toBe('BUTTON');

    // Should have aria-label
    expect(closeButton).toHaveAttribute('aria-label');
  });
});
