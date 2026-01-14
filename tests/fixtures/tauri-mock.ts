/**
 * Tauri IPC mocking utilities for Playwright E2E tests.
 *
 * This module provides helpers to mock Tauri invoke commands in browser context.
 * Use with `page.evaluate()` to inject mocks before running tests.
 *
 * @example
 * ```typescript
 * await page.evaluate(() => {
 *   setupTauriMock((cmd, args) => {
 *     if (cmd === 'execute_request') {
 *       return { status: 200, body: '{"ok":true}', headers: {} };
 *     }
 *   });
 * });
 * ```
 */

export type TauriInvokeHandler = (cmd: string, args?: unknown) => unknown;

/**
 * Sets up Tauri IPC mocking in the browser context.
 *
 * This function should be called via `page.evaluate()` to inject the mock
 * into the page's window object. The mock intercepts calls to `window.__TAURI_INTERNALS__.invoke()`.
 *
 * @param handler - Function that handles Tauri command invocations
 */
export function setupTauriMock(handler: TauriInvokeHandler): void {
  // Create a mock IPC object on window
  (window as any).__TAURI_INTERNALS__ = {
    invoke: async (cmd: string, args?: unknown) => {
      const result = handler(cmd, args);
      return Promise.resolve(result);
    },
  };

  // Also mock the invoke function if it exists directly on window
  (window as any).__TAURI__ = {
    invoke: async (cmd: string, args?: unknown) => {
      const result = handler(cmd, args);
      return Promise.resolve(result);
    },
  };
}

/**
 * Clears all Tauri IPC mocks.
 */
export function clearTauriMock(): void {
  delete (window as any).__TAURI_INTERNALS__;
  delete (window as any).__TAURI__;
}

/**
 * Default mock responses for common Tauri commands.
 */
export const defaultMocks = {
  execute_request: () => ({
    status: 200,
    body: '{"ok":true}',
    headers: {} as Record<string, string>,
  }),
  hello_world: () => ({ message: 'Hello from Tauri!' }),
};
