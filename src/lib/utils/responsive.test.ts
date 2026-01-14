import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMediaQuery, useMediaQuery, createCompactQuery, breakpoints } from './responsive';

describe('responsive utilities', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    // Reset matchMedia before each test
    vi.stubGlobal('matchMedia', originalMatchMedia);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('createMediaQuery', () => {
    it('returns media query state with matches property', () => {
      const mockMatchMedia = vi.fn((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn(),
      }));

      window.matchMedia = mockMatchMedia;

      const result = createMediaQuery('(max-width: 768px)');

      expect(result.matches).toBe(true);
      expect(result.media).toBe('(max-width: 768px)');
    });

    it('returns false matches for SSR (no window)', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR scenario
      delete global.window;

      const result = createMediaQuery('(max-width: 768px)');

      expect(result.matches).toBe(false);
      expect(result.media).toBe('(max-width: 768px)');

      global.window = originalWindow;
    });
  });

  describe('useMediaQuery', () => {
    it('uses addEventListener when available (modern API)', () => {
      const addEventListener = vi.fn();
      const removeEventListener = vi.fn();
      const addListener = vi.fn();

      const mockMatchMedia = vi.fn((query: string) => ({
        matches: false,
        media: query,
        addEventListener,
        removeEventListener,
        addListener,
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn(),
      }));

      window.matchMedia = mockMatchMedia;

      const { matches, cleanup } = useMediaQuery('(max-width: 768px)');

      expect(matches).toBe(false);
      expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      expect(addListener).not.toHaveBeenCalled();

      cleanup();
      expect(removeEventListener).toHaveBeenCalled();
    });

    it('falls back to addListener when addEventListener not available (legacy)', () => {
      const addListener = vi.fn();
      const removeListener = vi.fn();

      const mockMatchMedia = vi.fn((query: string) => ({
        matches: true,
        media: query,
        // No addEventListener (legacy browser) - explicitly undefined
        addEventListener: undefined,
        removeEventListener: undefined,
        addListener,
        removeListener,
        onchange: null,
        dispatchEvent: vi.fn(),
      })) as unknown as typeof window.matchMedia;

      window.matchMedia = mockMatchMedia;

      const { matches, cleanup } = useMediaQuery('(max-width: 768px)');

      expect(matches).toBe(true);
      expect(addListener).toHaveBeenCalledWith(expect.any(Function));
      expect(addListener).toHaveBeenCalledTimes(1);

      cleanup();
      expect(removeListener).toHaveBeenCalled();
    });

    it('handles SSR gracefully', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR scenario
      delete global.window;

      const { matches, cleanup } = useMediaQuery('(max-width: 768px)');

      expect(matches).toBe(false);
      expect(() => {
        cleanup();
      }).not.toThrow();

      global.window = originalWindow;
    });
  });

  describe('createCompactQuery', () => {
    it('creates compact breakpoint query', () => {
      const mockMatchMedia = vi.fn((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn(),
      }));

      window.matchMedia = mockMatchMedia;

      const result = createCompactQuery();

      expect(result.media).toContain('max-width');
      expect(result.media).toContain(String(breakpoints.md - 1));
    });
  });
});
