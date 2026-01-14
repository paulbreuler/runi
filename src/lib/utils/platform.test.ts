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

// Type for mocking navigator
type MockNavigator = {
  userAgentData?: { platform: string };
  userAgent: string;
  platform?: string;
};

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
      (global.navigator as unknown as MockNavigator).userAgentData = { platform: 'macOS' };
      (global.navigator as unknown as MockNavigator).userAgent = 'Mozilla/5.0';
      delete (global.navigator as unknown as MockNavigator).platform;

      expect(await isMac()).toBe(true);
    });

    it('detects macOS using userAgent fallback', async () => {
      delete (global.navigator as unknown as MockNavigator).userAgentData;
      (global.navigator as unknown as MockNavigator).userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';
      delete (global.navigator as unknown as MockNavigator).platform;

      expect(await isMac()).toBe(true);
    });

    it('detects macOS using navigator.platform (deprecated fallback)', async () => {
      delete (global.navigator as unknown as MockNavigator).userAgentData;
      (global.navigator as unknown as MockNavigator).userAgent = 'Mozilla/5.0';
      (global.navigator as unknown as MockNavigator).platform = 'MacIntel';

      expect(await isMac()).toBe(true);
    });

    it('returns false for non-Mac platforms', async () => {
      (global.navigator as unknown as MockNavigator).userAgentData = { platform: 'Windows' };
      (global.navigator as unknown as MockNavigator).userAgent = 'Mozilla/5.0 (Windows NT 10.0)';
      delete (global.navigator as unknown as MockNavigator).platform;

      expect(await isMac()).toBe(false);
    });
  });

  describe('isWindows (async)', () => {
    it('detects Windows using userAgentData.platform', async () => {
      (global.navigator as unknown as MockNavigator).userAgentData = { platform: 'Windows' };
      (global.navigator as unknown as MockNavigator).userAgent = 'Mozilla/5.0';
      delete (global.navigator as unknown as MockNavigator).platform;

      expect(await isWindows()).toBe(true);
    });

    it('detects Windows using userAgent fallback', async () => {
      delete (global.navigator as unknown as MockNavigator).userAgentData;
      (global.navigator as unknown as MockNavigator).userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      delete (global.navigator as unknown as MockNavigator).platform;

      expect(await isWindows()).toBe(true);
    });

    it('returns false for non-Windows platforms', async () => {
      (global.navigator as unknown as MockNavigator).userAgentData = { platform: 'macOS' };
      (global.navigator as unknown as MockNavigator).userAgent = 'Mozilla/5.0 (Macintosh)';
      delete (global.navigator as unknown as MockNavigator).platform;

      expect(await isWindows()).toBe(false);
    });
  });

  describe('isLinux (async)', () => {
    it('detects Linux using userAgentData.platform', async () => {
      (global.navigator as unknown as MockNavigator).userAgentData = { platform: 'Linux' };
      (global.navigator as unknown as MockNavigator).userAgent = 'Mozilla/5.0';
      delete (global.navigator as unknown as MockNavigator).platform;

      expect(await isLinux()).toBe(true);
    });

    it('detects Linux using userAgent fallback', async () => {
      delete (global.navigator as unknown as MockNavigator).userAgentData;
      (global.navigator as unknown as MockNavigator).userAgent = 'Mozilla/5.0 (X11; Linux x86_64)';
      delete (global.navigator as unknown as MockNavigator).platform;

      expect(await isLinux()).toBe(true);
    });

    it('returns false for non-Linux platforms', async () => {
      (global.navigator as unknown as MockNavigator).userAgentData = { platform: 'macOS' };
      (global.navigator as unknown as MockNavigator).userAgent = 'Mozilla/5.0 (Macintosh)';
      delete (global.navigator as unknown as MockNavigator).platform;

      expect(await isLinux()).toBe(false);
    });
  });

  describe('isMacSync', () => {
    it('detects macOS synchronously using browser APIs', () => {
      (global.navigator as unknown as MockNavigator).userAgentData = { platform: 'macOS' };
      (global.navigator as unknown as MockNavigator).userAgent = 'Mozilla/5.0 (Macintosh)';
      delete (global.navigator as unknown as MockNavigator).platform;

      expect(isMacSync()).toBe(true);
    });

    it('returns false for non-Mac platforms', () => {
      (global.navigator as unknown as MockNavigator).userAgentData = { platform: 'Windows' };
      (global.navigator as unknown as MockNavigator).userAgent = 'Mozilla/5.0 (Windows NT)';
      delete (global.navigator as unknown as MockNavigator).platform;

      expect(isMacSync()).toBe(false);
    });
  });

  describe('getModifierKey', () => {
    it('returns metaKey for Mac platform', () => {
      (global.navigator as unknown as MockNavigator).userAgentData = { platform: 'macOS' };
      (global.navigator as unknown as MockNavigator).userAgent = 'Mozilla/5.0 (Macintosh)';
      delete (global.navigator as unknown as MockNavigator).platform;

      const event = {
        metaKey: true,
        ctrlKey: false,
      } as KeyboardEvent;

      expect(getModifierKey(event)).toBe(true);
    });

    it('returns ctrlKey for non-Mac platform', () => {
      (global.navigator as unknown as MockNavigator).userAgentData = { platform: 'Windows' };
      (global.navigator as unknown as MockNavigator).userAgent = 'Mozilla/5.0 (Windows NT)';
      delete (global.navigator as unknown as MockNavigator).platform;

      const event = {
        metaKey: false,
        ctrlKey: true,
      } as KeyboardEvent;

      expect(getModifierKey(event)).toBe(true);
    });
  });

  describe('getModifierKeyName', () => {
    it('returns ⌘ for Mac platform', () => {
      (global.navigator as unknown as MockNavigator).userAgentData = { platform: 'macOS' };
      (global.navigator as unknown as MockNavigator).userAgent = 'Mozilla/5.0 (Macintosh)';
      delete (global.navigator as unknown as MockNavigator).platform;

      expect(getModifierKeyName()).toBe('⌘');
    });

    it('returns Ctrl for non-Mac platform', () => {
      (global.navigator as unknown as MockNavigator).userAgentData = { platform: 'Windows' };
      (global.navigator as unknown as MockNavigator).userAgent = 'Mozilla/5.0 (Windows NT)';
      delete (global.navigator as unknown as MockNavigator).platform;

      expect(getModifierKeyName()).toBe('Ctrl');
    });
  });
});
