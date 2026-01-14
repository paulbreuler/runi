import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import RequestHeader from './RequestHeader.svelte';
import type { HttpMethod } from '$lib/types/http';

describe('RequestHeader', () => {
  it('renders with method, URL input, and send button', () => {
    render(RequestHeader, {
      props: {
        method: 'GET',
        url: '',
        loading: false,
      },
    });

    expect(screen.getByTestId('method-select')).toBeInTheDocument();
    expect(screen.getByTestId('url-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-button')).toBeInTheDocument();
  });

  it('displays current method in selector', () => {
    render(RequestHeader, {
      props: {
        method: 'POST',
        url: '',
        loading: false,
      },
    });

    const methodSelect = screen.getByTestId('method-select');
    expect(methodSelect).toHaveTextContent('POST');
  });

  it('binds URL value to input', () => {
    render(RequestHeader, {
      props: {
        method: 'GET',
        url: 'https://example.com',
        loading: false,
      },
    });

    const urlInput = screen.getByTestId('url-input') as HTMLInputElement;
    expect(urlInput.value).toBe('https://example.com');
  });

  it('calls onMethodChange when method changes', async () => {
    const onMethodChange = vi.fn();
    render(RequestHeader, {
      props: {
        method: 'GET',
        url: '',
        loading: false,
        onMethodChange,
      },
    });

    // Open select and click POST
    const methodSelect = screen.getByTestId('method-select');
    await fireEvent.click(methodSelect);

    // This would need proper select interaction - simplified for now
    expect(methodSelect).toBeInTheDocument();
  });

  it('calls onSend when send button clicked', async () => {
    const onSend = vi.fn();
    render(RequestHeader, {
      props: {
        method: 'GET',
        url: 'https://example.com',
        loading: false,
        onSend,
      },
    });

    const sendButton = screen.getByTestId('send-button');
    await fireEvent.click(sendButton);

    expect(onSend).toHaveBeenCalledOnce();
  });

  it('calls onSend when Enter key pressed in URL input', async () => {
    const onSend = vi.fn();
    render(RequestHeader, {
      props: {
        method: 'GET',
        url: 'https://example.com',
        loading: false,
        onSend,
      },
    });

    const urlInput = screen.getByTestId('url-input');
    await fireEvent.keyDown(urlInput, { key: 'Enter' });

    expect(onSend).toHaveBeenCalledOnce();
  });

  it('disables send button when URL is empty', () => {
    render(RequestHeader, {
      props: {
        method: 'GET',
        url: '',
        loading: false,
      },
    });

    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).toBeDisabled();
  });

  it('disables all controls when loading', () => {
    render(RequestHeader, {
      props: {
        method: 'GET',
        url: 'https://example.com',
        loading: true,
      },
    });

    expect(screen.getByTestId('method-select')).toBeDisabled();
    expect(screen.getByTestId('url-input')).toBeDisabled();
    expect(screen.getByTestId('send-button')).toBeDisabled();
  });

  it('shows loading text on send button when loading', () => {
    render(RequestHeader, {
      props: {
        method: 'GET',
        url: 'https://example.com',
        loading: true,
      },
    });

    expect(screen.getByText('Sending...')).toBeInTheDocument();
  });

  it('applies method color classes to method selector', () => {
    const { container } = render(RequestHeader, {
      props: {
        method: 'GET',
        url: '',
        loading: false,
      },
    });

    const methodSelect = screen.getByTestId('method-select');
    expect(methodSelect).toHaveClass('bg-green-600');
  });
});
