/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParamsEditor } from './ParamsEditor';
import { useRequestStore } from '@/stores/useRequestStore';

// Mock the store
vi.mock('@/stores/useRequestStore', () => ({
  useRequestStore: vi.fn(),
}));

const createMockStore = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  url: 'https://example.com/test',
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

describe('ParamsEditor', () => {
  const mockSetUrl = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createMockStore({ setUrl: mockSetUrl })
    );
  });

  it('renders empty row when no parameters exist', () => {
    render(<ParamsEditor />);
    expect(screen.getByTestId('param-empty-row')).toBeInTheDocument();
    expect(screen.getByTestId('param-empty-row-key')).toBeInTheDocument();
    expect(screen.getByTestId('param-empty-row-value')).toBeInTheDocument();
  });

  it('does not render an add param button', () => {
    render(<ParamsEditor />);
    expect(screen.queryByTestId('add-param-button')).not.toBeInTheDocument();
  });

  it('renders existing parameters from URL', async () => {
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createMockStore({
        url: 'https://example.com/test?key1=value1&key2=value2',
        setUrl: mockSetUrl,
      })
    );

    render(<ParamsEditor />);
    await waitFor(() => {
      expect(screen.getByTestId('param-row-0')).toBeInTheDocument();
      expect(screen.getByTestId('param-row-1')).toBeInTheDocument();
    });
  });

  it('creates new parameter when typing in empty row and pressing Enter', async () => {
    const user = userEvent.setup();
    render(<ParamsEditor />);

    const keyInput = screen.getByTestId('param-empty-row-key');
    const valueInput = screen.getByTestId('param-empty-row-value');

    await user.type(keyInput, 'newKey');
    await user.click(valueInput);
    await user.type(valueInput, 'newValue');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockSetUrl).toHaveBeenCalled();
      const calledUrl = mockSetUrl.mock.calls[0]?.[0] as string;
      expect(calledUrl).toContain('newKey=newValue');
    });
  });

  it('cancels empty row on Escape', async () => {
    const user = userEvent.setup();
    render(<ParamsEditor />);

    const keyInput = screen.getByTestId('param-empty-row-key');
    await user.type(keyInput, 'tempKey');
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.getByTestId('param-empty-row-key')).toHaveValue('');
    });
  });

  it('allows editing existing parameter', async () => {
    const user = userEvent.setup();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createMockStore({
        url: 'https://example.com/test?key1=value1',
        setUrl: mockSetUrl,
      })
    );

    render(<ParamsEditor />);

    await waitFor(() => {
      expect(screen.getByTestId('param-row-0')).toBeInTheDocument();
    });

    const paramRow = screen.getByTestId('param-row-0');
    await user.click(paramRow);

    await waitFor(() => {
      expect(screen.getByTestId('param-key-input-0')).toBeInTheDocument();
      expect(screen.getByTestId('param-value-input-0')).toBeInTheDocument();
    });
  });

  it('removes parameter when remove button is clicked', async () => {
    const user = userEvent.setup();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createMockStore({
        url: 'https://example.com/test?key1=value1',
        setUrl: mockSetUrl,
      })
    );

    render(<ParamsEditor />);

    await waitFor(() => {
      expect(screen.getByTestId('param-row-0')).toBeInTheDocument();
    });

    const removeButton = screen.getByTestId('param-remove-0');
    await user.click(removeButton);

    await waitFor(() => {
      expect(mockSetUrl).toHaveBeenCalled();
    });
  });

  it('handles invalid URL gracefully', () => {
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createMockStore({
        url: 'not-a-valid-url',
        setUrl: mockSetUrl,
      })
    );

    render(<ParamsEditor />);
    // Should render empty row without crashing
    expect(screen.getByTestId('param-empty-row')).toBeInTheDocument();
  });

  it('always shows empty row even with params present', () => {
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createMockStore({
        url: 'https://example.com/test?page=1',
        setUrl: mockSetUrl,
      })
    );

    render(<ParamsEditor />);
    expect(screen.getByTestId('param-empty-row')).toBeInTheDocument();
    expect(screen.getByTestId('param-row-0')).toBeInTheDocument();
  });
});
