/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { DEFAULT_FLAGS } from './defaults';
import { isFeatureInteractive, isFeatureVisible } from './types';
import type { DeepPartial, FeatureFlags } from './types';

describe('feature flag types', () => {
  it('has the top-level flag groups', () => {
    const flags: FeatureFlags = DEFAULT_FLAGS;
    const groups = Object.keys(flags).sort();
    expect(groups).toEqual(['ai', 'canvas', 'comprehension', 'debug', 'http']);
  });

  it('has the expected http flags', () => {
    const flags: FeatureFlags = DEFAULT_FLAGS;
    expect(Object.keys(flags.http).sort()).toEqual([
      'exportCurl',
      'exportJavaScript',
      'exportPython',
      'importBruno',
      'importOpenAPI',
      'importPostman',
    ]);
  });

  it('has the expected canvas flags', () => {
    const flags: FeatureFlags = DEFAULT_FLAGS;
    expect(Object.keys(flags.canvas).sort()).toEqual([
      'commandBar',
      'connectionLines',
      'enabled',
      'minimap',
      'snapToGrid',
    ]);
  });

  it('has the expected comprehension flags', () => {
    const flags: FeatureFlags = DEFAULT_FLAGS;
    expect(Object.keys(flags.comprehension).sort()).toEqual([
      'aiVerification',
      'driftDetection',
      'semanticLinks',
      'specBinding',
      'temporalAwareness',
    ]);
  });

  it('has the expected ai flags', () => {
    const flags: FeatureFlags = DEFAULT_FLAGS;
    expect(Object.keys(flags.ai).sort()).toEqual([
      'agenticTesting',
      'aiSuggestedIntegrations',
      'mcpGeneration',
      'naturalLanguageCommands',
      'ollamaIntegration',
    ]);
  });

  it('has the expected debug flags', () => {
    const flags: FeatureFlags = DEFAULT_FLAGS;
    expect(Object.keys(flags.debug).sort()).toEqual([
      'forceAllExperimental',
      'mockResponses',
      'performanceOverlay',
      'verboseLogging',
    ]);
  });

  it('allows deep partial overrides', () => {
    const partial: DeepPartial<FeatureFlags> = {
      http: {
        exportPython: true,
      },
    };

    expect(partial.http?.exportPython).toBe(true);
  });
});

describe('feature state utilities', () => {
  it('marks hidden flags as not visible', () => {
    expect(isFeatureVisible('hidden')).toBe(false);
  });

  it('marks teaser, experimental, and stable flags as visible', () => {
    expect(isFeatureVisible('teaser')).toBe(true);
    expect(isFeatureVisible('experimental')).toBe(true);
    expect(isFeatureVisible('stable')).toBe(true);
  });

  it('marks hidden and teaser flags as not interactive', () => {
    expect(isFeatureInteractive('hidden')).toBe(false);
    expect(isFeatureInteractive('teaser')).toBe(false);
  });

  it('marks experimental and stable flags as interactive', () => {
    expect(isFeatureInteractive('experimental')).toBe(true);
    expect(isFeatureInteractive('stable')).toBe(true);
  });
});
