import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRequestStore } from './useRequestStore';
import type { HttpResponse } from '@/types/http';

describe('useRequestStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    const { result } = renderHook(() => useRequestStore());
    act(() => {
      result.current.reset();
    });
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useRequestStore());
    expect(result.current.method).toBe('GET');
    expect(result.current.url).toBe('https://httpbin.org/get');
    expect(result.current.headers).toEqual({});
    expect(result.current.body).toBe('');
    expect(result.current.response).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets method', () => {
    const { result } = renderHook(() => useRequestStore());

    act(() => {
      result.current.setMethod('POST');
    });

    expect(result.current.method).toBe('POST');
  });

  it('sets URL', () => {
    const { result } = renderHook(() => useRequestStore());

    act(() => {
      result.current.setUrl('https://api.example.com/test');
    });

    expect(result.current.url).toBe('https://api.example.com/test');
  });

  it('sets headers', () => {
    const { result } = renderHook(() => useRequestStore());

    act(() => {
      result.current.setHeaders({ 'Content-Type': 'application/json' });
    });

    expect(result.current.headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('sets body', () => {
    const { result } = renderHook(() => useRequestStore());

    act(() => {
      result.current.setBody('{"key": "value"}');
    });

    expect(result.current.body).toBe('{"key": "value"}');
  });

  it('sets response', () => {
    const { result } = renderHook(() => useRequestStore());

    const mockResponse: HttpResponse = {
      status: 200,
      status_text: 'OK',
      headers: { 'Content-Type': 'application/json' },
      body: '{"result": "success"}',
      timing: {
        total_ms: 150,
        dns_ms: null,
        connect_ms: null,
        tls_ms: null,
        first_byte_ms: null,
      },
    };

    act(() => {
      result.current.setResponse(mockResponse);
    });

    expect(result.current.response).toEqual(mockResponse);
  });

  it('sets loading state', () => {
    const { result } = renderHook(() => useRequestStore());

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('sets error', () => {
    const { result } = renderHook(() => useRequestStore());

    act(() => {
      result.current.setError('Network error');
    });

    expect(result.current.error).toBe('Network error');
  });

  it('resets to initial state', () => {
    const { result } = renderHook(() => useRequestStore());

    // Modify state
    act(() => {
      result.current.setMethod('POST');
      result.current.setUrl('https://api.example.com');
      result.current.setHeaders({ 'X-Custom': 'value' });
      result.current.setBody('{"test": true}');
      result.current.setLoading(true);
      result.current.setError('Error');
    });

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.method).toBe('GET');
    expect(result.current.url).toBe('https://httpbin.org/get');
    expect(result.current.headers).toEqual({});
    expect(result.current.body).toBe('');
    expect(result.current.response).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
