import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

interface MockMediaQueryList {
  matches: boolean;
  media: string;
  addEventListener: (event: string, callback: (e: MediaQueryListEvent) => void) => void;
  removeEventListener: (event: string, callback: (e: MediaQueryListEvent) => void) => void;
}

describe('usePrefersReducedMotion', () => {
  let matchMediaMock: MockMediaQueryList;

  beforeEach(() => {
    // Mock matchMedia
    matchMediaMock = {
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: (): void => {},
      removeEventListener: (): void => {},
    };

    window.matchMedia = (): MediaQueryList => matchMediaMock as unknown as MediaQueryList;
  });

  afterEach(() => {
    // Cleanup
    delete (window as any).matchMedia;
  });

  it('returns false when prefers-reduced-motion is not set', () => {
    matchMediaMock.matches = false;

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when prefers-reduced-motion is set', () => {
    matchMediaMock.matches = true;

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it('updates when media query changes', () => {
    const listeners: Array<(e: MediaQueryListEvent) => void> = [];

    matchMediaMock.addEventListener = (
      event: string,
      callback: (e: MediaQueryListEvent) => void
    ): void => {
      if (event === 'change') {
        listeners.push(callback);
      }
    };

    matchMediaMock.matches = false;

    const { result, rerender } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);

    // Simulate media query change
    matchMediaMock.matches = true;
    for (const listener of listeners) {
      listener({ matches: true } as MediaQueryListEvent);
    }

    rerender();
    expect(result.current).toBe(true);
  });

  it('cleans up event listener on unmount', () => {
    let removeListenerCalled = false;

    const mockRemoveEventListener = (): void => {
      removeListenerCalled = true;
    };

    matchMediaMock.removeEventListener = mockRemoveEventListener;

    const { unmount } = renderHook(() => usePrefersReducedMotion());
    unmount();

    expect(removeListenerCalled).toBe(true);
  });
});
