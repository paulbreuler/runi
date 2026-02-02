/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition -- schema/key/errMsg guards for validation from partial input */
/* eslint-disable @typescript-eslint/no-unnecessary-type-conversion -- String() for restrict-template-expressions (category/key from generic) */

import type { SettingsSchema, SettingsCategory, SettingKey, DeepPartialSettings } from './settings';
import { SETTINGS_SCHEMA, type SettingMeta } from './settings-meta';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a single setting value against its schema.
 */
export function validateSetting<C extends SettingsCategory>(
  category: C,
  key: SettingKey<C>,
  value: unknown
): ValidationResult {
  const categorySchema = SETTINGS_SCHEMA[category];
  const schema = categorySchema[key as keyof typeof categorySchema] as SettingMeta | undefined;

  if (schema === undefined || schema === null || (key as string) === '_meta') {
    return { valid: false, error: `Unknown setting: ${String(category)}.${String(key)}` };
  }

  if (schema.type === 'boolean') {
    if (typeof value !== 'boolean') {
      return { valid: false, error: 'Must be true or false' };
    }
    return { valid: true };
  }

  if (schema.type === 'number') {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return { valid: false, error: 'Must be a number' };
    }
    const min = schema.min;
    if (min !== undefined && typeof value === 'number' && value < min) {
      const mult = schema.displayMultiplier;
      const display = mult !== undefined ? min * mult : min;
      const unit = schema.displayUnit ?? schema.unit ?? '';
      return {
        valid: false,
        error: `Minimum: ${String(display)}${unit}`,
      };
    }
    const max = schema.max;
    if (max !== undefined && typeof value === 'number' && value > max) {
      const mult = schema.displayMultiplier;
      const display = mult !== undefined ? max * mult : max;
      const unit = schema.displayUnit ?? schema.unit ?? '';
      return {
        valid: false,
        error: `Maximum: ${String(display)}${unit}`,
      };
    }
    return { valid: true };
  }

  if (schema.type === 'string') {
    if (typeof value !== 'string') {
      return { valid: false, error: 'Must be text' };
    }
    const pattern = schema.pattern;
    if (pattern !== undefined && pattern !== '' && !new RegExp(pattern).test(value)) {
      return { valid: false, error: 'Invalid format' };
    }
    return { valid: true };
  }

  // Only 'select' remains after boolean/number/string
  const validValues = schema.options?.map((o) => o.value) ?? [];
  const strValue = value as string;
  if (!validValues.includes(strValue)) {
    return {
      valid: false,
      error: `Must be one of: ${validValues.join(', ')}`,
    };
  }
  return { valid: true };
}

/**
 * Validate entire settings object; returns list of validation errors.
 */
export function validateSettings(
  settings: DeepPartialSettings<SettingsSchema>
): ValidationResult[] {
  const errors: ValidationResult[] = [];

  for (const [category, values] of Object.entries(settings)) {
    if (category === 'version') {
      continue;
    }
    if (typeof values !== 'object' || values === null) {
      continue;
    }

    for (const [key, value] of Object.entries(values)) {
      if (key === '_meta') {
        continue;
      }
      const result = validateSetting(
        category as SettingsCategory,
        key as SettingKey<SettingsCategory>,
        value
      );
      const errMsg = result.error;
      if (!result.valid && (errMsg?.length ?? 0) > 0) {
        errors.push({
          valid: false,
          error: `${String(category)}.${String(key)}: ${errMsg ?? ''}`,
        });
      }
    }
  }

  return errors;
}
