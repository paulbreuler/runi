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

// Type for window with Tauri internals
type WindowWithTauri = Window & {
  __TAURI_INTERNALS__?: {
    invoke: (cmd: string, args?: unknown) => Promise<unknown>;
  };
  __TAURI__?: {
    invoke: (cmd: string, args?: unknown) => Promise<unknown>;
  };
};

/**
 * Sets up Tauri IPC mocking in the browser context.
 *
 * This function should be called via `page.evaluate()` to inject the mock
 * into the page's window object. The mock intercepts calls to `window.__TAURI_INTERNALS__.invoke()`.
 *
 * @param handler - Function that handles Tauri command invocations
 */
export function setupTauriMock(handler: TauriInvokeHandler): void {
  const win = window as WindowWithTauri;

  // Create a mock IPC object on window
  win.__TAURI_INTERNALS__ = {
    invoke: (cmd: string, args?: unknown): Promise<unknown> => Promise.resolve(handler(cmd, args)),
  };

  // Also mock the invoke function if it exists directly on window
  win.__TAURI__ = {
    invoke: (cmd: string, args?: unknown): Promise<unknown> => Promise.resolve(handler(cmd, args)),
  };
}

/**
 * Clears all Tauri IPC mocks.
 */
export function clearTauriMock(): void {
  const win = window as WindowWithTauri;
  delete win.__TAURI_INTERNALS__;
  delete win.__TAURI__;
}

/**
 * Default mock responses for common Tauri commands.
 */
export const defaultMocks = {
  execute_request: (): { status: number; body: string; headers: Record<string, string> } => ({
    status: 200,
    body: '{"ok":true}',
    headers: {},
  }),
  hello_world: (): { message: string } => ({ message: 'Hello from Tauri!' }),
};
