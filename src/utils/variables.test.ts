// Copyright (c) 2025 runi contributors
// SPDX-License-Identifier: MIT

import { describe, it, expect } from 'vitest';
import { resolveVariables } from './variables';

describe('resolveVariables', () => {
  it('replaces a single variable', () => {
    expect(resolveVariables('{{baseUrl}}/api', { baseUrl: 'https://example.com' })).toBe(
      'https://example.com/api'
    );
  });

  it('replaces multiple variables', () => {
    expect(
      resolveVariables('{{scheme}}://{{host}}/{{path}}', {
        scheme: 'https',
        host: 'api.example.com',
        path: 'users',
      })
    ).toBe('https://api.example.com/users');
  });

  it('leaves unknown variables as-is', () => {
    expect(resolveVariables('{{unknown}}/path', {})).toBe('{{unknown}}/path');
  });

  it('leaves unknown variables intact while substituting known ones', () => {
    expect(
      resolveVariables('{{baseUrl}}/{{version}}/users', { baseUrl: 'https://api.example.com' })
    ).toBe('https://api.example.com/{{version}}/users');
  });

  it('returns plain string unchanged when no variables present', () => {
    expect(resolveVariables('https://example.com/api', {})).toBe('https://example.com/api');
  });

  it('handles empty template', () => {
    expect(resolveVariables('', { baseUrl: 'https://example.com' })).toBe('');
  });

  it('handles empty vars with template variables', () => {
    expect(resolveVariables('{{baseUrl}}/api', {})).toBe('{{baseUrl}}/api');
  });

  it('replaces same variable multiple times', () => {
    expect(resolveVariables('{{x}}-{{x}}', { x: 'hello' })).toBe('hello-hello');
  });

  it('does not replace non-word-character variable patterns', () => {
    // {{base-url}} has a hyphen — not matched by \w+
    expect(resolveVariables('{{base-url}}/api', { 'base-url': 'https://example.com' })).toBe(
      '{{base-url}}/api'
    );
  });
});
