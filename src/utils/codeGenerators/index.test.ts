/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from 'vitest';
import { generateCode, LANGUAGE_NAMES, LANGUAGE_SYNTAX, type CodeLanguage } from './index';
import type { NetworkHistoryEntry } from '@/types/history';

describe('codeGenerators index', () => {
  const createMockEntry = (): NetworkHistoryEntry => ({
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
  });

  it('has language names for all languages', () => {
    const languages: CodeLanguage[] = ['javascript', 'python', 'go', 'ruby', 'curl'];
    languages.forEach((lang) => {
      expect(LANGUAGE_NAMES[lang]).toBeDefined();
      expect(typeof LANGUAGE_NAMES[lang]).toBe('string');
    });
  });

  it('has syntax identifiers for all languages', () => {
    const languages: CodeLanguage[] = ['javascript', 'python', 'go', 'ruby', 'curl'];
    languages.forEach((lang) => {
      expect(LANGUAGE_SYNTAX[lang]).toBeDefined();
      expect(typeof LANGUAGE_SYNTAX[lang]).toBe('string');
    });
  });

  it('generates JavaScript code', () => {
    const entry = createMockEntry();
    const code = generateCode(entry, 'javascript');
    expect(code).toContain('fetch');
  });

  it('generates Python code', () => {
    const entry = createMockEntry();
    const code = generateCode(entry, 'python');
    expect(code).toContain('requests');
  });

  it('generates Go code', () => {
    const entry = createMockEntry();
    const code = generateCode(entry, 'go');
    expect(code).toContain('package main');
  });

  it('generates Ruby code', () => {
    const entry = createMockEntry();
    const code = generateCode(entry, 'ruby');
    expect(code).toContain('net/http');
  });

  it('generates cURL code', () => {
    const entry = createMockEntry();
    const code = generateCode(entry, 'curl');
    expect(code).toContain('curl');
  });

  it('throws error for unsupported language', () => {
    const entry = createMockEntry();
    expect(() => {
      generateCode(entry, 'unsupported' as CodeLanguage);
    }).toThrow('Unsupported language');
  });
});
