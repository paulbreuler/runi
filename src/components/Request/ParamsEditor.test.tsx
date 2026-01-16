import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParamsEditor } from './ParamsEditor';
import { useRequestStore } from '@/stores/useRequestStore';

// Mock the store
vi.mock('@/stores/useRequestStore', () => ({
  useRequestStore: vi.fn(),
}));

describe('ParamsEditor', () => {
  const mockSetUrl = vi.fn();
  const mockUrl = 'https://example.com/test';

  beforeEach(() => {
    vi.clearAllMocks();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      url: mockUrl,
      setUrl: mockSetUrl,
      method: 'GET',
      headers: {},
      body: '',
      response: null,
      isLoading: false,
      error: null,
      setMethod: vi.fn(),
      setHeaders: vi.fn(),
      setBody: vi.fn(),
      setResponse: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      reset: vi.fn(),
    });
  });

  it('renders empty state when no parameters', () => {
    render(<ParamsEditor />);
    expect(screen.getByText('No query parameters')).toBeInTheDocument();
    expect(screen.getByText('Add parameters to append to the URL')).toBeInTheDocument();
  });

  it('renders existing parameters from URL', async () => {
    const urlWithParams = 'https://example.com/test?key1=value1&key2=value2';
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      url: urlWithParams,
      setUrl: mockSetUrl,
      method: 'GET',
      headers: {},
      body: '',
      response: null,
      isLoading: false,
      error: null,
      setMethod: vi.fn(),
      setHeaders: vi.fn(),
      setBody: vi.fn(),
      setResponse: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      reset: vi.fn(),
    });

    render(<ParamsEditor />);
    await waitFor(() => {
      expect(screen.getByText('key1')).toBeInTheDocument();
      expect(screen.getByText('value1')).toBeInTheDocument();
      expect(screen.getByText('key2')).toBeInTheDocument();
      expect(screen.getByText('value2')).toBeInTheDocument();
    });
  });

  it('shows add parameter button', () => {
    render(<ParamsEditor />);
    expect(screen.getByText('Add Parameter')).toBeInTheDocument();
  });

  it('opens add parameter form when button is clicked', async () => {
    const user = userEvent.setup();
    render(<ParamsEditor />);

    const addButton = screen.getByText('Add Parameter');
    await user.click(addButton);

    expect(screen.getByPlaceholderText('Parameter name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Parameter value')).toBeInTheDocument();
  });

  it('saves new parameter when Enter is pressed', async () => {
    const user = userEvent.setup();
    render(<ParamsEditor />);

    const addButton = screen.getByText('Add Parameter');
    await user.click(addButton);

    const keyInput = screen.getByPlaceholderText('Parameter name');
    const valueInput = screen.getByPlaceholderText('Parameter value');

    await user.type(keyInput, 'newKey');
    await user.type(valueInput, 'newValue');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockSetUrl).toHaveBeenCalled();
      const calledUrl = mockSetUrl.mock.calls[0]?.[0] as string;
      expect(calledUrl).toContain('newKey=newValue');
    });
  });

  it('cancels editing when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(<ParamsEditor />);

    const addButton = screen.getByText('Add Parameter');
    await user.click(addButton);

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Parameter name')).not.toBeInTheDocument();
    });
  });

  it('allows editing existing parameter', async () => {
    const user = userEvent.setup();
    const urlWithParams = 'https://example.com/test?key1=value1';
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      url: urlWithParams,
      setUrl: mockSetUrl,
      method: 'GET',
      headers: {},
      body: '',
      response: null,
      isLoading: false,
      error: null,
      setMethod: vi.fn(),
      setHeaders: vi.fn(),
      setBody: vi.fn(),
      setResponse: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      reset: vi.fn(),
    });

    render(<ParamsEditor />);

    await waitFor(() => {
      expect(screen.getByText('key1')).toBeInTheDocument();
    });

    const paramRow = screen.getByText('key1').closest('div');
    if (paramRow !== null) {
      await user.click(paramRow);
    }

    await waitFor(() => {
      expect(screen.getByDisplayValue('key1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('value1')).toBeInTheDocument();
    });
  });

  it('removes parameter when remove button is clicked', async () => {
    const user = userEvent.setup();
    const urlWithParams = 'https://example.com/test?key1=value1';
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      url: urlWithParams,
      setUrl: mockSetUrl,
      method: 'GET',
      headers: {},
      body: '',
      response: null,
      isLoading: false,
      error: null,
      setMethod: vi.fn(),
      setHeaders: vi.fn(),
      setBody: vi.fn(),
      setResponse: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      reset: vi.fn(),
    });

    render(<ParamsEditor />);

    await waitFor(() => {
      expect(screen.getByText('key1')).toBeInTheDocument();
    });

    // Hover to reveal remove button
    const paramRow = screen.getByText('key1').closest('div');
    if (paramRow !== null) {
      await user.hover(paramRow);
    }

    // Find and click remove button (X icon)
    const removeButtons = screen.getAllByRole('button');
    const removeButton = removeButtons.find((btn) => {
      const svg = btn.querySelector('svg');
      return svg !== null && !svg.classList.contains('rotate-45');
    });

    if (removeButton !== undefined) {
      await user.click(removeButton);
    }

    await waitFor(() => {
      expect(mockSetUrl).toHaveBeenCalled();
    });
  });

  it('handles invalid URL gracefully', () => {
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      url: 'not-a-valid-url',
      setUrl: mockSetUrl,
      method: 'GET',
      headers: {},
      body: '',
      response: null,
      isLoading: false,
      error: null,
      setMethod: vi.fn(),
      setHeaders: vi.fn(),
      setBody: vi.fn(),
      setResponse: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      reset: vi.fn(),
    });

    render(<ParamsEditor />);
    // Should render empty state without crashing
    expect(screen.getByText('No query parameters')).toBeInTheDocument();
  });
});
