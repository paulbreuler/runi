import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isMac,
  isWindows,
  isLinux,
  getPlatformSync,
  isMacSync,
  getModifierKey,
  getModifierKeyName,
  resetPlatformCache,
} from './platform';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('platform utilities', () => {
  beforeEach(() => {
    resetPlatformCache();
    vi.clearAllMocks();
  });

  describe('getPlatformSync', () => {
    it('returns Unknown when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-expect-error - testing SSR scenario
      delete global.window;

      const platform = getPlatformSync();
      expect(platform).toBe('Unknown');

      global.window = originalWindow;
    });

    it('detects macOS from userAgent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });

      const platform = getPlatformSync();
      expect(platform).toBe('macOS');
    });

    it('detects Windows from userAgent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });

      const platform = getPlatformSync();
      expect(platform).toBe('Windows');
    });

    it('detects Linux from userAgent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (X11; Linux x86_64)',
        configurable: true,
      });

      const platform = getPlatformSync();
      expect(platform).toBe('Linux');
    });
  });

  describe('isMacSync', () => {
    it('returns true for macOS', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });

      expect(isMacSync()).toBe(true);
    });

    it('returns false for Windows', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });

      expect(isMacSync()).toBe(false);
    });
  });

  describe('getModifierKeyName', () => {
    it('returns ⌘ for macOS', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });

      expect(getModifierKeyName()).toBe('⌘');
    });

    it('returns Ctrl for non-macOS', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });

      expect(getModifierKeyName()).toBe('Ctrl');
    });
  });

  describe('getModifierKey', () => {
    it('checks metaKey for macOS', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });

      const event = {
        metaKey: true,
        ctrlKey: false,
      } as KeyboardEvent;

      expect(getModifierKey(event)).toBe(true);
    });

    it('checks ctrlKey for non-macOS', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });

      const event = {
        metaKey: false,
        ctrlKey: true,
      } as KeyboardEvent;

      expect(getModifierKey(event)).toBe(true);
    });
  });

  describe('async platform detection', () => {
    it('detects macOS from Tauri', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      vi.mocked(invoke).mockResolvedValue('darwin');

      const result = await isMac();
      expect(result).toBe(true);
    });

    it('detects Windows from Tauri', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      vi.mocked(invoke).mockResolvedValue('win32');

      const result = await isWindows();
      expect(result).toBe(true);
    });

    it('detects Linux from Tauri', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      vi.mocked(invoke).mockResolvedValue('linux');

      const result = await isLinux();
      expect(result).toBe(true);
    });

    it('falls back to browser detection when Tauri fails', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      vi.mocked(invoke).mockRejectedValue(new Error('Not in Tauri'));

      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });

      const result = await isMac();
      expect(result).toBe(true);
    });
  });

  describe('resetPlatformCache', () => {
    it('resets the platform cache', () => {
      resetPlatformCache();
      // Should not throw
      expect(() => {
        resetPlatformCache();
      }).not.toThrow();
    });
  });
});
