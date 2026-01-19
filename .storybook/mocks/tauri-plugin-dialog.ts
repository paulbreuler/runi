/**
 * Mock implementation of @tauri-apps/plugin-dialog for Storybook
 *
 * This module provides mock implementations of Tauri dialog functions
 * that are not available in the browser environment.
 */

/**
 * Mock save dialog function.
 * Returns null to simulate user cancelling the dialog.
 * Logs to console for debugging purposes.
 */
export async function save(_options?: {
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}): Promise<string | null> {
  console.log('[Storybook Mock] save dialog called', _options);
  // Return null to simulate user cancelling
  // In a real scenario, you could return a mock path for testing
  return null;
}

/**
 * Mock open dialog function (if needed by other components).
 */
export async function open(_options?: {
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  multiple?: boolean;
  directory?: boolean;
}): Promise<string | string[] | null> {
  console.log('[Storybook Mock] open dialog called', _options);
  return null;
}
