/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import type { SettingsSchema, DeepPartialSettings } from '@/types/settings';
import { mergeWithDefaults } from '@/types/settings-defaults';

export interface SettingsJsonEditorProps {
  settings: SettingsSchema;
  onChange: (settings: SettingsSchema) => void;
  onError: (error: string | null) => void;
}

export function SettingsJsonEditor({
  settings,
  onChange,
  onError,
}: SettingsJsonEditorProps): ReactElement {
  const [jsonText, setJsonText] = useState(() => JSON.stringify(settings, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setJsonText(JSON.stringify(settings, null, 2));
  }, [settings]);

  const handleChange = (value: string): void => {
    setJsonText(value);
    try {
      const parsed = JSON.parse(value) as DeepPartialSettings<SettingsSchema>;
      const merged = mergeWithDefaults(parsed);
      setError(null);
      onError(null);
      onChange(merged);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid JSON';
      setError(message);
      onError(message);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <textarea
        value={jsonText}
        onChange={(e) => {
          handleChange(e.target.value);
        }}
        spellCheck={false}
        className="w-full h-full p-4 bg-bg-app text-sm font-mono text-fg-default resize-none outline-none"
        data-test-id="settings-json-editor"
      />
      {error !== null && error !== '' ? (
        <div
          className="px-4 py-2 border-t border-border-subtle bg-red-3 text-red-11 text-xs"
          data-test-id="settings-json-error"
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
