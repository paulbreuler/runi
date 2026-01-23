/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from 'vitest';
import { detectSyntaxLanguage } from './syntaxLanguage';

describe('detectSyntaxLanguage', () => {
  it('prefers explicit content type for JSON', () => {
    expect(
      detectSyntaxLanguage({
        body: '<xml></xml>',
        contentType: 'application/json',
      })
    ).toBe('json');
  });

  it('detects JSON from body content', () => {
    expect(detectSyntaxLanguage({ body: '{"name":"Runi"}' })).toBe('json');
  });

  it('detects HTML from body content', () => {
    expect(detectSyntaxLanguage({ body: '<!doctype html><html></html>' })).toBe('html');
  });

  it('detects XML from body content', () => {
    expect(detectSyntaxLanguage({ body: '<note><to>Runi</to></note>' })).toBe('xml');
  });

  it('detects YAML from body content', () => {
    expect(detectSyntaxLanguage({ body: '---\nname: runi\ncount: 2' })).toBe('yaml');
  });

  it('defaults to text when no syntax matches', () => {
    expect(detectSyntaxLanguage({ body: 'plain text' })).toBe('text');
  });
});
