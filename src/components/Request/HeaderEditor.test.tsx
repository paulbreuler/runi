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

const createMockStore = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  url: 'https://example.com',
  method: 'GET',
  headers: {},
  setHeaders: vi.fn(),
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
  ...overrides,
});

describe('HeaderEditor', () => {
  const mockSetHeaders = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createMockStore({ setHeaders: mockSetHeaders })
    );
  });

  it('renders empty row when no headers exist', () => {
    render(<HeaderEditor />);
    expect(screen.getByTestId('header-empty-row')).toBeInTheDocument();
    expect(screen.getByTestId('header-empty-row-key')).toBeInTheDocument();
    expect(screen.getByTestId('header-empty-row-value')).toBeInTheDocument();
  });

  it('does not render an add header button', () => {
    render(<HeaderEditor />);
    expect(screen.queryByTestId('add-header-button')).not.toBeInTheDocument();
  });

  it('renders existing headers with empty row below', () => {
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createMockStore({
        headers: { 'Content-Type': 'application/json', 'X-Custom': 'value' },
        setHeaders: mockSetHeaders,
      })
    );

    render(<HeaderEditor />);
    expect(screen.getByTestId('header-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('header-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('header-empty-row')).toBeInTheDocument();
  });

  it('creates a new header when typing in empty row and pressing Enter', async () => {
    const user = userEvent.setup();
    render(<HeaderEditor />);

    const keyInput = screen.getByTestId('header-empty-row-key');
    const valueInput = screen.getByTestId('header-empty-row-value');

    await user.type(keyInput, 'X-Custom-Header');
    await user.click(valueInput);
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

  it('clears empty row on Escape', async () => {
    const user = userEvent.setup();
    render(<HeaderEditor />);

    const keyInput = screen.getByTestId('header-empty-row-key');
    await user.type(keyInput, 'X-Custom');
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.getByTestId('header-empty-row-key')).toHaveValue('');
    });
  });

  it('does not commit empty row when key is blank', async () => {
    const user = userEvent.setup();
    render(<HeaderEditor />);

    const keyInput = screen.getByTestId('header-empty-row-key');
    await user.click(keyInput);
    await user.keyboard('{Enter}');

    expect(mockSetHeaders).not.toHaveBeenCalled();
  });

  it('allows editing existing header', async () => {
    const user = userEvent.setup();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createMockStore({
        headers: { 'Content-Type': 'application/json' },
        setHeaders: mockSetHeaders,
      })
    );

    render(<HeaderEditor />);

    const headerRow = screen.getByTestId('header-row-0');
    await user.click(headerRow);

    await waitFor(() => {
      expect(screen.getByTestId('header-key-input-0')).toBeInTheDocument();
      expect(screen.getByTestId('header-value-input-0')).toBeInTheDocument();
    });
  });

  it('removes header when remove button is clicked', async () => {
    const user = userEvent.setup();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createMockStore({
        headers: { 'X-Custom': 'value' },
        setHeaders: mockSetHeaders,
      })
    );

    render(<HeaderEditor />);

    const removeButton = screen.getByTestId('header-remove-0');
    await user.click(removeButton);

    await waitFor(() => {
      expect(mockSetHeaders).toHaveBeenCalled();
      const lastCall = mockSetHeaders.mock.calls[mockSetHeaders.mock.calls.length - 1];
      if (lastCall?.[0] !== undefined) {
        expect(lastCall[0]['X-Custom']).toBeUndefined();
      }
    });
  });

  it('is keyboard accessible for editing existing headers', async () => {
    const user = userEvent.setup();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createMockStore({
        headers: { 'Content-Type': 'application/json' },
        setHeaders: mockSetHeaders,
      })
    );

    render(<HeaderEditor />);

    const headerRow = screen.getByTestId('header-row-0');
    headerRow.focus();
    expect(headerRow).toHaveFocus();

    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByTestId('header-key-input-0')).toBeInTheDocument();
    });
  });

  it('cancels editing existing header on Escape', async () => {
    const user = userEvent.setup();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createMockStore({
        headers: { 'Content-Type': 'application/json' },
        setHeaders: mockSetHeaders,
      })
    );

    render(<HeaderEditor />);

    const headerRow = screen.getByTestId('header-row-0');
    await user.click(headerRow);

    await waitFor(() => {
      expect(screen.getByTestId('header-key-input-0')).toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByTestId('header-key-input-0')).not.toBeInTheDocument();
      expect(screen.getByTestId('header-row-0')).toBeInTheDocument();
    });
  });

  it('always shows empty row even with headers present', () => {
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createMockStore({
        headers: { Authorization: 'Bearer token123' },
        setHeaders: mockSetHeaders,
      })
    );

    render(<HeaderEditor />);
    expect(screen.getByTestId('header-empty-row')).toBeInTheDocument();
    expect(screen.getByTestId('header-row-0')).toBeInTheDocument();
  });
});
