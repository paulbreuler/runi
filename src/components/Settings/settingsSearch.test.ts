/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { searchSettings } from './settingsSearch';

describe('searchSettings', () => {
  it('returns null for empty query', () => {
    expect(searchSettings('')).toBeNull();
    expect(searchSettings('   ')).toBeNull();
  });

  it('matches specific setting keys', () => {
    const results = searchSettings('timeout');
    expect(results?.has('http.timeout')).toBe(true);
  });

  it('matches category or keyword searches', () => {
    const results = searchSettings('redirect');
    const hasMatch =
      (results?.has('http') ?? false) ||
      (results?.has('http.followRedirects') ?? false) ||
      (results?.has('http.maxRedirects') ?? false);
    expect(hasMatch).toBe(true);
  });

  it('respects case sensitivity when enabled', () => {
    const lowerResults = searchSettings('timeout', { caseSensitive: true });
    const upperResults = searchSettings('TIMEOUT', { caseSensitive: true });
    expect(lowerResults?.has('http.timeout')).toBe(true);
    expect(upperResults?.has('http.timeout')).toBe(false);
  });
});
