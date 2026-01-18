import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HistoryEntry } from './HistoryEntry';
import type { HistoryEntry as HistoryEntryType } from '@/types/generated/HistoryEntry';

const mockEntry: HistoryEntryType = {
  id: 'hist_123',
  timestamp: new Date().toISOString(),
  request: {
    url: 'https://api.example.com/users',
    method: 'GET',
    headers: {},
    body: null,
    timeout_ms: 30000,
  },
  response: {
    status: 200,
    status_text: 'OK',
    headers: {},
    body: '{"users": []}',
    timing: {
      total_ms: 150,
      dns_ms: null,
      connect_ms: null,
      tls_ms: null,
      first_byte_ms: null,
    },
  },
};

describe('HistoryEntry', () => {
  it('should render method badge with correct color', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(<HistoryEntry entry={mockEntry} onSelect={onSelect} onDelete={onDelete} />);

    const methodBadge = screen.getByText('GET');
    expect(methodBadge).toBeInTheDocument();
    // GET should have blue color class
    expect(methodBadge.className).toContain('bg-signal-info');
  });

  it('should render truncated URL', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(<HistoryEntry entry={mockEntry} onSelect={onSelect} onDelete={onDelete} />);

    expect(screen.getByText(/api.example.com\/users/)).toBeInTheDocument();
  });

  it('should render relative timestamp', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    // Use a timestamp from 2 minutes ago
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const entry: HistoryEntryType = {
      ...mockEntry,
      timestamp: twoMinutesAgo,
    };

    render(<HistoryEntry entry={entry} onSelect={onSelect} onDelete={onDelete} />);

    expect(screen.getByText(/ago/i)).toBeInTheDocument();
  });

  it('should call onSelect when clicked', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(<HistoryEntry entry={mockEntry} onSelect={onSelect} onDelete={onDelete} />);

    const entryElement = screen.getByTestId(`history-entry-${mockEntry.id}`);
    entryElement.click();

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(mockEntry);
  });

  it('should call onDelete when delete button is clicked', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(<HistoryEntry entry={mockEntry} onSelect={onSelect} onDelete={onDelete} />);

    const deleteButton = screen.getByLabelText(/delete/i);
    deleteButton.click();

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(mockEntry.id);
  });

  it('should display different method colors correctly', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    const methods = [
      { method: 'GET', expectedColor: 'bg-signal-info' },
      { method: 'POST', expectedColor: 'bg-signal-success' },
      { method: 'PUT', expectedColor: 'bg-signal-warning' },
      { method: 'DELETE', expectedColor: 'bg-signal-error' },
    ];

    methods.forEach(({ method, expectedColor }) => {
      const entry: HistoryEntryType = {
        ...mockEntry,
        request: { ...mockEntry.request, method },
      };

      const { unmount } = render(
        <HistoryEntry entry={entry} onSelect={onSelect} onDelete={onDelete} />
      );

      const methodBadge = screen.getByText(method);
      expect(methodBadge.className).toContain(expectedColor);

      unmount();
    });
  });
});
