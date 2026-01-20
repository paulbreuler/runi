/**
 * @file ResponseTab component tests
 * @description Tests for the ResponseTab component - main response tab for expanded panel
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import _userEvent from '@testing-library/user-event';
import { ResponseTab } from './ResponseTab';
import type { NetworkHistoryEntry } from '@/types/history';

const mockEntry: NetworkHistoryEntry = {
  id: 'test-1',
  timestamp: new Date().toISOString(),
  request: {
    url: 'https://api.example.com/users',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"name":"John","email":"john@example.com"}',
    timeout_ms: 30000,
  },
  response: {
    status: 200,
    status_text: 'OK',
    headers: { 'Content-Type': 'application/json' },
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

describe('ResponseTab', () => {
  it('renders ResponsePanel with entry data', () => {
    render(<ResponseTab entry={mockEntry} />);

    expect(screen.getByRole('tab', { name: /response body/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /request body/i })).toBeInTheDocument();
  });

  it('displays response body by default', () => {
    render(<ResponseTab entry={mockEntry} />);

    // Response body content should be visible (JSON contains "John")
    const viewer = screen.getByTestId('body-viewer');
    expect(viewer).toHaveTextContent('John');
  });

  it('includes copy button', () => {
    render(<ResponseTab entry={mockEntry} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    expect(copyButton).toBeInTheDocument();
  });

  it('handles entry with null request body', () => {
    const entryWithoutBody: NetworkHistoryEntry = {
      ...mockEntry,
      request: {
        ...mockEntry.request,
        body: null,
      },
    };

    render(<ResponseTab entry={entryWithoutBody} />);

    expect(screen.getByRole('tab', { name: /request body/i })).toBeInTheDocument();
  });
});
