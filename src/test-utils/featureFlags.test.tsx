/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { getFlag, resetFeatureFlags, setFlag, withFeatureFlags } from './featureFlags';

describe('feature flag test utils', () => {
  afterEach(() => {
    resetFeatureFlags();
  });

  it('withFeatureFlags wraps component with overrides', () => {
    let wrapper: ReturnType<typeof withFeatureFlags>;
    act(() => {
      wrapper = withFeatureFlags({ canvas: { enabled: true } });
    });
    let result: ReturnType<typeof renderHook>['result'];
    act(() => {
      ({ result } = renderHook(() => useFeatureFlag('canvas', 'enabled'), {
        wrapper: wrapper!,
      }));
    });

    expect(result.current.enabled).toBe(true);
  });

  it('withFeatureFlags merges with defaults', () => {
    let wrapper: ReturnType<typeof withFeatureFlags>;
    act(() => {
      wrapper = withFeatureFlags({ canvas: { enabled: true } });
    });
    let result: ReturnType<typeof renderHook>['result'];
    act(() => {
      ({ result } = renderHook(() => useFeatureFlag('http', 'importBruno'), {
        wrapper: wrapper!,
      }));
    });

    expect(result.current.enabled).toBe(true);
  });

  it('resetFeatureFlags restores defaults', () => {
    setFlag('canvas', 'enabled', true);
    expect(getFlag('canvas', 'enabled')).toBe(true);

    resetFeatureFlags();
    expect(getFlag('canvas', 'enabled')).toBe(false);
  });

  it('getFlag and setFlag operate on the store', () => {
    expect(getFlag('canvas', 'minimap')).toBe(false);
    setFlag('canvas', 'minimap', true);
    expect(getFlag('canvas', 'minimap')).toBe(true);
  });
});
