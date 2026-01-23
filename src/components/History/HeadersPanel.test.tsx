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
    expect(screen.getByText('Content-Type')).toBeInTheDocument();
    expect(screen.getByText('X-Rate-Limit')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('switches to request headers tab', async () => {
    const user = userEvent.setup();
    render(
      <HeadersPanel requestHeaders={mockRequestHeaders} responseHeaders={mockResponseHeaders} />
    );

    const requestTab = screen.getByRole('tab', { name: /request headers/i });
    await user.click(requestTab);

    expect(screen.getByText('Authorization')).toBeInTheDocument();
    expect(screen.getByText('Bearer token123')).toBeInTheDocument();
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

  it('renders all header rows', () => {
    render(
      <HeadersPanel requestHeaders={mockRequestHeaders} responseHeaders={mockResponseHeaders} />
    );

    // Should render all response headers
    const headerRows = screen.getAllByTestId('header-row');
    expect(headerRows).toHaveLength(Object.keys(mockResponseHeaders).length);
  });
});
