/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useMemoryWarning } from './useMemoryWarning';

describe('useMemoryWarning', () => {
  it('initializes with isDismissed as false', () => {
    const { result } = renderHook(() => useMemoryWarning());

    expect(result.current.isDismissed).toBe(false);
    expect(typeof result.current.dismiss).toBe('function');
  });

  it('tracks dismissal state', () => {
    const { result } = renderHook(() => useMemoryWarning());

    expect(result.current.isDismissed).toBe(false);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.isDismissed).toBe(true);
  });

  it('dismiss function can be called multiple times', () => {
    const { result } = renderHook(() => useMemoryWarning());

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.isDismissed).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    // Should remain dismissed
    expect(result.current.isDismissed).toBe(true);
  });
});
