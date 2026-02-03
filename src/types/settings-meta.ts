/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * Settings Metadata
 *
 * Defines validation rules, UI hints, and searchable keywords
 * for each setting. Used by SettingsPanel, JSON Schema generator, and search.
 * Feature flag metadata is in Plan 0013's FLAG_METADATA.
 */

import type { SettingsSchema, SettingsCategory, SettingKey } from './settings';

export type SettingType = 'boolean' | 'number' | 'string' | 'select';

export interface SettingMeta<T = unknown> {
  type: SettingType;
  default: T;
  label: string;
  description: string;
  keywords: string[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  displayUnit?: string;
  displayMultiplier?: number;
  options?: Array<{ value: string; label: string; description?: string }>;
  pattern?: string;
  placeholder?: string;
  warning?: string;
  dependsOn?: { key: string; value: unknown };
}

export interface CategoryMeta {
  label: string;
  icon: string;
  description: string;
  badge?: { text: string; className: string };
}

export type SettingsSchemaWithMeta = {
  [C in SettingsCategory]: {
    _meta: CategoryMeta;
  } & {
    [K in SettingKey<C>]: SettingMeta<SettingsSchema[C][K]>;
  };
};

export const SETTINGS_SCHEMA: SettingsSchemaWithMeta = {
  http: {
    _meta: {
      label: 'HTTP Client',
      icon: '🌐',
      description: 'Request behavior and defaults',
    },
    timeout: {
      type: 'number',
      default: 30000,
      min: 1000,
      max: 300000,
      step: 1000,
      unit: 'ms',
      displayUnit: 'sec',
      displayMultiplier: 0.001,
      label: 'Request Timeout',
      description: 'Maximum time to wait for a response',
      keywords: ['timeout', 'wait', 'delay', 'response time'],
    },
    followRedirects: {
      type: 'boolean',
      default: true,
      label: 'Follow Redirects',
      description: 'Automatically follow HTTP redirects (3xx responses)',
      keywords: ['redirect', '301', '302', '307', 'location'],
    },
    maxRedirects: {
      type: 'number',
      default: 10,
      min: 1,
      max: 50,
      label: 'Max Redirects',
      description: 'Maximum number of redirects before failing',
      keywords: ['redirect', 'limit', 'max', 'loop'],
      dependsOn: { key: 'http.followRedirects', value: true },
    },
    validateSSL: {
      type: 'boolean',
      default: true,
      label: 'Validate SSL Certificates',
      description: 'Reject self-signed or invalid certificates',
      keywords: ['ssl', 'tls', 'certificate', 'https', 'security'],
      warning: 'Disabling SSL validation is a security risk. Only use for local development.',
    },
    userAgent: {
      type: 'string',
      default: 'runi/1.0.0',
      label: 'User Agent',
      description: 'Default User-Agent header for requests',
      keywords: ['user agent', 'header', 'browser', 'client'],
      placeholder: 'runi/1.0.0',
    },
  },

  storage: {
    _meta: {
      label: 'Storage',
      icon: '📁',
      description: 'Collections and file handling',
    },
    autoSave: {
      type: 'boolean',
      default: true,
      label: 'Auto-save Collections',
      description: 'Automatically save changes to disk',
      keywords: ['save', 'auto', 'persist', 'write'],
    },
    autoSaveDelay: {
      type: 'number',
      default: 2000,
      min: 500,
      max: 30000,
      step: 500,
      unit: 'ms',
      displayUnit: 'sec',
      displayMultiplier: 0.001,
      label: 'Auto-save Delay',
      description: 'Debounce time before saving after changes',
      keywords: ['delay', 'debounce', 'wait', 'save'],
      dependsOn: { key: 'storage.autoSave', value: true },
    },
    collectionFormat: {
      type: 'select',
      default: 'yaml',
      options: [
        {
          value: 'yaml',
          label: 'YAML',
          description: 'Human-readable, Git-friendly',
        },
        { value: 'json', label: 'JSON', description: 'Standard format, wider tooling' },
      ],
      label: 'Collection Format',
      description: 'File format for saved collections',
      keywords: ['format', 'yaml', 'json', 'file', 'export'],
    },
    backupOnChange: {
      type: 'boolean',
      default: false,
      label: 'Backup on Change',
      description: 'Create .bak files before overwriting',
      keywords: ['backup', 'bak', 'restore', 'safety'],
    },
  },

  ui: {
    _meta: {
      label: 'Appearance',
      icon: '🎨',
      description: 'Visual preferences',
    },
    fontSize: {
      type: 'number',
      default: 13,
      min: 10,
      max: 18,
      unit: 'px',
      label: 'Font Size',
      description: 'Base font size for the interface',
      keywords: ['font', 'size', 'text', 'zoom', 'scale'],
    },
    responsePrettyPrint: {
      type: 'boolean',
      default: true,
      label: 'Pretty Print Responses',
      description: 'Format JSON/XML responses with indentation',
      keywords: ['pretty', 'format', 'json', 'xml', 'indent'],
    },
    responseLineWrap: {
      type: 'boolean',
      default: true,
      label: 'Wrap Response Lines',
      description: 'Wrap long lines in response viewer',
      keywords: ['wrap', 'line', 'response', 'viewer'],
    },
    showMethodBadges: {
      type: 'boolean',
      default: true,
      label: 'Show Method Badges',
      description: 'Show colored method badges (GET/POST) in sidebar',
      keywords: ['method', 'badge', 'get', 'post', 'sidebar'],
    },
    compactMode: {
      type: 'boolean',
      default: false,
      label: 'Compact Mode',
      description: 'Reduce padding throughout UI',
      keywords: ['compact', 'padding', 'dense'],
    },
    sidebarWidth: {
      type: 'number',
      default: 384,
      min: 280,
      max: 600,
      unit: 'px',
      label: 'Sidebar Width',
      description: 'Width of the collections sidebar',
      keywords: ['sidebar', 'width', 'size', 'panel'],
    },
  },

  mcp: {
    _meta: {
      label: 'MCP Integration',
      icon: '🤖',
      description: 'AI assistant configuration',
      badge: { text: 'AI-NATIVE', className: 'bg-purple-500/20 text-purple-400' },
    },
    enabled: {
      type: 'boolean',
      default: true,
      label: 'Enable MCP Server',
      description: 'Allow AI assistants to interact via Model Context Protocol',
      keywords: ['mcp', 'ai', 'claude', 'assistant', 'automation'],
    },
    allowSettingsModification: {
      type: 'boolean',
      default: true,
      label: 'Allow AI Settings Changes',
      description: 'Let AI assistants modify feature flags and preferences',
      keywords: ['ai', 'modify', 'settings', 'permission'],
      dependsOn: { key: 'mcp.enabled', value: true },
      warning: 'AI will be able to enable/disable features on your behalf.',
    },
    allowCollectionEdits: {
      type: 'boolean',
      default: true,
      label: 'Allow AI Collection Edits',
      description: 'Let AI create, modify, and delete requests in collections',
      keywords: ['ai', 'collection', 'request', 'edit', 'create'],
      dependsOn: { key: 'mcp.enabled', value: true },
    },
    allowRequestExecution: {
      type: 'boolean',
      default: false,
      label: 'Allow AI to Execute Requests',
      description: 'Let AI send HTTP requests on your behalf',
      keywords: ['ai', 'execute', 'send', 'request', 'http'],
      dependsOn: { key: 'mcp.enabled', value: true },
      warning: 'AI will be able to make real HTTP requests. Use with caution.',
    },
    auditLog: {
      type: 'boolean',
      default: true,
      label: 'MCP Audit Log',
      description: 'Log all AI actions for review',
      keywords: ['audit', 'log', 'history', 'ai', 'track'],
      dependsOn: { key: 'mcp.enabled', value: true },
    },
  },
};
