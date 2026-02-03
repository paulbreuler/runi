/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import type { DeepPartialSettings } from './settings';
import { DEFAULT_SETTINGS, mergeWithDefaults } from './settings-defaults';
import { SETTINGS_SCHEMA } from './settings-meta';
import { validateSetting, validateSettings } from './settings-validation';

describe('Settings Types', () => {
  it('DEFAULT_SETTINGS has all categories', () => {
    expect(DEFAULT_SETTINGS.http).toBeDefined();
    expect(DEFAULT_SETTINGS.storage).toBeDefined();
    expect(DEFAULT_SETTINGS.ui).toBeDefined();
    expect(DEFAULT_SETTINGS.mcp).toBeDefined();
  });

  it('DEFAULT_SETTINGS has version 1', () => {
    expect(DEFAULT_SETTINGS.version).toBe(1);
  });

  it('DEFAULT_SETTINGS has NO features property', () => {
    expect((DEFAULT_SETTINGS as unknown as Record<string, unknown>).features).toBeUndefined();
  });

  it('SETTINGS_SCHEMA metadata matches defaults', () => {
    for (const [cat, fields] of Object.entries(SETTINGS_SCHEMA)) {
      const defaultsCategory = DEFAULT_SETTINGS[cat as keyof typeof DEFAULT_SETTINGS];
      for (const [key, meta] of Object.entries(fields)) {
        if (key === '_meta') {
          continue;
        }
        const metaDef = meta as { default?: unknown };
        expect(defaultsCategory[key as keyof typeof defaultsCategory]).toBe(metaDef.default);
      }
    }
  });
});

describe('validateSetting', () => {
  it('rejects timeout below minimum', () => {
    const result = validateSetting('http', 'timeout', 500);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('1');
  });

  it('accepts timeout at minimum', () => {
    const result = validateSetting('http', 'timeout', 1000);
    expect(result.valid).toBe(true);
  });

  it('rejects timeout above maximum', () => {
    const result = validateSetting('http', 'timeout', 400000);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects invalid collectionFormat', () => {
    const result = validateSetting('storage', 'collectionFormat', 'xml');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('yaml');
  });

  it('accepts valid collectionFormat', () => {
    expect(validateSetting('storage', 'collectionFormat', 'yaml').valid).toBe(true);
    expect(validateSetting('storage', 'collectionFormat', 'json').valid).toBe(true);
  });

  it('rejects non-boolean for followRedirects', () => {
    const result = validateSetting('http', 'followRedirects', 'yes');
    expect(result.valid).toBe(false);
  });
});

describe('validateSettings', () => {
  it('returns empty array for valid partial settings', () => {
    const partial: DeepPartialSettings<typeof DEFAULT_SETTINGS> = {
      http: { timeout: 15000 },
    };
    const errors = validateSettings(partial);
    expect(errors).toHaveLength(0);
  });

  it('returns errors for invalid values', () => {
    const partial: DeepPartialSettings<typeof DEFAULT_SETTINGS> = {
      http: { timeout: 50 },
      storage: { collectionFormat: 'xml' as 'yaml' },
    };
    const errors = validateSettings(partial);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.error?.includes('timeout'))).toBe(true);
    expect(errors.some((e) => e.error?.includes('collectionFormat'))).toBe(true);
  });
});

describe('mergeWithDefaults', () => {
  it('preserves unspecified defaults', () => {
    const partial: DeepPartialSettings<typeof DEFAULT_SETTINGS> = {
      http: { timeout: 5000 },
    };
    const merged = mergeWithDefaults(partial);
    expect(merged.http.timeout).toBe(5000);
    expect(merged.http.validateSSL).toBe(true);
    expect(merged.storage.autoSave).toBe(true);
  });

  it('keeps version 1', () => {
    const partial: DeepPartialSettings<typeof DEFAULT_SETTINGS> = {
      ui: { fontSize: 14 },
    };
    const merged = mergeWithDefaults(partial);
    expect(merged.version).toBe(1);
  });

  it('merges multiple categories', () => {
    const partial: DeepPartialSettings<typeof DEFAULT_SETTINGS> = {
      http: { timeout: 10000 },
      mcp: { enabled: false },
    };
    const merged = mergeWithDefaults(partial);
    expect(merged.http.timeout).toBe(10000);
    expect(merged.mcp.enabled).toBe(false);
    expect(merged.ui.fontSize).toBe(DEFAULT_SETTINGS.ui.fontSize);
  });
});
