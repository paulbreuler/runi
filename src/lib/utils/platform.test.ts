import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isMac,
  isWindows,
  isLinux,
  isMacSync,
  getModifierKey,
  getModifierKeyName,
  resetPlatformCache,
} from './platform';

describe('platform utilities', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    // Reset platform cache and navigator before each test
    resetPlatformCache();
    vi.stubGlobal('navigator', { ...originalNavigator });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('isMac (async)', () => {
    it('detects macOS using userAgentData.platform (modern API)', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.navigator as any).userAgentData = { platform: 'macOS' };
      (global.navigator as any).userAgent = 'Mozilla/5.0';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global.navigator as any).platform;

      expect(await isMac()).toBe(true);
    });

    it('detects macOS using userAgent fallback', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global.navigator as any).userAgentData;
      (global.navigator as any).userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global.navigator as any).platform;

      expect(await isMac()).toBe(true);
    });

    it('detects macOS using navigator.platform (deprecated fallback)', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global.navigator as any).userAgentData;
      (global.navigator as any).userAgent = 'Mozilla/5.0';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.navigator as any).platform = 'MacIntel';

      expect(await isMac()).toBe(true);
    });

    it('returns false for non-Mac platforms', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.navigator as any).userAgentData = { platform: 'Windows' };
      (global.navigator as any).userAgent = 'Mozilla/5.0 (Windows NT 10.0)';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global.navigator as any).platform;

      expect(await isMac()).toBe(false);
    });
  });

  describe('isWindows (async)', () => {
    it('detects Windows using userAgentData.platform', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.navigator as any).userAgentData = { platform: 'Windows' };
      (global.navigator as any).userAgent = 'Mozilla/5.0';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global.navigator as any).platform;

      expect(await isWindows()).toBe(true);
    });

    it('detects Windows using userAgent fallback', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global.navigator as any).userAgentData;
      (global.navigator as any).userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global.navigator as any).platform;

      expect(await isWindows()).toBe(true);
    });

    it('returns false for non-Windows platforms', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.navigator as any).userAgentData = { platform: 'macOS' };
      (global.navigator as any).userAgent = 'Mozilla/5.0 (Macintosh)';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global.navigator as any).platform;

      expect(await isWindows()).toBe(false);
    });
  });

  describe('isLinux (async)', () => {
    it('detects Linux using userAgentData.platform', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.navigator as any).userAgentData = { platform: 'Linux' };
      (global.navigator as any).userAgent = 'Mozilla/5.0';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global.navigator as any).platform;

      expect(await isLinux()).toBe(true);
    });

    it('detects Linux using userAgent fallback', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global.navigator as any).userAgentData;
      (global.navigator as any).userAgent = 'Mozilla/5.0 (X11; Linux x86_64)';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global.navigator as any).platform;

      expect(await isLinux()).toBe(true);
    });

    it('returns false for non-Linux platforms', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.navigator as any).userAgentData = { platform: 'macOS' };
      (global.navigator as any).userAgent = 'Mozilla/5.0 (Macintosh)';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global.navigator as any).platform;

      expect(await isLinux()).toBe(false);
    });
  });

  describe('isMacSync', () => {
    it('detects macOS synchronously using browser APIs', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.navigator as any).userAgentData = { platform: 'macOS' };
      (global.navigator as any).userAgent = 'Mozilla/5.0 (Macintosh)';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global.navigator as any).platform;

      expect(isMacSync()).toBe(true);
    });

    it('returns false for non-Mac platforms', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.navigator as any).userAgentData = { platform: 'Windows' };
      (global.navigator as any).userAgent = 'Mozilla/5.0 (Windows NT)';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global.navigator as any).platform;

      expect(isMacSync()).toBe(false);
    });
  });

  describe('getModifierKey', () => {
    it('returns metaKey for Mac platform', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.navigator as any).userAgentData = { platform: 'macOS' };
      (global.navigator as any).userAgent = 'Mozilla/5.0 (Macintosh)';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global.navigator as any).platform;

      const event = {
        metaKey: true,
        ctrlKey: false,
      } as KeyboardEvent;

      expect(getModifierKey(event)).toBe(true);
    });

    it('returns ctrlKey for non-Mac platform', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.navigator as any).userAgentData = { platform: 'Windows' };
      (global.navigator as any).userAgent = 'Mozilla/5.0 (Windows NT)';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global.navigator as any).platform;

      const event = {
        metaKey: false,
        ctrlKey: true,
      } as KeyboardEvent;

      expect(getModifierKey(event)).toBe(true);
    });
  });

  describe('getModifierKeyName', () => {
    it('returns ⌘ for Mac platform', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.navigator as any).userAgentData = { platform: 'macOS' };
      (global.navigator as any).userAgent = 'Mozilla/5.0 (Macintosh)';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global.navigator as any).platform;

      expect(getModifierKeyName()).toBe('⌘');
    });

    it('returns Ctrl for non-Mac platform', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.navigator as any).userAgentData = { platform: 'Windows' };
      (global.navigator as any).userAgent = 'Mozilla/5.0 (Windows NT)';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global.navigator as any).platform;

      expect(getModifierKeyName()).toBe('Ctrl');
    });
  });
});
