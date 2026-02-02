/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { ReactElement } from 'react';
import { SettingsSection } from './SettingsSection';
import type { SettingsSchema, SettingsCategory, SettingKey } from '@/types/settings';

const GENERAL_CATEGORIES: SettingsCategory[] = ['http', 'storage', 'ui'];

export interface GeneralTabProps {
  settings: SettingsSchema;
  onUpdate: <C extends SettingsCategory>(
    category: C,
    key: SettingKey<C>,
    value: SettingsSchema[C][SettingKey<C>]
  ) => void;
  searchResults: Set<string> | null;
}

/**
 * General tab: HTTP, Storage, Appearance (ui) sections.
 */
export function GeneralTab({ settings, onUpdate, searchResults }: GeneralTabProps): ReactElement {
  return (
    <div className="flex flex-col" data-test-id="settings-general-tab">
      {GENERAL_CATEGORIES.map((category) => (
        <SettingsSection
          key={category}
          category={category}
          settings={settings}
          onUpdate={onUpdate}
          searchResults={searchResults}
          forceExpand={searchResults !== null && searchResults.size > 0}
        />
      ))}
    </div>
  );
}
