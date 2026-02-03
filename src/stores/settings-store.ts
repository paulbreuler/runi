/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { create } from 'zustand';
import type { SettingsCategory, SettingsSchema, SettingKey } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings-defaults';

export interface SettingsStoreState {
  settings: SettingsSchema;
  setSettings: (settings: SettingsSchema) => void;
  updateSetting: <C extends SettingsCategory>(
    category: C,
    key: SettingKey<C>,
    value: SettingsSchema[C][SettingKey<C>]
  ) => SettingsSchema;
  resetToDefaults: () => SettingsSchema;
}

export const useSettings = create<SettingsStoreState>((set, get) => ({
  settings: structuredClone(DEFAULT_SETTINGS),
  setSettings: (settings): void => {
    set({ settings });
  },
  updateSetting: (category, key, value): SettingsSchema => {
    const current = get().settings;
    const next: SettingsSchema = {
      ...current,
      [category]: {
        ...current[category],
        [key]: value,
      },
    };
    set({ settings: next });
    return next;
  },
  resetToDefaults: (): SettingsSchema => {
    const next = structuredClone(DEFAULT_SETTINGS);
    set({ settings: next });
    return next;
  },
}));
