/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { ReactElement } from 'react';
import { SettingsSection } from './SettingsSection';
import type { SettingsSchema, SettingsCategory, SettingKey } from '@/types/settings';

export interface McpTabProps {
  settings: SettingsSchema;
  onUpdate: <C extends SettingsCategory>(
    category: C,
    key: SettingKey<C>,
    value: SettingsSchema[C][SettingKey<C>]
  ) => void;
}

export function McpTab({ settings, onUpdate }: McpTabProps): ReactElement {
  const enabled = settings.mcp.enabled;

  return (
    <div className="flex flex-col" data-test-id="settings-mcp-tab">
      <div className="px-4 pt-4">
        <div
          className={`rounded-lg border px-4 py-3 ${
            enabled ? 'bg-accent-3/10 border-accent-6/30' : 'bg-bg-raised border-border-subtle'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                enabled ? 'bg-green-500 animate-pulse' : 'bg-fg-muted'
              }`}
              aria-hidden
            />
            <div>
              <div className="text-sm text-fg-default font-medium">
                MCP {enabled ? 'Enabled' : 'Disabled'}
              </div>
              <p className="text-xs text-fg-muted" data-test-id="mcp-status">
                {enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <SettingsSection
        category="mcp"
        settings={settings}
        onUpdate={onUpdate}
        searchResults={null}
        forceExpand
      />
    </div>
  );
}
