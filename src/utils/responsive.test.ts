/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createMediaQuery,
  useMediaQuery,
  createCompactQuery,
  createStandardQuery,
  createSpaciousQuery,
  breakpoints,
} from './responsive';

describe('responsive utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createMediaQuery', () => {
    it('returns default state when window is undefined (SSR)', () => {
      const originalWindow = global.window;
      // @ts-expect-error - testing SSR scenario
      delete global.window;

      const result = createMediaQuery('(max-width: 768px)');
      expect(result.matches).toBe(false);
      expect(result.media).toBe('(max-width: 768px)');

      global.window = originalWindow;
    });

    it('creates media query with correct query string', () => {
      const result = createMediaQuery('(max-width: 768px)');
      expect(result.media).toBe('(max-width: 768px)');
    });

    it('uses window.matchMedia when available', () => {
      const mockMatchMedia = vi.fn((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
        configurable: true,
      });

      const result = createMediaQuery('(max-width: 768px)');
      expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 768px)');
      expect(result.matches).toBe(true);
    });
  });

  describe('useMediaQuery', () => {
    it('returns default state when window is undefined (SSR)', () => {
      const originalWindow = global.window;
      // @ts-expect-error - testing SSR scenario
      delete global.window;

      const result = useMediaQuery('(max-width: 768px)');
      expect(result.matches).toBe(false);
      expect(typeof result.cleanup).toBe('function');

      global.window = originalWindow;
    });

    it('returns matches and cleanup function', () => {
      const mockMatchMedia = vi.fn((query: string) => {
        const mq = {
          matches: false,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        };
        return mq;
      });

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
        configurable: true,
      });

      const result = useMediaQuery('(max-width: 768px)');
      expect(result.matches).toBe(false);
      expect(typeof result.cleanup).toBe('function');
    });

    it('calls cleanup to remove event listener', () => {
      const removeEventListener = vi.fn();
      const mockMatchMedia = vi.fn((query: string) => {
        const mq = {
          matches: false,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener,
        };
        return mq;
      });

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
        configurable: true,
      });

      const result = useMediaQuery('(max-width: 768px)');
      result.cleanup();

      expect(removeEventListener).toHaveBeenCalled();
    });
  });

  describe('breakpoint queries', () => {
    it('createCompactQuery uses correct breakpoint', () => {
      const result = createCompactQuery();
      const expectedQuery = `(max-width: ${String(breakpoints.md - 1)}px)`;
      expect(result.media).toBe(expectedQuery);
    });

    it('createStandardQuery uses correct breakpoints', () => {
      const result = createStandardQuery();
      const expectedQuery = `(min-width: ${String(breakpoints.md)}px) and (max-width: ${String(breakpoints.lg - 1)}px)`;
      expect(result.media).toBe(expectedQuery);
    });

    it('createSpaciousQuery uses correct breakpoint', () => {
      const result = createSpaciousQuery();
      const expectedQuery = `(min-width: ${String(breakpoints.lg)}px)`;
      expect(result.media).toBe(expectedQuery);
    });
  });

  describe('breakpoints constant', () => {
    it('has correct breakpoint values', () => {
      expect(breakpoints.sm).toBe(640);
      expect(breakpoints.md).toBe(768);
      expect(breakpoints.lg).toBe(1024);
      expect(breakpoints.xl).toBe(1280);
      expect(breakpoints['2xl']).toBe(1536);
    });
  });
});
