/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestBuilder } from './RequestBuilder';
import { useRequestStore } from '@/stores/useRequestStore';

// Mock the store
vi.mock('@/stores/useRequestStore', () => ({
  useRequestStore: vi.fn(),
}));

describe('RequestBuilder', () => {
  const mockSetHeaders = vi.fn();
  const mockSetBody = vi.fn();
  const mockSetUrl = vi.fn();

  const createMockStore = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    headers: {},
    body: '',
    url: 'https://httpbin.org/get',
    setHeaders: mockSetHeaders,
    setBody: mockSetBody,
    setUrl: mockSetUrl,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(createMockStore());
  });

  it('renders with tab navigation', () => {
    render(<RequestBuilder />);

    expect(screen.getByTestId('request-tab-headers')).toBeInTheDocument();
    expect(screen.getByTestId('request-tab-body')).toBeInTheDocument();
    expect(screen.getByTestId('request-tab-params')).toBeInTheDocument();
    expect(screen.getByTestId('request-tab-auth')).toBeInTheDocument();
  });

  it('shows Headers tab content by default', () => {
    render(<RequestBuilder />);

    // Should show headers editor
    expect(screen.getByTestId('headers-editor')).toBeInTheDocument();
  });

  it('switches to Body tab when clicked', async () => {
    const user = userEvent.setup();
    render(<RequestBuilder />);

    const bodyTab = screen.getByTestId('request-tab-body');
    await user.click(bodyTab);

    expect(await screen.findByTestId('code-editor')).toBeInTheDocument();
  });

  it('moves focus with arrow keys and activates tab', async () => {
    const user = userEvent.setup();
    render(<RequestBuilder />);

    const headersTab = screen.getByTestId('request-tab-headers');
    const bodyTab = screen.getByTestId('request-tab-body');

    await user.click(headersTab);
    expect(headersTab).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(bodyTab).toHaveFocus();
    expect(await screen.findByTestId('code-editor')).toBeInTheDocument();
  });

  it('tabs from the active tab directly to first interactive content control', async () => {
    const user = userEvent.setup();
    render(<RequestBuilder />);

    const headersTab = screen.getByTestId('request-tab-headers');
    await user.click(headersTab);
    expect(headersTab).toHaveFocus();

    await user.tab();
    expect(screen.getByTestId('add-header-button')).toHaveFocus();
  });

  it('switches to Params tab when clicked', async () => {
    const user = userEvent.setup();
    render(<RequestBuilder />);

    const paramsTab = screen.getByTestId('request-tab-params');
    await user.click(paramsTab);

    expect(await screen.findByTestId('params-editor')).toBeInTheDocument();
  });

  it('switches to Auth tab when clicked', async () => {
    const user = userEvent.setup();
    render(<RequestBuilder />);

    const authTab = screen.getByTestId('request-tab-auth');
    await user.click(authTab);

    expect(await screen.findByTestId('auth-editor')).toBeInTheDocument();
  });

  it('displays empty state when no headers are configured', () => {
    render(<RequestBuilder />);

    expect(screen.getByTestId('headers-empty-state')).toBeInTheDocument();
  });

  it('displays configured headers in Headers tab', () => {
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createMockStore({ headers: { 'Content-Type': 'application/json' } })
    );

    render(<RequestBuilder />);

    expect(screen.getByTestId('remove-header-Content-Type')).toBeInTheDocument();
  });

  it('allows adding a new header', async () => {
    const user = userEvent.setup();
    render(<RequestBuilder />);

    const addButton = screen.getByTestId('add-header-button');
    await user.click(addButton);

    // Should show header input fields
    const keyInput = screen.getByTestId('new-header-key-input');
    const valueInput = screen.getByTestId('new-header-value-input');

    expect(keyInput).toBeInTheDocument();
    expect(valueInput).toBeInTheDocument();
  });

  it('allows removing a header', async () => {
    const user = userEvent.setup();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createMockStore({ headers: { 'X-Custom': 'value' } })
    );

    render(<RequestBuilder />);

    const removeButton = screen.getByTestId('remove-header-X-Custom');
    await user.click(removeButton);

    expect(mockSetHeaders).toHaveBeenCalledWith({});
  });

  it('displays body content in Body tab', async () => {
    const user = userEvent.setup();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createMockStore({ body: '{"key": "value"}' })
    );

    render(<RequestBuilder />);

    // Switch to body tab
    const bodyTab = screen.getByTestId('request-tab-body');
    await user.click(bodyTab);

    const bodyEditor = await screen.findByTestId('code-editor');
    expect(bodyEditor).toBeInTheDocument();
    expect(await screen.findByTestId('code-editor-syntax-layer')).toBeInTheDocument();
    expect(
      screen.getByTestId('code-editor-syntax-layer').querySelector('[data-language="json"]')
    ).toBeTruthy();
  });

  it('updates body when typing in body editor', async () => {
    const user = userEvent.setup();
    render(<RequestBuilder />);

    // Switch to body tab
    const bodyTab = screen.getByTestId('request-tab-body');
    await user.click(bodyTab);

    const bodyTextarea = await screen.findByTestId('code-editor-textarea');
    act(() => {
      fireEvent.change(bodyTextarea, { target: { value: '{"test": true}' } });
    });

    expect(mockSetBody).toHaveBeenCalledWith('{"test": true}');
  });

  it('shows active tab with proper styling', () => {
    render(<RequestBuilder />);

    const headersTab = screen.getByTestId('request-tab-headers');
    expect(headersTab).toHaveClass(/bg-bg-raised|text-text-primary/);
  });

  it('shows inactive tabs with muted styling', () => {
    render(<RequestBuilder />);

    const bodyTab = screen.getByTestId('request-tab-body');
    expect(bodyTab).toHaveClass(/text-text-muted/);
  });

  it('uses compact horizontal padding in the tabs header row', () => {
    render(<RequestBuilder />);

    const headerRow = screen.getByTestId('request-header-bar');
    expect(headerRow).toHaveClass('pl-3');
    expect(headerRow).toHaveClass('pr-2');
  });

  it('shows right overflow cue when tabs overflow', () => {
    render(<RequestBuilder />);

    const tabScroller = screen.getByTestId('request-tabs-scroll');
    Object.defineProperty(tabScroller, 'scrollWidth', { value: 480, configurable: true });
    Object.defineProperty(tabScroller, 'clientWidth', { value: 200, configurable: true });
    Object.defineProperty(tabScroller, 'scrollLeft', {
      value: 0,
      configurable: true,
      writable: true,
    });

    fireEvent.scroll(tabScroller);

    expect(screen.getByTestId('request-tabs-overflow-right')).toBeInTheDocument();
    expect(screen.queryByTestId('request-tabs-overflow-left')).not.toBeInTheDocument();
  });

  it('shows left overflow cue after scrolling tabs', () => {
    render(<RequestBuilder />);

    const tabScroller = screen.getByTestId('request-tabs-scroll');
    Object.defineProperty(tabScroller, 'scrollWidth', { value: 480, configurable: true });
    Object.defineProperty(tabScroller, 'clientWidth', { value: 200, configurable: true });
    Object.defineProperty(tabScroller, 'scrollLeft', {
      value: 120,
      configurable: true,
      writable: true,
    });

    fireEvent.scroll(tabScroller);

    expect(screen.getByTestId('request-tabs-overflow-left')).toBeInTheDocument();
  });

  describe('mock verification', () => {
    it('calls setBody when body content changes', async () => {
      const user = userEvent.setup();
      render(<RequestBuilder />);

      const bodyTab = screen.getByTestId('request-tab-body');
      await user.click(bodyTab);

      const bodyTextarea = await screen.findByTestId('code-editor-textarea');
      act(() => {
        fireEvent.change(bodyTextarea, { target: { value: '{"newKey": "newValue"}' } });
      });

      expect(mockSetBody).toHaveBeenCalledWith('{"newKey": "newValue"}');
    });

    it('calls setHeaders with correct payload when removing a header', async () => {
      const user = userEvent.setup();
      (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockStore({ headers: { 'Content-Type': 'application/json', 'X-Custom': 'value' } })
      );

      render(<RequestBuilder />);

      const removeButton = screen.getByTestId('remove-header-X-Custom');
      await user.click(removeButton);

      expect(mockSetHeaders).toHaveBeenCalledWith({ 'Content-Type': 'application/json' });
    });
  });
});
