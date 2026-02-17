/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * Runi Settings Schema v1
 *
 * Defines the shape of ~/.runi/settings.yaml
 *
 * Feature flags are managed by Plan 0013 (src/stores/features/types.ts).
 * Changes here must be reflected in:
 * - Rust types (src-tauri)
 * - JSON Schema (schemas/settings.schema.json)
 * - UI components (SettingsPanel)
 */

export interface SettingsSchema {
  /** Schema version for migrations. Always 1 for now. */
  version: 1;

  /** HTTP client behavior defaults */
  http: HttpSettings;

  /** File persistence options */
  storage: StorageSettings;

  /** Visual preferences */
  ui: UiSettings;

  /** Model Context Protocol integration */
  mcp: McpSettings;
}

export interface HttpSettings {
  /** Request timeout in milliseconds. Range: 1000-300000. Default: 30000 */
  timeout: number;

  /** Follow HTTP 3xx redirects automatically. Default: true */
  followRedirects: boolean;

  /** Maximum redirect hops before failing. Range: 1-50. Default: 10 */
  maxRedirects: number;

  /** Reject self-signed/invalid SSL certificates. Default: true */
  validateSSL: boolean;

  /** Default User-Agent header. Default: "runi/1.0.0" */
  userAgent: string;
}

export interface StorageSettings {
  /** Auto-save collections on change. Default: true */
  autoSave: boolean;

  /** Debounce delay before auto-save in ms. Range: 500-30000. Default: 2000 */
  autoSaveDelay: number;

  /** File format for saved collections. Default: 'yaml' */
  collectionFormat: 'yaml' | 'json';

  /** Create .bak backup before overwriting files. Default: false */
  backupOnChange: boolean;
}

export interface UiSettings {
  /** Base font size in pixels. Range: 10-18. Default: 13 */
  fontSize: number;

  /** Format JSON/XML responses with indentation. Default: true */
  responsePrettyPrint: boolean;

  /** Wrap long lines in response viewer. Default: true */
  responseLineWrap: boolean;

  /** Show colored method badges (GET/POST) in sidebar. Default: true */
  showMethodBadges: boolean;

  /** Reduce padding throughout UI. Default: false */
  compactMode: boolean;

  /** Sidebar width in pixels. Range: 280-600. Default: 384 */
  sidebarWidth: number;

  /** Syntax highlighting theme for code editors. Default: 'one-dark' */
  editorTheme: EditorTheme;
}

export interface McpSettings {
  /** Enable MCP server for AI assistant integration. Default: true */
  enabled: boolean;

  /** Allow AI to modify feature flags and preferences. Default: true */
  allowSettingsModification: boolean;

  /** Allow AI to create/modify/delete requests in collections. Default: true */
  allowCollectionEdits: boolean;

  /** Allow AI to execute HTTP requests (dangerous). Default: false */
  allowRequestExecution: boolean;

  /** Log all AI actions to ~/.runi/mcp-audit.log. Default: true */
  auditLog: boolean;
}

/** Category keys (excludes version) */
export type SettingsCategory = keyof Omit<SettingsSchema, 'version'>;

/** Setting key within a category */
export type SettingKey<C extends SettingsCategory> = keyof SettingsSchema[C];

/** Value type for a specific setting */
export type SettingValue<
  C extends SettingsCategory,
  K extends SettingKey<C>,
> = SettingsSchema[C][K];

/** Deep partial for nested config (e.g. mergeWithDefaults, validateSettings). */
export type DeepPartialSettings<T> = T extends object
  ? { [K in keyof T]?: DeepPartialSettings<T[K]> }
  : T;

/** Editor theme options for syntax highlighting */
export type EditorTheme = 'one-dark' | 'solarized-dark' | 'github-dark';

/** Re-export feature flag types from Plan 0013 for convenience */
export type { FeatureFlags, FeatureState, FlagMetadata } from '@/stores/features/types';
