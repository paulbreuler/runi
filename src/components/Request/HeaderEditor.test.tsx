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
    expect(screen.getByText('No headers configured')).toBeInTheDocument();
    expect(screen.getByText('Add headers to customize your request')).toBeInTheDocument();
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
    expect(screen.getByText('Content-Type')).toBeInTheDocument();
    expect(screen.getByText('application/json')).toBeInTheDocument();
    expect(screen.getByText('X-Custom')).toBeInTheDocument();
    expect(screen.getByText('value')).toBeInTheDocument();
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

    expect(screen.getByPlaceholderText('Header name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Header value')).toBeInTheDocument();
  });

  it('saves new header when Enter is pressed', async () => {
    const user = userEvent.setup();
    render(<HeaderEditor />);

    const addButton = screen.getByTestId('add-header-button');
    await user.click(addButton);

    const keyInput = screen.getByPlaceholderText('Header name');
    const valueInput = screen.getByPlaceholderText('Header value');

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
      expect(screen.queryByPlaceholderText('Header name')).not.toBeInTheDocument();
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

    const headerRow = screen.getByText('Content-Type').closest('div');
    if (headerRow !== null) {
      await user.click(headerRow);
    }

    await waitFor(() => {
      expect(screen.getByDisplayValue('Content-Type')).toBeInTheDocument();
      expect(screen.getByDisplayValue('application/json')).toBeInTheDocument();
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

    const headerRow = screen.getByText('X-Custom').closest('div');
    if (headerRow !== null) {
      await user.hover(headerRow);
    }

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

  it('does not save header with empty key', async () => {
    const user = userEvent.setup();
    render(<HeaderEditor />);

    const addButton = screen.getByTestId('add-header-button');
    await user.click(addButton);

    const valueInput = screen.getByPlaceholderText('Header value');
    await user.type(valueInput, 'value-only');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      // Should not call setHeaders with empty key
      const callsWithEmptyKey = mockSetHeaders.mock.calls.filter((call) => {
        const headers = call[0] as Record<string, string>;
        return Object.keys(headers).some((key) => key.trim().length === 0);
      });
      expect(callsWithEmptyKey.length).toBe(0);
    });
  });

  it('handles renaming header key', async () => {
    const user = userEvent.setup();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      url: 'https://example.com',
      method: 'GET',
      headers: { 'Old-Key': 'value' },
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

    const headerRow = screen.getByText('Old-Key').closest('div');
    if (headerRow !== null) {
      await user.click(headerRow);
    }

    await waitFor(() => {
      const keyInput = screen.getByDisplayValue('Old-Key');
      expect(keyInput).toBeInTheDocument();
    });

    const keyInput = screen.getByDisplayValue('Old-Key');
    await user.clear(keyInput);
    await user.type(keyInput, 'New-Key');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockSetHeaders).toHaveBeenCalled();
    });
  });
});
