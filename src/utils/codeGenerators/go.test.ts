import { describe, it, expect } from 'vitest';
import { generateGoCode } from './go';
import type { NetworkHistoryEntry } from '@/types/history';

describe('generateGoCode', () => {
  const createMockEntry = (overrides?: Partial<NetworkHistoryEntry>): NetworkHistoryEntry => ({
    id: '1',
    timestamp: '2024-01-01T00:00:00Z',
    request: {
      url: 'https://api.example.com/users',
      method: 'GET',
      headers: {},
      body: null,
      timeout_ms: 30000,
    },
    response: {
      status: 200,
      status_text: 'OK',
      headers: {},
      body: '{}',
      timing: {
        total_ms: 100,
        dns_ms: 10,
        connect_ms: 20,
        tls_ms: 30,
        first_byte_ms: 50,
      },
    },
    ...overrides,
  });

  it('generates basic GET request', () => {
    const entry = createMockEntry();
    const code = generateGoCode(entry);

    expect(code).toContain('package main');
    expect(code).toContain('import (');
    expect(code).toContain('net/http');
    expect(code).toContain('http.NewRequest("GET"');
    expect(code).toContain('"https://api.example.com/users"');
  });

  it('generates POST request with body', () => {
    const entry = createMockEntry({
      request: {
        url: 'https://api.example.com/users',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"name":"John"}',
        timeout_ms: 30000,
      },
    });

    const code = generateGoCode(entry);

    expect(code).toContain('http.NewRequest("POST"');
    expect(code).toContain('req.Body');
  });

  it('includes headers in request', () => {
    const entry = createMockEntry({
      request: {
        url: 'https://api.example.com/users',
        method: 'GET',
        headers: { Authorization: 'Bearer token123' },
        body: null,
        timeout_ms: 30000,
      },
    });

    const code = generateGoCode(entry);

    expect(code).toContain('req.Header =');
    expect(code).toContain('"Authorization"');
  });
});
