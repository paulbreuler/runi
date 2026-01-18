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

  describe('error handling', () => {
    it('clears error when setting null', () => {
      const { result } = renderHook(() => useRequestStore());

      act(() => {
        result.current.setError('Some error');
      });
      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.setError(null);
      });
      expect(result.current.error).toBeNull();
    });

    it('preserves error when setting other state', () => {
      const { result } = renderHook(() => useRequestStore());

      act(() => {
        result.current.setError('Connection failed');
        result.current.setMethod('POST');
        result.current.setUrl('https://new-url.com');
      });

      expect(result.current.error).toBe('Connection failed');
      expect(result.current.method).toBe('POST');
      expect(result.current.url).toBe('https://new-url.com');
    });

    it('clears response when reset but preserves nothing else', () => {
      const { result } = renderHook(() => useRequestStore());

      const mockResponse: HttpResponse = {
        status: 500,
        status_text: 'Internal Server Error',
        headers: {},
        body: 'Error',
        timing: {
          total_ms: 100,
          dns_ms: null,
          connect_ms: null,
          tls_ms: null,
          first_byte_ms: null,
        },
      };

      act(() => {
        result.current.setResponse(mockResponse);
        result.current.setError('Server error');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.response).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('handles empty URL', () => {
      const { result } = renderHook(() => useRequestStore());

      act(() => {
        result.current.setUrl('');
      });

      expect(result.current.url).toBe('');
    });

    it('handles URL with special characters', () => {
      const { result } = renderHook(() => useRequestStore());
      const urlWithParams = 'https://api.example.com/search?q=hello%20world&filter=a%26b';

      act(() => {
        result.current.setUrl(urlWithParams);
      });

      expect(result.current.url).toBe(urlWithParams);
    });

    it('handles headers with empty values', () => {
      const { result } = renderHook(() => useRequestStore());

      act(() => {
        result.current.setHeaders({ 'X-Empty': '', 'X-Filled': 'value' });
      });

      expect(result.current.headers).toEqual({ 'X-Empty': '', 'X-Filled': 'value' });
    });

    it('handles large body content', () => {
      const { result } = renderHook(() => useRequestStore());
      const largeBody = JSON.stringify({ data: 'x'.repeat(10000) });

      act(() => {
        result.current.setBody(largeBody);
      });

      expect(result.current.body).toBe(largeBody);
    });

    it('handles response with null body', () => {
      const { result } = renderHook(() => useRequestStore());

      const responseWithNullBody: HttpResponse = {
        status: 204,
        status_text: 'No Content',
        headers: {},
        body: '',
        timing: {
          total_ms: 50,
          dns_ms: null,
          connect_ms: null,
          tls_ms: null,
          first_byte_ms: null,
        },
      };

      act(() => {
        result.current.setResponse(responseWithNullBody);
      });

      expect(result.current.response?.status).toBe(204);
      expect(result.current.response?.body).toBe('');
    });

    it('maintains state across multiple hook instances (Zustand singleton)', () => {
      const { result: result1 } = renderHook(() => useRequestStore());

      act(() => {
        result1.current.setMethod('DELETE');
        result1.current.setUrl('https://unique.url/resource');
      });

      const { result: result2 } = renderHook(() => useRequestStore());

      expect(result2.current.method).toBe('DELETE');
      expect(result2.current.url).toBe('https://unique.url/resource');
    });

    it('reset clears response to null explicitly', () => {
      const { result } = renderHook(() => useRequestStore());

      act(() => {
        result.current.setResponse(null);
      });

      expect(result.current.response).toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.response).toBeNull();
    });
  });
});
