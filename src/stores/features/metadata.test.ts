/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { DEFAULT_FLAGS } from './defaults';
import { FLAG_METADATA, isStaleFlag } from './metadata';

const extractFlagKeys = (flags: Record<string, Record<string, unknown>>): string[] =>
  Object.keys(flags)
    .sort()
    .flatMap((group) =>
      Object.keys(flags[group] ?? {})
        .sort()
        .map((flag) => `${group}.${flag}`)
    );

describe('flag metadata registry', () => {
  it('defines required metadata fields', () => {
    const entry = FLAG_METADATA.http.importBruno;
    expect(entry.addedVersion).toBeDefined();
    expect(entry.expectedGraduation).toBeDefined();
    expect(entry.description).toBeDefined();
    expect(entry.state).toBeDefined();
  });

  it('covers every default flag', () => {
    const defaultKeys = extractFlagKeys(
      DEFAULT_FLAGS as unknown as Record<string, Record<string, unknown>>
    );
    const metadataKeys = extractFlagKeys(
      FLAG_METADATA as unknown as Record<string, Record<string, unknown>>
    );
    expect(metadataKeys).toEqual(defaultKeys);
  });
});

describe('isStaleFlag', () => {
  it('returns true when current version exceeds expected graduation', () => {
    const metadata = {
      addedVersion: '0.5.0',
      expectedGraduation: '0.6.0',
      description: 'Test',
      state: 'experimental',
    } as const;
    expect(isStaleFlag(metadata, '0.7.0')).toBe(true);
  });

  it('returns false when current version is equal or earlier', () => {
    const metadata = {
      addedVersion: '0.5.0',
      expectedGraduation: '0.6.0',
      description: 'Test',
      state: 'experimental',
    } as const;
    expect(isStaleFlag(metadata, '0.6.0')).toBe(false);
    expect(isStaleFlag(metadata, '0.5.1')).toBe(false);
  });

  it('returns false for never-graduating flags', () => {
    const metadata = {
      addedVersion: '0.5.0',
      expectedGraduation: 'never',
      description: 'Test',
      state: 'stable',
    } as const;
    expect(isStaleFlag(metadata, '9.9.9')).toBe(false);
  });
});
