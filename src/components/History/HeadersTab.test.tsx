/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file HeadersTab component tests
 * @description Tests for the HeadersTab component - main headers tab for expanded panel
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeadersTab } from './HeadersTab';
import type { NetworkHistoryEntry } from '@/types/history';

const mockEntry: NetworkHistoryEntry = {
  id: 'test-1',
  timestamp: new Date().toISOString(),
  request: {
    url: 'https://api.example.com/users',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer token123',
    },
    body: '{"name":"John","email":"john@example.com"}',
    timeout_ms: 30000,
  },
  response: {
    status: 200,
    status_text: 'OK',
    headers: {
      'Content-Type': 'application/json',
      'X-Rate-Limit': '100',
    },
    body: '{"id":1,"name":"John"}',
    timing: {
      total_ms: 156,
      dns_ms: 12,
      connect_ms: 23,
      tls_ms: 34,
      first_byte_ms: 98,
    },
  },
};

describe('HeadersTab', () => {
  it('renders HeadersPanel with entry data', () => {
    render(<HeadersTab entry={mockEntry} />);

    expect(screen.getByRole('tab', { name: /response headers/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /request headers/i })).toBeInTheDocument();
  });

  it('displays response headers by default', () => {
    render(<HeadersTab entry={mockEntry} />);

    // Response headers should be visible
    expect(screen.getByText('X-Rate-Limit')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('includes copy button', () => {
    render(<HeadersTab entry={mockEntry} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    expect(copyButton).toBeInTheDocument();
  });

  it('handles entry with empty request headers', () => {
    const entryWithoutRequestHeaders: NetworkHistoryEntry = {
      ...mockEntry,
      request: {
        ...mockEntry.request,
        headers: {},
      },
    };

    render(<HeadersTab entry={entryWithoutRequestHeaders} />);

    expect(screen.getByRole('tab', { name: /request headers/i })).toBeInTheDocument();
  });

  it('handles entry with empty response headers', () => {
    const entryWithoutResponseHeaders: NetworkHistoryEntry = {
      ...mockEntry,
      response: {
        ...mockEntry.response,
        headers: {},
      },
    };

    render(<HeadersTab entry={entryWithoutResponseHeaders} />);

    expect(screen.getByText(/no response headers/i)).toBeInTheDocument();
  });
});
