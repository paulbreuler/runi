import { describe, it, expect } from 'vitest';
import { generateRubyCode } from './ruby';
import type { NetworkHistoryEntry } from '@/types/history';

describe('generateRubyCode', () => {
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
    const code = generateRubyCode(entry);

    expect(code).toContain('require "net/http"');
    expect(code).toContain("URI('https://api.example.com/users')");
    expect(code).toContain('Net::HTTP::Get');
    expect(code).toContain('response.body');
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

    const code = generateRubyCode(entry);

    expect(code).toContain('Net::HTTP::Post');
    expect(code).toContain('request.body');
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

    const code = generateRubyCode(entry);

    expect(code).toContain("request['Authorization']");
  });
});
