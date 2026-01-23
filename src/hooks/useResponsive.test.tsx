/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useResponsive } from './useResponsive';

describe('useResponsive', () => {
  beforeEach(() => {
    // Reset matchMedia mock
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useResponsive());

    expect(result.current.isCompact).toBe(false);
    expect(result.current.isStandard).toBe(false);
    expect(result.current.isSpacious).toBe(true);
  });

  it('sets up media query listeners', () => {
    const addEventListenerSpy = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: addEventListenerSpy,
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
      configurable: true,
    });

    renderHook(() => useResponsive());

    expect(addEventListenerSpy).toHaveBeenCalled();
  });

  it('cleans up event listeners on unmount', () => {
    const mqInstances: Array<{ removeEventListener: ReturnType<typeof vi.fn> }> = [];

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn((query: string) => {
        const removeSpy = vi.fn();
        mqInstances.push({ removeEventListener: removeSpy });
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: removeSpy,
          dispatchEvent: vi.fn(),
        };
      }),
      configurable: true,
    });

    const { unmount } = renderHook(() => useResponsive());

    unmount();

    // At least one removeEventListener should have been called
    const totalCalls = mqInstances.reduce(
      (sum, mq) => sum + mq.removeEventListener.mock.calls.length,
      0
    );
    expect(totalCalls).toBeGreaterThan(0);
  });
});
