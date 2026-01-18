import { describe, it, expect } from 'vitest';
import { generateCurlCommand } from './curl';
import type { NetworkHistoryEntry } from '@/types/history';

/**
 * Create a minimal NetworkHistoryEntry for testing.
 */
function createMockEntry(
  overrides: Partial<{
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string | null;
  }> = {}
): NetworkHistoryEntry {
  return {
    id: 'test-id',
    timestamp: new Date().toISOString(),
    request: {
      method: overrides.method ?? 'GET',
      url: overrides.url ?? 'https://api.example.com/users',
      headers: overrides.headers ?? {},
      body: overrides.body ?? null,
      timeout_ms: 30000,
    },
    response: {
      status: 200,
      status_text: 'OK',
      headers: {},
      body: '{}',
      timing: {
        total_ms: 100,
        dns_ms: null,
        connect_ms: null,
        tls_ms: null,
        first_byte_ms: null,
      },
    },
  };
}

describe('generateCurlCommand', () => {
  it('generates a basic GET request', () => {
    const entry = createMockEntry({
      method: 'GET',
      url: 'https://api.example.com/users',
    });

    const curl = generateCurlCommand(entry);

    expect(curl).toContain('curl');
    expect(curl).toContain('-X GET');
    expect(curl).toContain("'https://api.example.com/users'");
  });

  it('generates a POST request with JSON body', () => {
    const entry = createMockEntry({
      method: 'POST',
      url: 'https://api.example.com/users',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":"John","email":"john@example.com"}',
    });

    const curl = generateCurlCommand(entry);

    expect(curl).toContain('-X POST');
    expect(curl).toContain("-H 'Content-Type: application/json'");
    expect(curl).toContain('-d');
    expect(curl).toContain('{"name":"John","email":"john@example.com"}');
  });

  it('generates a PUT request with body', () => {
    const entry = createMockEntry({
      method: 'PUT',
      url: 'https://api.example.com/users/123',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":"Jane"}',
    });

    const curl = generateCurlCommand(entry);

    expect(curl).toContain('-X PUT');
    expect(curl).toContain("-d '");
    expect(curl).toContain('{"name":"Jane"}');
  });

  it('generates a DELETE request', () => {
    const entry = createMockEntry({
      method: 'DELETE',
      url: 'https://api.example.com/users/123',
    });

    const curl = generateCurlCommand(entry);

    expect(curl).toContain('-X DELETE');
    expect(curl).toContain("'https://api.example.com/users/123'");
  });

  it('handles multiple headers', () => {
    const entry = createMockEntry({
      method: 'GET',
      url: 'https://api.example.com/protected',
      headers: {
        Authorization: 'Bearer token123',
        Accept: 'application/json',
        'X-Request-ID': 'abc-123',
      },
    });

    const curl = generateCurlCommand(entry);

    expect(curl).toContain("-H 'Authorization: Bearer token123'");
    expect(curl).toContain("-H 'Accept: application/json'");
    expect(curl).toContain("-H 'X-Request-ID: abc-123'");
  });

  it('escapes single quotes in URL', () => {
    const entry = createMockEntry({
      url: "https://api.example.com/search?q=it's",
    });

    const curl = generateCurlCommand(entry);

    // Single quotes should be escaped as '\''
    expect(curl).toContain("it'\\''s");
  });

  it('escapes single quotes in headers', () => {
    const entry = createMockEntry({
      headers: { 'X-Custom': "Value with 'quotes'" },
    });

    const curl = generateCurlCommand(entry);

    expect(curl).toContain("'\\''quotes'\\''");
  });

  it('escapes single quotes in body', () => {
    const entry = createMockEntry({
      method: 'POST',
      body: '{"message":"It\'s working"}',
    });

    const curl = generateCurlCommand(entry);

    expect(curl).toContain("It'\\''s working");
  });

  it('handles empty headers', () => {
    const entry = createMockEntry({
      headers: {},
    });

    const curl = generateCurlCommand(entry);

    // Should not have any -H flags
    expect(curl).not.toContain('-H');
  });

  it('handles null body', () => {
    const entry = createMockEntry({
      method: 'POST',
      body: null,
    });

    const curl = generateCurlCommand(entry);

    // Should not have -d flag
    expect(curl).not.toContain('-d');
  });

  it('handles empty string body', () => {
    const entry = createMockEntry({
      method: 'POST',
      body: '',
    });

    const curl = generateCurlCommand(entry);

    // Should not have -d flag
    expect(curl).not.toContain('-d');
  });

  it('does not include body for GET requests even if provided', () => {
    const entry = createMockEntry({
      method: 'GET',
      body: '{"unexpected":"body"}',
    });

    const curl = generateCurlCommand(entry);

    // GET should not have -d flag
    expect(curl).not.toContain('-d');
  });

  it('handles special characters in URL', () => {
    const entry = createMockEntry({
      url: 'https://api.example.com/search?q=hello%20world&filter=type:user',
    });

    const curl = generateCurlCommand(entry);

    expect(curl).toContain('hello%20world');
    expect(curl).toContain('filter=type:user');
  });

  it('generates multiline output for readability', () => {
    const entry = createMockEntry({
      method: 'POST',
      url: 'https://api.example.com/users',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });

    const curl = generateCurlCommand(entry);

    // Should use line continuation for readability
    expect(curl).toContain(' \\\n  ');
  });
});
