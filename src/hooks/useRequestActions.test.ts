import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRequestActions } from './useRequestActions';
import { useRequestStore } from '@/stores/useRequestStore';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { globalEventBus } from '@/events/bus';
import * as httpModule from '@/api/http';

// Mock the http module
vi.mock('@/api/http');

// Mock console service
vi.mock(
  '@/services/console-service',
  (): { getConsoleService: () => { addLog: ReturnType<typeof vi.fn> } } => ({
    getConsoleService: (): { addLog: ReturnType<typeof vi.fn> } => ({
      addLog: vi.fn(),
    }),
  })
);

describe('useRequestActions', () => {
  beforeEach(() => {
    // Reset stores to initial state
    useRequestStore.setState({
      url: '',
      method: 'GET',
      headers: {},
      body: '',
      response: null,
      isLoading: false,
    });

    // Clear history
    void useHistoryStore.getState().clearHistory();

    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with empty URL and GET method', () => {
    const { result } = renderHook(() => useRequestActions());

    expect(result.current.localUrl).toBe('https://httpbin.org/get');
    expect(result.current.localMethod).toBe('GET');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isValidUrl).toBe(true);
  });

  it('handleMethodChange updates local and store method', () => {
    const { result } = renderHook(() => useRequestActions());

    act(() => {
      result.current.handleMethodChange('POST');
    });

    expect(result.current.localMethod).toBe('POST');
    expect(useRequestStore.getState().method).toBe('POST');
  });

  it('handleUrlChange updates local URL', () => {
    const { result } = renderHook(() => useRequestActions());

    act(() => {
      result.current.handleUrlChange('https://example.com/api');
    });

    expect(result.current.localUrl).toBe('https://example.com/api');
  });

  it('isValidUrl returns false for empty URL', () => {
    const { result } = renderHook(() => useRequestActions());

    act(() => {
      result.current.handleUrlChange('');
    });

    expect(result.current.isValidUrl).toBe(false);
  });

  it('handleSend executes request successfully', async () => {
    const mockResponse = {
      status: 200,
      statusText: 'OK',
      headers: {},
      body: '{"success": true}',
      timing: { total_ms: 100, dns_ms: 10, tls_ms: 20, connect_ms: 30, transfer_ms: 40 },
    };

    vi.mocked(httpModule.executeRequest).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useRequestActions());

    await act(async () => {
      await result.current.handleSend();
    });

    expect(httpModule.executeRequest).toHaveBeenCalledTimes(1);
    expect(useRequestStore.getState().response).toEqual(mockResponse);
    expect(result.current.isLoading).toBe(false);
  });

  it('handleSend adds entry to history on success', async () => {
    const mockResponse = {
      status: 200,
      statusText: 'OK',
      headers: {},
      body: '{"success": true}',
      timing: { total_ms: 100, dns_ms: 10, tls_ms: 20, connect_ms: 30, transfer_ms: 40 },
    };

    vi.mocked(httpModule.executeRequest).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useRequestActions());

    await act(async () => {
      await result.current.handleSend();
    });

    await waitFor(() => {
      expect(useHistoryStore.getState().entries.length).toBe(1);
    });
  });

  it('handleSend handles errors and emits toast', async () => {
    const mockError = {
      code: 'NETWORK_ERROR',
      message: 'Network request failed',
      correlationId: 'test-correlation-id',
    };

    vi.mocked(httpModule.executeRequest).mockRejectedValue(mockError);

    const emitSpy = vi.spyOn(globalEventBus, 'emit');

    const { result } = renderHook(() => useRequestActions());

    await act(async () => {
      await result.current.handleSend();
    });

    expect(emitSpy).toHaveBeenCalledWith('toast.show', {
      type: 'error',
      message: '[NETWORK_ERROR] Network request failed',
      correlationId: 'test-correlation-id',
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('handleSend does not execute when URL is invalid', async () => {
    const { result } = renderHook(() => useRequestActions());

    act(() => {
      result.current.handleUrlChange('');
    });

    await act(async () => {
      await result.current.handleSend();
    });

    expect(httpModule.executeRequest).not.toHaveBeenCalled();
  });

  it('handleSend does not execute when already loading', async () => {
    let resolveRequest: (() => void) | undefined;
    const requestPromise = new Promise<httpModule.HttpResponse>((resolve) => {
      resolveRequest = (): void => {
        resolve({
          status: 200,
          statusText: 'OK',
          headers: {},
          body: '{"success": true}',
          timing: { total_ms: 100, dns_ms: 10, tls_ms: 20, connect_ms: 30, transfer_ms: 40 },
        });
      };
    });

    vi.mocked(httpModule.executeRequest).mockReturnValue(
      requestPromise as ReturnType<typeof httpModule.executeRequest>
    );

    const { result } = renderHook(() => useRequestActions());

    // Start first request (don't await)
    const firstRequest = act(async () => {
      await result.current.handleSend();
    });

    // Wait for loading state to be set
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    // Try second request while first is loading
    await act(async () => {
      await result.current.handleSend();
    });

    // Should only be called once
    expect(httpModule.executeRequest).toHaveBeenCalledTimes(1);

    // Resolve the pending request
    resolveRequest!();
    await firstRequest;
  });

  it('handleSend clears response before executing', async () => {
    const mockResponse = {
      status: 200,
      statusText: 'OK',
      headers: {},
      body: '{"success": true}',
      timing: { total_ms: 100, dns_ms: 10, tls_ms: 20, connect_ms: 30, transfer_ms: 40 },
    };

    vi.mocked(httpModule.executeRequest).mockResolvedValue(mockResponse);

    // Set initial response
    useRequestStore.getState().setResponse(mockResponse);

    const { result } = renderHook(() => useRequestActions());

    await act(async () => {
      await result.current.handleSend();
    });

    // Response should be cleared and then set again
    expect(useRequestStore.getState().response).toEqual(mockResponse);
  });

  it('handleSend updates URL and method in store', async () => {
    const mockResponse = {
      status: 200,
      statusText: 'OK',
      headers: {},
      body: '{"success": true}',
      timing: { total_ms: 100, dns_ms: 10, tls_ms: 20, connect_ms: 30, transfer_ms: 40 },
    };

    vi.mocked(httpModule.executeRequest).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useRequestActions());

    act(() => {
      result.current.handleUrlChange('https://example.com/test');
      result.current.handleMethodChange('POST');
    });

    await act(async () => {
      await result.current.handleSend();
    });

    expect(useRequestStore.getState().url).toBe('https://example.com/test');
    expect(useRequestStore.getState().method).toBe('POST');
  });

  it('syncs local state with store on mount', () => {
    useRequestStore.getState().setUrl('https://test.com');
    useRequestStore.getState().setMethod('PUT');

    const { result } = renderHook(() => useRequestActions());

    expect(result.current.localUrl).toBe('https://test.com');
    expect(result.current.localMethod).toBe('PUT');
  });
});
