/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file HeadersPanel component tests
 * @description Tests for the HeadersPanel component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeadersPanel } from './HeadersPanel';

const mockRequestHeaders = {
  'Content-Type': 'application/json',
  Authorization: 'Bearer token123',
};

const mockResponseHeaders = {
  'Content-Type': 'application/json',
  'X-Rate-Limit': '100',
  'X-Rate-Limit-Remaining': '99',
};

describe('HeadersPanel', () => {
  it('renders response headers by default', () => {
    render(
      <HeadersPanel requestHeaders={mockRequestHeaders} responseHeaders={mockResponseHeaders} />
    );

    expect(screen.getByText('Response Headers')).toBeInTheDocument();
    // Headers are displayed with syntax highlighting via CodeSnippet
    // Text is split across multiple spans due to syntax highlighting, so check textContent
    const codeBox = screen.getByTestId('code-box');
    const headersText = codeBox.textContent || '';
    expect(headersText).toContain('Content-Type');
    expect(headersText).toContain('application/json');
    expect(headersText).toContain('X-Rate-Limit');
    expect(headersText).toContain('100');
  });

  it('switches to request headers tab', async () => {
    const user = userEvent.setup();
    render(
      <HeadersPanel requestHeaders={mockRequestHeaders} responseHeaders={mockResponseHeaders} />
    );

    const requestTab = screen.getByRole('tab', { name: /request headers/i });
    await user.click(requestTab);

    // Headers are displayed with syntax highlighting via CodeSnippet
    // Text is split across multiple spans due to syntax highlighting, so check textContent
    const codeBox = screen.getByTestId('code-box');
    const headersText = codeBox.textContent || '';
    expect(headersText).toContain('Authorization');
    expect(headersText).toContain('Bearer token123');
    expect(headersText).toContain('Content-Type');
    expect(headersText).toContain('application/json');
  });

  it('displays empty state when no response headers', () => {
    render(<HeadersPanel requestHeaders={mockRequestHeaders} responseHeaders={{}} />);

    expect(screen.getByText(/no response headers/i)).toBeInTheDocument();
    expect(screen.getByText(/this response has no headers/i)).toBeInTheDocument();
  });

  it('displays empty state when no request headers', async () => {
    const user = userEvent.setup();
    render(<HeadersPanel requestHeaders={{}} responseHeaders={mockResponseHeaders} />);

    const requestTab = screen.getByRole('tab', { name: /request headers/i });
    await user.click(requestTab);

    expect(screen.getByText(/no request headers/i)).toBeInTheDocument();
    expect(screen.getByText(/this request has no headers/i)).toBeInTheDocument();
  });

  it('shows copy button when headers exist', () => {
    render(
      <HeadersPanel requestHeaders={mockRequestHeaders} responseHeaders={mockResponseHeaders} />
    );

    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('hides copy button when no headers', () => {
    render(<HeadersPanel requestHeaders={{}} responseHeaders={{}} />);

    expect(screen.queryByRole('button', { name: /copy/i })).not.toBeInTheDocument();
  });

  it('uses CodeSnippet with http language for syntax highlighting', () => {
    render(
      <HeadersPanel requestHeaders={mockRequestHeaders} responseHeaders={mockResponseHeaders} />
    );

    // CodeSnippet should be rendered
    const codeSnippet = screen.getByTestId('code-snippet');
    expect(codeSnippet).toBeInTheDocument();

    // CodeBox should have http language attribute
    const codeBox = screen.getByTestId('code-box');
    expect(codeBox.querySelector('[data-language="http"]')).toBeInTheDocument();
  });

  it('renders all headers with syntax highlighting via CodeSnippet', () => {
    render(
      <HeadersPanel requestHeaders={mockRequestHeaders} responseHeaders={mockResponseHeaders} />
    );

    // Headers should be displayed with syntax highlighting via CodeSnippet
    const codeSnippet = screen.getByTestId('code-snippet');
    expect(codeSnippet).toBeInTheDocument();

    // Check that all response headers are present in the formatted text
    const codeBox = screen.getByTestId('code-box');
    Object.entries(mockResponseHeaders).forEach(([key, value]) => {
      expect(codeBox).toHaveTextContent(`${key}: ${value}`);
    });
  });
});
