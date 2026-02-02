/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 *
 * Global type declarations for injected constants and globals.
 */

/**
 * App version injected by Vite/Vitest via `define` configuration.
 * This is set from package.json version at build time.
 */
declare const __APP_VERSION__: string;

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '@tauri-apps/plugin-dialog' {
  export interface SaveDialogOptions {
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }

  export function save(options?: SaveDialogOptions): Promise<string | null>;
}
