/**
 * Platform detection utilities for Tauri desktop app.
 *
 * Uses Tauri's native OS APIs when available (desktop app),
 * falls back to browser APIs for web/SSR compatibility.
 *
 * Desktop-first: Tauri provides accurate OS detection.
 * Web fallback: Browser APIs for development/testing.
 */

/**
 * Detects the current platform using Tauri OS API (desktop) or browser APIs (web).
 *
 * @returns Platform string (e.g., 'macOS', 'Windows', 'Linux', 'Unknown')
 */
async function detectPlatform(): Promise<string> {
  // Desktop app: Use Tauri command for native OS detection
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const osPlatform = await invoke<string>('get_platform');
    // Tauri returns: 'darwin', 'win32', 'linux'
    if (osPlatform === 'darwin') return 'macOS';
    if (osPlatform === 'win32') return 'Windows';
    if (osPlatform === 'linux') return 'Linux';
    return 'Unknown';
  } catch {
    // Not in Tauri environment (web/SSR) - fall back to browser APIs
  }

  // Web fallback: Browser APIs for development/testing
  if (typeof window === 'undefined') {
    return 'Unknown';
  }

  // Modern API (Chrome/Edge 92+)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userAgentData = (navigator as any).userAgentData;
  if (userAgentData?.platform) {
    const platform = String(userAgentData.platform).toLowerCase();
    if (platform.includes('mac')) return 'macOS';
    if (platform.includes('win')) return 'Windows';
    if (platform.includes('linux')) return 'Linux';
  }

  // Fallback: Parse userAgent
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mac os x') || ua.includes('macintosh')) return 'macOS';
  if (ua.includes('win')) return 'Windows';
  if (ua.includes('linux')) return 'Linux';

  // Last resort: navigator.platform (deprecated but widely supported)
  // eslint-disable-next-line deprecation/deprecation
  const platform = navigator.platform.toUpperCase();
  if (platform.includes('MAC')) return 'macOS';
  if (platform.includes('WIN')) return 'Windows';
  if (platform.includes('LINUX')) return 'Linux';

  return 'Unknown';
}

// Cache platform detection result (desktop app platform doesn't change)
let platformCache: string | null = null;
let platformPromise: Promise<string> | null = null;

/**
 * Resets the platform cache. For testing purposes only.
 * @internal
 */
export function resetPlatformCache(): void {
  platformCache = null;
  platformPromise = null;
}

/**
 * Gets the cached platform or detects it if not cached.
 *
 * @returns Platform string
 */
async function getPlatform(): Promise<string> {
  if (platformCache !== null) {
    return platformCache;
  }

  if (platformPromise === null) {
    platformPromise = detectPlatform().then((platform) => {
      platformCache = platform;
      return platform;
    });
  }

  return platformPromise;
}

/**
 * Detects if the current platform is macOS.
 *
 * Desktop-first: Uses Tauri OS API when available.
 * Web fallback: Uses browser APIs for development/testing.
 *
 * @returns True if running on macOS, false otherwise
 */
export async function isMac(): Promise<boolean> {
  return (await getPlatform()) === 'macOS';
}

/**
 * Detects if the current platform is Windows.
 *
 * @returns True if running on Windows, false otherwise
 */
export async function isWindows(): Promise<boolean> {
  return (await getPlatform()) === 'Windows';
}

/**
 * Detects if the current platform is Linux.
 *
 * @returns True if running on Linux, false otherwise
 */
export async function isLinux(): Promise<boolean> {
  return (await getPlatform()) === 'Linux';
}

/**
 * Synchronous platform detection for immediate use.
 *
 * Uses cached result if available, otherwise falls back to browser detection.
 * For desktop app, prefer async functions above for accurate Tauri OS detection.
 *
 * @returns Platform string or 'Unknown' if not yet detected
 */
export function getPlatformSync(): string {
  if (platformCache !== null) {
    return platformCache;
  }

  // Fallback to browser detection for immediate synchronous access
  if (typeof window === 'undefined') {
    return 'Unknown';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userAgentData = (navigator as any).userAgentData;
  if (userAgentData?.platform) {
    const platform = String(userAgentData.platform).toLowerCase();
    if (platform.includes('mac')) return 'macOS';
    if (platform.includes('win')) return 'Windows';
    if (platform.includes('linux')) return 'Linux';
  }

  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mac os x') || ua.includes('macintosh')) return 'macOS';
  if (ua.includes('win')) return 'Windows';
  if (ua.includes('linux')) return 'Linux';

  // eslint-disable-next-line deprecation/deprecation
  const platform = navigator.platform.toUpperCase();
  if (platform.includes('MAC')) return 'macOS';
  if (platform.includes('WIN')) return 'Windows';
  if (platform.includes('LINUX')) return 'Linux';

  return 'Unknown';
}

/**
 * Synchronous check if current platform is macOS.
 *
 * Uses cached result or browser detection fallback.
 * For desktop app, prefer async `isMac()` for accurate Tauri OS detection.
 *
 * @returns True if running on macOS, false otherwise
 */
export function isMacSync(): boolean {
  return getPlatformSync() === 'macOS';
}

/**
 * Gets the appropriate modifier key for the current platform.
 *
 * Desktop-first: Uses Tauri OS detection when available.
 * Web fallback: Uses browser detection for development/testing.
 *
 * @param event - Keyboard event to check
 * @returns True if the platform-appropriate modifier key is pressed
 */
export function getModifierKey(event: KeyboardEvent): boolean {
  // Use synchronous check for immediate keyboard event handling
  return isMacSync() ? event.metaKey : event.ctrlKey;
}

/**
 * Gets the modifier key name for display purposes.
 *
 * @returns The modifier key name (⌘ for Mac, Ctrl for others)
 */
export function getModifierKeyName(): string {
  return isMacSync() ? '⌘' : 'Ctrl';
}
