/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContextTabs } from './ContextTabs';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { useRequestStoreRaw } from '@/stores/useRequestStore';
import { globalEventBus } from '@/events/bus';
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
    expect(screen.getByTestId('context-tab-test-1')).toHaveTextContent('Context One');
    expect(screen.getByTestId('context-tab-test-2')).toHaveTextContent('Context Two');
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

  it('always shows arrow buttons', async () => {
    const { registerContext } = useCanvasStore.getState();

    registerContext({
      id: 'context-1',
      label: 'Context 1',
      order: 0,
      panels: {},
      layouts: [],
    });

    render(<ContextTabs />);

    expect(screen.getByTestId('context-tabs-arrow-left')).toBeInTheDocument();
    expect(screen.getByTestId('context-tabs-arrow-right')).toBeInTheDocument();
  });

  it('arrow buttons scroll by tab width when overflowed', async () => {
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

      expect(scrollBy).toHaveBeenCalledWith(
        expect.objectContaining({
          left: 200,
          behavior: expect.stringMatching(/^(smooth|auto)$/),
        })
      );
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

  it('both arrow buttons are on the left side of the scroll container', async () => {
    const { registerContext } = useCanvasStore.getState();

    // Register many contexts to trigger overflow
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
    const scrollContainer = screen.getByTestId('context-tabs-scroll');

    // Mock overflow
    Object.defineProperty(scrollContainer, 'scrollWidth', { value: 1000, configurable: true });
    Object.defineProperty(scrollContainer, 'clientWidth', { value: 500, configurable: true });
    Object.defineProperty(scrollContainer, 'scrollLeft', { value: 100, configurable: true });

    await waitFor(() => {
      scrollContainer.dispatchEvent(new Event('scroll'));
    });

    await waitFor(() => {
      const leftArrow = screen.getByTestId('context-tabs-arrow-left');
      const rightArrow = screen.getByTestId('context-tabs-arrow-right');
      const scrollArea = screen.getByTestId('context-tabs-scroll');

      // Check DOM order: leftArrow, then rightArrow, then scrollArea
      const allElements = Array.from(container.querySelectorAll('*'));
      const leftIndex = allElements.indexOf(leftArrow);
      const rightIndex = allElements.indexOf(rightArrow);
      const scrollIndex = allElements.indexOf(scrollArea);

      expect(leftIndex).toBeLessThan(rightIndex);
      expect(rightIndex).toBeLessThan(scrollIndex);
    });
  });

  it('active tab has correct styling and dimensions', () => {
    const { registerContext, setActiveContext } = useCanvasStore.getState();

    registerContext({
      id: 'active-tab',
      label: 'Active Tab',
      order: 0,
      panels: {},
      layouts: [],
    });
    setActiveContext('active-tab');

    render(<ContextTabs />);

    const activeTab = screen.getByTestId('context-tab-active-tab');
    // Check for smaller dimensions (max-w-[180px] or similar)
    expect(activeTab).toHaveClass('max-w-[180px]');
    // Check for "full tab" feel (no bottom border, merges into app)
    expect(activeTab).toHaveClass('bg-bg-app');
    expect(activeTab).not.toHaveClass('border-b');
  });
});

