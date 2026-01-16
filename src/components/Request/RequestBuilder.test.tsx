import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestBuilder } from './RequestBuilder';
import { useRequestStore } from '@/stores/useRequestStore';

// Mock the store
vi.mock('@/stores/useRequestStore', () => ({
  useRequestStore: vi.fn(),
}));

describe('RequestBuilder', () => {
  const mockSetHeaders = vi.fn();
  const mockSetBody = vi.fn();
  const mockSetUrl = vi.fn();

  const createMockStore = (overrides = {}) => ({
    headers: {},
    body: '',
    url: 'https://httpbin.org/get',
    setHeaders: mockSetHeaders,
    setBody: mockSetBody,
    setUrl: mockSetUrl,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(createMockStore());
  });

  it('renders with tab navigation', () => {
    render(<RequestBuilder />);
    
    expect(screen.getByText('Headers')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Params')).toBeInTheDocument();
    expect(screen.getByText('Auth')).toBeInTheDocument();
  });

  it('shows Headers tab content by default', () => {
    render(<RequestBuilder />);
    
    // Should show headers editor
    expect(screen.getByTestId('headers-editor')).toBeInTheDocument();
  });

  it('switches to Body tab when clicked', async () => {
    const user = userEvent.setup();
    render(<RequestBuilder />);
    
    const bodyTab = screen.getByText('Body');
    await user.click(bodyTab);
    
    expect(screen.getByTestId('body-editor')).toBeInTheDocument();
  });

  it('switches to Params tab when clicked', async () => {
    const user = userEvent.setup();
    render(<RequestBuilder />);
    
    const paramsTab = screen.getByText('Params');
    await user.click(paramsTab);
    
    expect(screen.getByTestId('params-editor')).toBeInTheDocument();
  });

  it('switches to Auth tab when clicked', async () => {
    const user = userEvent.setup();
    render(<RequestBuilder />);
    
    const authTab = screen.getByText('Auth');
    await user.click(authTab);
    
    expect(screen.getByTestId('auth-editor')).toBeInTheDocument();
  });

  it('displays empty state when no headers are configured', () => {
    render(<RequestBuilder />);
    
    expect(screen.getByText(/No headers configured/i)).toBeInTheDocument();
  });

  it('displays configured headers in Headers tab', () => {
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createMockStore({ headers: { 'Content-Type': 'application/json' } })
    );
    
    render(<RequestBuilder />);
    
    expect(screen.getByText('Content-Type')).toBeInTheDocument();
    expect(screen.getByText('application/json')).toBeInTheDocument();
  });

  it('allows adding a new header', async () => {
    const user = userEvent.setup();
    render(<RequestBuilder />);
    
    const addButton = screen.getByTestId('add-header-button');
    await user.click(addButton);
    
    // Should show header input fields
    const keyInput = screen.getByPlaceholderText(/header name/i);
    const valueInput = screen.getByPlaceholderText(/header value/i);
    
    expect(keyInput).toBeInTheDocument();
    expect(valueInput).toBeInTheDocument();
  });

  it('allows removing a header', async () => {
    const user = userEvent.setup();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createMockStore({ headers: { 'X-Custom': 'value' } })
    );
    
    render(<RequestBuilder />);
    
    const removeButton = screen.getByTestId('remove-header-X-Custom');
    await user.click(removeButton);
    
    expect(mockSetHeaders).toHaveBeenCalledWith({});
  });

  it('displays body content in Body tab', async () => {
    const user = userEvent.setup();
    (useRequestStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createMockStore({ body: '{"key": "value"}' })
    );
    
    render(<RequestBuilder />);
    
    // Switch to body tab
    const bodyTab = screen.getByText('Body');
    await user.click(bodyTab);
    
    const bodyEditor = screen.getByTestId('body-editor');
    expect(bodyEditor).toBeInTheDocument();
  });

  it('updates body when typing in body editor', async () => {
    const user = userEvent.setup();
    render(<RequestBuilder />);
    
    // Switch to body tab
    const bodyTab = screen.getByText('Body');
    await user.click(bodyTab);
    
    const bodyTextarea = screen.getByTestId('body-textarea');
    await user.type(bodyTextarea, '{"test": true}');
    
    expect(mockSetBody).toHaveBeenCalled();
  });

  it('shows active tab with proper styling', () => {
    render(<RequestBuilder />);
    
    const headersTab = screen.getByText('Headers').closest('button');
    expect(headersTab).toHaveClass(/bg-bg-raised|text-text-primary/);
  });

  it('shows inactive tabs with muted styling', () => {
    render(<RequestBuilder />);
    
    const bodyTab = screen.getByText('Body').closest('button');
    expect(bodyTab).toHaveClass(/text-text-muted/);
  });
});
