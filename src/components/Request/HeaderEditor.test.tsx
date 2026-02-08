/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HeaderEditor } from './HeaderEditor';
import { useRequestStore } from '@/stores/useRequestStore';

// Mock the store
vi.mock('@/stores/useRequestStore', () => ({
  useRequestStore: vi.fn(),
}));

describe('HeaderEditor', () => {
  const mockSetHeaders = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      url: 'https://example.com',
      method: 'GET',
      headers: {},
      setHeaders: mockSetHeaders,
      body: '',
      response: null,
      isLoading: false,
      error: null,
      setMethod: vi.fn(),
      setUrl: vi.fn(),
      setBody: vi.fn(),
      setResponse: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      reset: vi.fn(),
    });
  });

  it('renders empty state when no headers', () => {
    render(<HeaderEditor />);
    expect(screen.getByTestId('empty-state-title')).toHaveTextContent('No headers configured');
  });

  it('renders existing headers', () => {
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      url: 'https://example.com',
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'X-Custom': 'value' },
      setHeaders: mockSetHeaders,
      body: '',
      response: null,
      isLoading: false,
      error: null,
      setMethod: vi.fn(),
      setUrl: vi.fn(),
      setBody: vi.fn(),
      setResponse: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      reset: vi.fn(),
    });

    render(<HeaderEditor />);
    expect(screen.getByTestId('header-row-Content-Type')).toBeInTheDocument();
    expect(screen.getByTestId('header-row-X-Custom')).toBeInTheDocument();
  });

  it('shows add header button', () => {
    render(<HeaderEditor />);
    expect(screen.getByTestId('add-header-button')).toBeInTheDocument();
  });

  it('opens add header form when button is clicked', async () => {
    const user = userEvent.setup();
    render(<HeaderEditor />);

    const addButton = screen.getByTestId('add-header-button');
    await user.click(addButton);

    expect(screen.getByTestId('new-header-key-input')).toBeInTheDocument();
    expect(screen.getByTestId('new-header-value-input')).toBeInTheDocument();
  });

  it('saves new header when Enter is pressed', async () => {
    const user = userEvent.setup();
    render(<HeaderEditor />);

    const addButton = screen.getByTestId('add-header-button');
    await user.click(addButton);

    const keyInput = screen.getByTestId('new-header-key-input');
    const valueInput = screen.getByTestId('new-header-value-input');

    await user.type(keyInput, 'X-Custom-Header');
    await user.type(valueInput, 'custom-value');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockSetHeaders).toHaveBeenCalled();
      const lastCall = mockSetHeaders.mock.calls[mockSetHeaders.mock.calls.length - 1];
      if (lastCall?.[0] !== undefined) {
        expect(lastCall[0]['X-Custom-Header']).toBe('custom-value');
      }
    });
  });

  it('cancels editing when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(<HeaderEditor />);

    const addButton = screen.getByTestId('add-header-button');
    await user.click(addButton);

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByTestId('new-header-key-input')).not.toBeInTheDocument();
    });
  });

  it('allows editing existing header', async () => {
    const user = userEvent.setup();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      url: 'https://example.com',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      setHeaders: mockSetHeaders,
      body: '',
      response: null,
      isLoading: false,
      error: null,
      setMethod: vi.fn(),
      setUrl: vi.fn(),
      setBody: vi.fn(),
      setResponse: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      reset: vi.fn(),
    });

    render(<HeaderEditor />);

    const headerRow = screen.getByTestId('header-row-Content-Type');
    await user.click(headerRow);

    await waitFor(() => {
      expect(screen.getByTestId('header-key-input-Content-Type')).toBeInTheDocument();
      expect(screen.getByTestId('header-value-input-Content-Type')).toBeInTheDocument();
    });
  });

  it('removes header when remove button is clicked', async () => {
    const user = userEvent.setup();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      url: 'https://example.com',
      method: 'GET',
      headers: { 'X-Custom': 'value' },
      setHeaders: mockSetHeaders,
      body: '',
      response: null,
      isLoading: false,
      error: null,
      setMethod: vi.fn(),
      setUrl: vi.fn(),
      setBody: vi.fn(),
      setResponse: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      reset: vi.fn(),
    });

    render(<HeaderEditor />);

    const removeButton = screen.getByTestId('remove-header-X-Custom');
    await user.click(removeButton);

    await waitFor(() => {
      expect(mockSetHeaders).toHaveBeenCalled();
      const lastCall = mockSetHeaders.mock.calls[mockSetHeaders.mock.calls.length - 1];
      if (lastCall?.[0] !== undefined) {
        expect(lastCall[0]['X-Custom']).toBeUndefined();
      }
    });
  });

  it('is keyboard accessible for editing', async () => {
    const user = userEvent.setup();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      url: 'https://example.com',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      setHeaders: mockSetHeaders,
      body: '',
      response: null,
      isLoading: false,
      error: null,
      setMethod: vi.fn(),
      setUrl: vi.fn(),
      setBody: vi.fn(),
      setResponse: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      reset: vi.fn(),
    });

    render(<HeaderEditor />);

    const headerRow = screen.getByTestId('header-row-Content-Type');
    headerRow.focus();
    expect(headerRow).toHaveFocus();

    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByTestId('header-key-input-Content-Type')).toBeInTheDocument();
    });
  });
});
