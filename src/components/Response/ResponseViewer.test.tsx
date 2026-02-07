/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { ResponseViewer } from './ResponseViewer';
import type { HttpResponse } from '@/types/http';

describe('ResponseViewer', () => {
  const mockResponse: HttpResponse = {
    status: 200,
    status_text: 'OK',
    headers: {
      'content-type': 'application/json',
      'content-length': '100',
    },
    body: '{"args":{},"headers":{"Accept":"*/*","Host":"httpbin.org"},"origin":"127.0.0.1","url":"https://httpbin.org/get"}',
    timing: {
      total_ms: 150,
      dns_ms: 10,
      connect_ms: 20,
      tls_ms: 30,
      first_byte_ms: 40,
    },
  };

  it('renders response viewer with tabs', () => {
    render(<ResponseViewer response={mockResponse} />);

    expect(screen.getByTestId('response-viewer')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Headers')).toBeInTheDocument();
    expect(screen.getByText('Raw')).toBeInTheDocument();
  });

  it('formats JSON with 2-space indentation', () => {
    render(<ResponseViewer response={mockResponse} />);

    const raw = screen.getByTestId('response-body-raw');
    const text = raw.textContent || '';

    // Look for 2-space indentation on nested keys
    expect(text).toMatch(/\n {2}"headers": \{/);
    expect(
      screen.getByTestId('response-body').querySelector('[data-language="json"]')
    ).toBeTruthy();
  });

  it('displays header count', () => {
    render(<ResponseViewer response={mockResponse} />);

    expect(screen.getByText('(2)')).toBeInTheDocument();
  });

  it('displays body size and timing', () => {
    render(<ResponseViewer response={mockResponse} />);

    expect(screen.getByText('150ms')).toBeInTheDocument();
    // Body size should be calculated and displayed
  });

  it('embeds response status badge in the header row as the rightmost element', () => {
    render(<ResponseViewer response={mockResponse} />);

    const headerRow = screen.getByTestId('response-header-bar');
    const statusBadge = within(headerRow).getByTestId('status-badge');
    expect(statusBadge).toBeInTheDocument();

    const rightMeta = within(headerRow).getByTestId('response-header-meta');
    expect(rightMeta.lastElementChild).toBe(statusBadge);
  });

  it('uses compact horizontal padding to maximize tab/header space', () => {
    render(<ResponseViewer response={mockResponse} />);

    const headerRow = screen.getByTestId('response-header-bar');
    expect(headerRow).toHaveClass('pl-3');
    expect(headerRow).toHaveClass('pr-2');
  });

  it('switches between tabs', async () => {
    const user = userEvent.setup();
    render(<ResponseViewer response={mockResponse} />);

    const headersTabLabel = screen.getByText('Headers');
    const headersTab = headersTabLabel.closest('[role="tab"]') ?? headersTabLabel;
    await user.click(headersTab);

    // Headers tab should be active
    expect(headersTab).toHaveClass('font-medium');
  });

  it('displays headers in headers tab', async () => {
    const user = userEvent.setup();
    render(<ResponseViewer response={mockResponse} />);

    // Click headers tab
    const headersTab = screen.getByText('Headers');
    await user.click(headersTab);

    // Should show HTTP status line (react-syntax-highlighter renders in code elements)
    const viewer = screen.getByTestId('response-viewer');
    expect(viewer).toBeInTheDocument();
    // Status code should be visible in the headers tab panel
    const headersPanel = screen.getByRole('tabpanel');
    expect(within(headersPanel).getByText('200')).toBeInTheDocument();
  });

  it('formats raw HTTP response', async () => {
    const user = userEvent.setup();
    render(<ResponseViewer response={mockResponse} />);

    // Click raw tab
    const rawTabLabel = screen.getByText('Raw');
    const rawTab = rawTabLabel.closest('[role="tab"]') ?? rawTabLabel;
    await user.click(rawTab);

    // Raw tab should be active
    expect(rawTab).toHaveClass('font-medium');
    const rawText = screen.getByTestId('response-raw-text').textContent || '';
    expect(rawText).toContain('HTTP/1.1 200 OK');
    expect(screen.getByTestId('response-raw').querySelector('[data-language="http"]')).toBeTruthy();
  });

  it('shows right overflow cue when tabs overflow', () => {
    render(<ResponseViewer response={mockResponse} />);

    const tabScroller = screen.getByLabelText('Response tabs');
    Object.defineProperty(tabScroller, 'scrollWidth', { value: 420, configurable: true });
    Object.defineProperty(tabScroller, 'clientWidth', { value: 160, configurable: true });
    Object.defineProperty(tabScroller, 'scrollLeft', {
      value: 0,
      configurable: true,
      writable: true,
    });

    fireEvent.scroll(tabScroller);

    expect(screen.getByTestId('response-tabs-overflow-right')).toBeInTheDocument();
    expect(screen.queryByTestId('response-tabs-overflow-left')).not.toBeInTheDocument();
  });

  it('shows left overflow cue after scrolling tabs', () => {
    render(<ResponseViewer response={mockResponse} />);

    const tabScroller = screen.getByLabelText('Response tabs');
    Object.defineProperty(tabScroller, 'scrollWidth', { value: 420, configurable: true });
    Object.defineProperty(tabScroller, 'clientWidth', { value: 160, configurable: true });
    Object.defineProperty(tabScroller, 'scrollLeft', {
      value: 120,
      configurable: true,
      writable: true,
    });

    fireEvent.scroll(tabScroller);

    expect(screen.getByTestId('response-tabs-overflow-left')).toBeInTheDocument();
  });

  it('displays copy button in body tab', () => {
    render(<ResponseViewer response={mockResponse} />);

    // Body tab is active by default
    expect(screen.getByLabelText('Copy json code')).toBeInTheDocument();
  });

  it('displays copy button in raw tab', async () => {
    const user = userEvent.setup();
    render(<ResponseViewer response={mockResponse} />);

    // Click raw tab
    const rawTabLabel = screen.getByText('Raw');
    const rawTab = rawTabLabel.closest('[role="tab"]') ?? rawTabLabel;
    await user.click(rawTab);

    // Copy button should be visible with http language label
    expect(screen.getByLabelText('Copy http code')).toBeInTheDocument();
  });

  it('uses CodeSnippet component in body tab', () => {
    render(<ResponseViewer response={mockResponse} />);

    // CodeSnippet should be rendered (has code-editor test id)
    expect(screen.getByTestId('code-editor')).toBeInTheDocument();
  });

  it('uses CodeSnippet component in raw tab', async () => {
    const user = userEvent.setup();
    render(<ResponseViewer response={mockResponse} />);

    // Click raw tab
    const rawTabLabel = screen.getByText('Raw');
    const rawTab = rawTabLabel.closest('[role="tab"]') ?? rawTabLabel;
    await user.click(rawTab);

    // CodeSnippet should be rendered
    expect(screen.getByTestId('code-editor')).toBeInTheDocument();
  });

  it('uses borderless variant in body tab', () => {
    render(<ResponseViewer response={mockResponse} />);

    const codeBox = screen.getByTestId('code-box');
    const innerBox =
      codeBox.querySelector('div[data-language]') ?? codeBox.querySelector('div:last-child');
    // Borderless variant should not have container styling
    expect(innerBox).not.toHaveClass('bg-bg-raised');
    expect(innerBox).not.toHaveClass('border');
    expect(innerBox).not.toHaveClass('rounded');
  });

  it('uses borderless variant in raw tab', async () => {
    const user = userEvent.setup();
    render(<ResponseViewer response={mockResponse} />);

    // Click raw tab
    const rawTabLabel = screen.getByText('Raw');
    const rawTab = rawTabLabel.closest('[role="tab"]') ?? rawTabLabel;
    await user.click(rawTab);

    const codeBox = screen.getByTestId('code-box');
    const innerBox =
      codeBox.querySelector('div[data-language]') ?? codeBox.querySelector('div:last-child');
    // Borderless variant should not have container styling
    expect(innerBox).not.toHaveClass('bg-bg-raised');
    expect(innerBox).not.toHaveClass('border');
    expect(innerBox).not.toHaveClass('rounded');
  });

  it('moves focus with arrow keys', async () => {
    const user = userEvent.setup();
    render(<ResponseViewer response={mockResponse} />);

    const bodyTabLabel = screen.getByText('Body');
    const bodyTab = bodyTabLabel.closest('[role="tab"]') ?? bodyTabLabel;
    const headersTabLabel = screen.getByText('Headers');
    const headersTab = headersTabLabel.closest('[role="tab"]') ?? headersTabLabel;

    await user.click(bodyTab);
    expect(bodyTab).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(headersTab).toHaveFocus();
  });
});
