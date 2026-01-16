import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthEditor } from './AuthEditor';
import { useRequestStore } from '@/stores/useRequestStore';

// Mock the store
vi.mock('@/stores/useRequestStore', () => ({
  useRequestStore: vi.fn(),
}));

describe('AuthEditor', () => {
  const mockSetHeaders = vi.fn();
  const mockHeaders = {};

  beforeEach(() => {
    vi.clearAllMocks();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      url: 'https://example.com',
      method: 'GET',
      headers: mockHeaders,
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

  it('renders authentication type selector', () => {
    render(<AuthEditor />);
    expect(screen.getByText('Authentication Type')).toBeInTheDocument();
  });

  it('shows empty state when no auth is configured', () => {
    render(<AuthEditor />);
    expect(screen.getByText('No authentication configured')).toBeInTheDocument();
  });

  it('renders bearer token input when headers contain bearer token', () => {
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      url: 'https://example.com',
      method: 'GET',
      headers: { Authorization: 'Bearer existing-token' },
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

    render(<AuthEditor />);
    expect(screen.getByText('Token')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter bearer token')).toBeInTheDocument();
  });

  it('updates headers when bearer token is entered', async () => {
    const user = userEvent.setup();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      url: 'https://example.com',
      method: 'GET',
      headers: { Authorization: 'Bearer existing' },
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

    render(<AuthEditor />);
    const tokenInput = screen.getByPlaceholderText('Enter bearer token');
    await user.clear(tokenInput);
    await user.type(tokenInput, 'test-token-123');

    await waitFor(() => {
      expect(mockSetHeaders).toHaveBeenCalled();
    });
  });

  it('renders basic auth inputs when headers contain basic auth', () => {
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      url: 'https://example.com',
      method: 'GET',
      headers: { Authorization: 'Basic dGVzdDp0ZXN0' },
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

    render(<AuthEditor />);
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  it('updates headers with basic auth when username and password are entered', async () => {
    const user = userEvent.setup();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      url: 'https://example.com',
      method: 'GET',
      headers: { Authorization: 'Basic dGVzdDp0ZXN0' },
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

    render(<AuthEditor />);
    const usernameInput = screen.getByPlaceholderText('Enter username');
    const passwordInput = screen.getByPlaceholderText('Enter password');

    await user.clear(usernameInput);
    await user.type(usernameInput, 'testuser');
    await user.clear(passwordInput);
    await user.type(passwordInput, 'testpass');

    await waitFor(() => {
      expect(mockSetHeaders).toHaveBeenCalled();
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      url: 'https://example.com',
      method: 'GET',
      headers: { Authorization: 'Basic dGVzdDp0ZXN0' },
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

    render(<AuthEditor />);
    const passwordInput = screen.getByPlaceholderText('Enter password');
    expect(passwordInput.type).toBe('password');

    const toggleButtons = screen.getAllByRole('button');
    const toggleButton = toggleButtons.find((btn) => {
      const svg = btn.querySelector('svg');
      return svg !== null;
    });

    if (toggleButton !== undefined) {
      await user.click(toggleButton);
      await waitFor(() => {
        const updatedInput = screen.getByPlaceholderText('Enter password');
        expect(updatedInput.type).toBe('text');
      });
    }
  });

  it('renders custom header input when headers contain custom auth', () => {
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      url: 'https://example.com',
      method: 'GET',
      headers: { Authorization: 'CustomToken abc123' },
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

    render(<AuthEditor />);
    expect(screen.getByText('Authorization Header')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Enter custom authorization header value')
    ).toBeInTheDocument();
  });

  it('updates headers with custom auth when custom value is entered', async () => {
    const user = userEvent.setup();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      url: 'https://example.com',
      method: 'GET',
      headers: { Authorization: 'CustomToken existing' },
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

    render(<AuthEditor />);
    const customInput = screen.getByPlaceholderText('Enter custom authorization header value');
    await user.clear(customInput);
    await user.type(customInput, 'CustomToken abc123');

    await waitFor(() => {
      expect(mockSetHeaders).toHaveBeenCalled();
    });
  });

  it('renders authentication type selector', () => {
    render(<AuthEditor />);
    expect(screen.getByText('Authentication Type')).toBeInTheDocument();
  });

  it('initializes with bearer token from headers', () => {
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      url: 'https://example.com',
      method: 'GET',
      headers: { Authorization: 'Bearer existing-token' },
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

    render(<AuthEditor />);
    // Should show bearer token input with existing value
    expect(screen.getByDisplayValue('existing-token')).toBeInTheDocument();
  });
});
