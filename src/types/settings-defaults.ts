/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition -- runtime guard for partial/JSON input */

import type { SettingsSchema, DeepPartialSettings } from './settings';
import { SETTINGS_SCHEMA, type SettingMeta } from './settings-meta';

/**
 * Generate default settings from schema metadata.
 */
function generateDefaults(): SettingsSchema {
  const defaults: Record<string, Record<string, unknown>> = {};

  for (const [category, fields] of Object.entries(SETTINGS_SCHEMA)) {
    defaults[category] = {};

    for (const [key, meta] of Object.entries(fields)) {
      if (key === '_meta') {
        continue;
      }
      defaults[category][key] = (meta as SettingMeta).default;
    }
  }

  return { version: 1, ...defaults } as SettingsSchema;
}

export const DEFAULT_SETTINGS: SettingsSchema = generateDefaults();

/**
 * Deep merge partial settings with defaults.
 * Unspecified keys keep default values.
 */
export function mergeWithDefaults(partial: DeepPartialSettings<SettingsSchema>): SettingsSchema {
  const result = structuredClone(DEFAULT_SETTINGS);

  for (const key of Object.keys(partial) as Array<keyof SettingsSchema>) {
    if (key === 'version') {
      continue;
    }
    const values = partial[key];
    const target = result[key];
    // Runtime guard for partial/JSON input (type allows undefined)
    if (
      typeof values === 'object' &&
      values !== null &&
      typeof target === 'object' &&
      target !== null
    ) {
      (result as unknown as Record<string, unknown>)[key] = {
        ...target,
        ...values,
      };
    }
  }

  return result;
}
