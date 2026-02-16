/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from 'vitest';
import { getLanguageExtension } from './codemirror-languages';

describe('getLanguageExtension', () => {
  it('returns an extension array for json', () => {
    const result = getLanguageExtension('json');
    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(true);
    expect(result!.length).toBeGreaterThan(0);
  });

  it('returns an extension array for yaml', () => {
    const result = getLanguageExtension('yaml');
    expect(result).not.toBeNull();
  });

  it('returns an extension array for xml', () => {
    const result = getLanguageExtension('xml');
    expect(result).not.toBeNull();
  });

  it('returns an extension array for javascript', () => {
    const result = getLanguageExtension('javascript');
    expect(result).not.toBeNull();
  });

  it('returns an extension array for typescript', () => {
    const result = getLanguageExtension('typescript');
    expect(result).not.toBeNull();
  });

  it('returns an extension array for python', () => {
    const result = getLanguageExtension('python');
    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns an extension array for go', () => {
    const result = getLanguageExtension('go');
    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns null for ruby (no dedicated CM6 package)', () => {
    expect(getLanguageExtension('ruby')).toBeNull();
  });

  it('returns null for bash (no dedicated CM6 package)', () => {
    expect(getLanguageExtension('bash')).toBeNull();
  });

  it('returns null for curl (no dedicated CM6 package)', () => {
    expect(getLanguageExtension('curl')).toBeNull();
  });

  it('returns null for html (no lang-html package)', () => {
    expect(getLanguageExtension('html')).toBeNull();
  });

  it('returns null for http (plain text fallback)', () => {
    const result = getLanguageExtension('http');
    expect(result).toBeNull();
  });

  it('returns null for unknown languages', () => {
    expect(getLanguageExtension('brainfuck')).toBeNull();
    expect(getLanguageExtension('')).toBeNull();
  });

  it('returns null for text', () => {
    expect(getLanguageExtension('text')).toBeNull();
  });

  describe('alias handling', () => {
    it('maps js to javascript', () => {
      const js = getLanguageExtension('js');
      const javascript = getLanguageExtension('javascript');
      expect(js).not.toBeNull();
      expect(javascript).not.toBeNull();
    });

    it('maps ts to typescript', () => {
      const ts = getLanguageExtension('ts');
      const typescript = getLanguageExtension('typescript');
      expect(ts).not.toBeNull();
      expect(typescript).not.toBeNull();
    });

    it('maps yml to yaml', () => {
      const yml = getLanguageExtension('yml');
      const yaml = getLanguageExtension('yaml');
      expect(yml).not.toBeNull();
      expect(yaml).not.toBeNull();
    });

    it('maps py to python', () => {
      const py = getLanguageExtension('py');
      const python = getLanguageExtension('python');
      expect(py).not.toBeNull();
      expect(python).not.toBeNull();
    });

    it('maps golang to go', () => {
      const golang = getLanguageExtension('golang');
      const go = getLanguageExtension('go');
      expect(golang).not.toBeNull();
      expect(go).not.toBeNull();
    });

    it('maps sh to bash', () => {
      expect(getLanguageExtension('sh')).toBeNull();
      expect(getLanguageExtension('bash')).toBeNull();
    });
  });

  describe('case insensitivity', () => {
    it('handles uppercase language names', () => {
      expect(getLanguageExtension('JSON')).not.toBeNull();
      expect(getLanguageExtension('YAML')).not.toBeNull();
      expect(getLanguageExtension('XML')).not.toBeNull();
    });

    it('handles mixed case language names', () => {
      expect(getLanguageExtension('Json')).not.toBeNull();
      expect(getLanguageExtension('JavaScript')).not.toBeNull();
    });
  });

  describe('JSON bracket matching', () => {
    it('includes bracket matching extensions for JSON', () => {
      const result = getLanguageExtension('json');
      expect(result).not.toBeNull();
      // JSON should have more extensions than just the language (bracket matching + auto-close)
      expect(result!.length).toBeGreaterThan(1);
    });
  });
});