describe('ContextTabs - Close Button (Feature #2)', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('close button is hidden by default and shows on group hover', async () => {
    const { registerContext } = useCanvasStore.getState();

    registerContext({
      id: 'request-1',
      label: 'Request 1',
      order: 0,
      panels: {},
      layouts: [],
    });

    render(<ContextTabs />);

    const closeButton = screen.getByTestId('close-tab-request-1');
    // It should have opacity-0 and group-hover:opacity-100
    expect(closeButton).toHaveClass('opacity-0');
    expect(closeButton).toHaveClass('group-hover:opacity-100');
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
      id: 'blueprint',
      label: 'Blueprint',
      order: 0,
      panels: {},
      layouts: [],
    });

    render(<ContextTabs />);

    // No close button for non-request-tab contexts
    const closeButton = screen.queryByTestId('close-tab-blueprint');
    expect(closeButton).not.toBeInTheDocument();
  });

  it('templates do not appear as tabs', () => {
    const { registerTemplate } = useCanvasStore.getState();

    // Register template
    registerTemplate({
      id: 'request',
      label: 'Request Template',
      contextType: 'request',
      order: 0,
      panels: {},
      layouts: [],
    });

    render(<ContextTabs />);

    // Template should not appear as a tab
    expect(screen.queryByTestId('context-tab-request')).not.toBeInTheDocument();
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

describe('ContextTabs - Context Menu', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('shows context menu on right-click of ephemeral tab', async () => {
    const user = userEvent.setup();
    const { registerContext, setActiveContext } = useCanvasStore.getState();

    registerContext({
      id: 'request-eph-1',
      label: 'GET /api/test',
      order: 0,
      panels: {},
      layouts: [],
    });
    setActiveContext('request-eph-1');

    render(<ContextTabs />);

    const tab = screen.getByTestId('context-tab-request-eph-1');
    await user.pointer({ keys: '[MouseRight]', target: tab });

    await waitFor(() => {
      expect(screen.getByTestId('tab-menu-save-to-collection')).toBeInTheDocument();
    });
  });

  it('does not show "Save to Collection" for collection-sourced tabs', async () => {
    const user = userEvent.setup();
    const { registerContext, setActiveContext, updateContextState } = useCanvasStore.getState();

    registerContext({
      id: 'request-col-1',
      label: 'GET /api/users',
      order: 0,
      panels: {},
      layouts: [],
    });
    setActiveContext('request-col-1');
    updateContextState('request-col-1', {
      source: { type: 'collection', collectionId: 'col-1', requestId: 'req-1' },
    });

    render(<ContextTabs />);

    const tab = screen.getByTestId('context-tab-request-col-1');
    await user.pointer({ keys: '[MouseRight]', target: tab });

    await waitFor(() => {
      expect(screen.queryByTestId('tab-menu-save-to-collection')).not.toBeInTheDocument();
    });
  });
});

describe('ContextTabs - Visual Indicator', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('shows italic text for ephemeral (unsaved) tabs', () => {
    const { registerContext, setActiveContext } = useCanvasStore.getState();

    registerContext({
      id: 'request-eph-2',
      label: 'New Request',
      order: 0,
      panels: {},
      layouts: [],
    });
    setActiveContext('request-eph-2');

    render(<ContextTabs />);

    const tab = screen.getByTestId('context-tab-request-eph-2');
    const label = screen.getByTestId('context-tab-label-request-eph-2');
    expect(label).toHaveClass('italic');
  });

  it('shows collection indicator for collection-sourced tabs', () => {
    const { registerContext, setActiveContext, updateContextState } = useCanvasStore.getState();

    registerContext({
      id: 'request-col-2',
      label: 'GET /api/users',
      order: 0,
      panels: {},
      layouts: [],
    });
    setActiveContext('request-col-2');
    updateContextState('request-col-2', {
      source: { type: 'collection', collectionId: 'col-1', requestId: 'req-1' },
      isSaved: true,
    });

    render(<ContextTabs />);

    const indicator = screen.getByTestId('tab-collection-indicator-request-col-2');
    expect(indicator).toBeInTheDocument();
  });

  it('does not show collection indicator for ephemeral tabs', () => {
    const { registerContext, setActiveContext } = useCanvasStore.getState();

    registerContext({
      id: 'request-eph-3',
      label: 'New Request',
      order: 0,
      panels: {},
      layouts: [],
    });
    setActiveContext('request-eph-3');

    render(<ContextTabs />);

    expect(screen.queryByTestId('tab-collection-indicator-request-eph-3')).not.toBeInTheDocument();
  });

  it('renders request tab label with data-test-id', () => {
    const { registerContext, setActiveContext } = useCanvasStore.getState();

    registerContext({
      id: 'request-label-1',
      label: 'Label Check',
      order: 0,
      panels: {},
      layouts: [],
    });
    setActiveContext('request-label-1');

    render(<ContextTabs />);

    expect(screen.getByTestId('context-tab-label-request-label-1')).toHaveTextContent(
      'Label Check'
    );
  });
});

describe('ContextTabs - Save Errors', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
    useCollectionStore.setState({
      collections: [],
      summaries: [],
      selectedCollectionId: null,
      selectedRequestId: null,
      expandedCollectionIds: new Set(),
      pendingRenameId: null,
      pendingRequestRenameId: null,
      isLoading: false,
      error: null,
    });
    useRequestStoreRaw.setState({ contexts: {} });
  });

  it('keeps save dialog open and shows error when save fails', async () => {
    const user = userEvent.setup();
    const saveTabToCollection = vi.fn().mockResolvedValue(null);

    useCollectionStore.setState({
      summaries: [
        {
          id: 'col-1',
          name: 'Collection One',
          request_count: 0,
          source_type: 'manual',
          modified_at: '',
        },
      ],
      error: 'Save failed from store',
      saveTabToCollection,
    });
    useRequestStoreRaw.getState().initContext('request-eph-fail', {
      method: 'POST',
      url: 'https://example.com/fail',
      headers: {},
      body: 'hello',
    });

    const { registerContext, setActiveContext } = useCanvasStore.getState();
    registerContext({
      id: 'request-eph-fail',
      label: 'Will Fail',
      order: 0,
      panels: {},
      layouts: [],
    });
    setActiveContext('request-eph-fail');

    render(<ContextTabs />);

    globalEventBus.emit('tab.save-requested', {});

    await waitFor(() => {
      expect(screen.getByTestId('save-to-collection-dialog')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('collection-picker'));
    await waitFor(() => {
      expect(screen.getByTestId('collection-option-col-1')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('collection-option-col-1'));

    const nameInput = screen.getByTestId('request-name-input');
    await user.clear(nameInput);
    await user.type(nameInput, 'Failed Save');
    await user.click(screen.getByTestId('save-button'));

    await waitFor(() => {
      expect(saveTabToCollection).toHaveBeenCalled();
      expect(screen.getByTestId('save-to-collection-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('save-to-collection-error')).toHaveTextContent(
        'Save failed from store'
      );
    });
  });
});
