/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from 'vitest';
import { generateJavaScriptCode } from './javascript';
import type { NetworkHistoryEntry } from '@/types/history';

describe('generateJavaScriptCode', () => {
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
    const code = generateJavaScriptCode(entry);

    expect(code).toContain("fetch('https://api.example.com/users'");
    expect(code).toContain("method: 'GET'");
    expect(code).toContain('await response.json()');
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

    const code = generateJavaScriptCode(entry);

    expect(code).toContain("method: 'POST'");
    expect(code).toContain('body:');
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

    const code = generateJavaScriptCode(entry);

    expect(code).toContain('headers:');
    expect(code).toContain("'Authorization'");
    expect(code).toContain("'Bearer token123'");
  });

  it('escapes special characters in URL', () => {
    const entry = createMockEntry({
      request: {
        url: 'https://api.example.com/users?q=test&filter=active',
        method: 'GET',
        headers: {},
        body: null,
        timeout_ms: 30000,
      },
    });

    const code = generateJavaScriptCode(entry);

    expect(code).toContain("'https://api.example.com/users?q=test&filter=active'");
  });
});
