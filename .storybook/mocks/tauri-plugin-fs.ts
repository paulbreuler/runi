/**
 * Mock implementation of @tauri-apps/plugin-fs for Storybook
 *
 * This module provides mock implementations of Tauri filesystem functions
 * that are not available in the browser environment.
 */

/**
 * Mock writeTextFile function.
 * Resolves successfully without actually writing to disk.
 * Logs to console for debugging purposes.
 */
export async function writeTextFile(
  path: string,
  contents: string,
  _options?: { append?: boolean }
): Promise<void> {
  console.log('[Storybook Mock] writeTextFile called', {
    path,
    contentsLength: contents.length,
    options: _options,
  });
  // Resolve successfully without actually writing
  return Promise.resolve();
}

/**
 * Mock readTextFile function (if needed by other components).
 */
export async function readTextFile(path: string): Promise<string> {
  console.log('[Storybook Mock] readTextFile called', { path });
  return Promise.resolve('');
}
