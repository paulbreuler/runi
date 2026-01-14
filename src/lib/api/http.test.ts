/**
 * Tests for HTTP API wrapper.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeRequest } from './http';
import type { RequestParams, HttpResponse } from '$lib/types/http';

// Mock Tauri's invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';

describe('executeRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invokes the execute_request command with params', async () => {
    const mockResponse: HttpResponse = {
      status: 200,
      status_text: 'OK',
      headers: { 'content-type': 'application/json' },
      body: '{"message": "success"}',
      timing: {
        total_ms: 150,
        dns_ms: 10,
        connect_ms: 20,
        tls_ms: 30,
        first_byte_ms: 50,
      },
    };

    vi.mocked(invoke).mockResolvedValue(mockResponse);

    const params: RequestParams = {
      url: 'https://api.example.com/test',
      method: 'GET',
      headers: {},
      body: null,
      timeout_ms: 30000,
    };

    const result = await executeRequest(params);

    expect(invoke).toHaveBeenCalledWith('execute_request', { params });
    expect(result).toEqual(mockResponse);
  });

  it('passes headers and body to the backend', async () => {
    const mockResponse: HttpResponse = {
      status: 201,
      status_text: 'Created',
      headers: {},
      body: '',
      timing: { total_ms: 100, dns_ms: null, connect_ms: null, tls_ms: null, first_byte_ms: 50 },
    };

    vi.mocked(invoke).mockResolvedValue(mockResponse);

    const params: RequestParams = {
      url: 'https://api.example.com/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token123',
      },
      body: JSON.stringify({ name: 'Test User' }),
      timeout_ms: 30000,
    };

    await executeRequest(params);

    expect(invoke).toHaveBeenCalledWith('execute_request', { params });
  });

  it('propagates errors from the backend', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('Network error'));

    const params: RequestParams = {
      url: 'https://invalid.example.com',
      method: 'GET',
      headers: {},
      body: null,
      timeout_ms: 30000,
    };

    await expect(executeRequest(params)).rejects.toThrow('Network error');
  });

  it('handles custom timeout parameter', async () => {
    const mockResponse: HttpResponse = {
      status: 200,
      status_text: 'OK',
      headers: {},
      body: '',
      timing: {
        total_ms: 5000,
        dns_ms: null,
        connect_ms: null,
        tls_ms: null,
        first_byte_ms: 4900,
      },
    };

    vi.mocked(invoke).mockResolvedValue(mockResponse);

    const params: RequestParams = {
      url: 'https://slow.example.com',
      method: 'GET',
      headers: {},
      body: null,
      timeout_ms: 10000,
    };

    const result = await executeRequest(params);

    expect(invoke).toHaveBeenCalledWith('execute_request', { params });
    expect(result.timing.total_ms).toBe(5000);
  });
});
