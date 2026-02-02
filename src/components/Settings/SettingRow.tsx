/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { ReactElement } from 'react';
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/Switch';
import * as Select from '@/components/ui/select';
import type { SettingMeta } from '@/types/settings-meta';
import { validateSetting } from '@/types/settings-validation';
import type { SettingsCategory, SettingKey } from '@/types/settings';

export interface SettingRowProps<C extends SettingsCategory> {
  category: C;
  settingKey: SettingKey<C>;
  schema: SettingMeta;
  value: unknown;
  onChange: (value: unknown) => void;
  isHighlighted?: boolean;
  parentDisabled?: boolean;
  /** For validation (number min/max) */
  categoryKey: string;
}

/**
 * Single setting row: label, description, optional warning, and control
 * (Switch / number input / select / text). Respects dependsOn (parentDisabled)
 * and shows warning when value !== default and schema.warning is set.
 */
export function SettingRow<C extends SettingsCategory>({
  category,
  settingKey,
  schema,
  value,
  onChange,
  isHighlighted = false,
  parentDisabled = false,
  categoryKey,
}: SettingRowProps<C>): ReactElement {
  const isDisabled = parentDisabled;
  const rawValue = value ?? schema.default;
  const showWarning =
    schema.warning !== undefined &&
    rawValue !== schema.default &&
    typeof schema.default !== 'object';

  const [numberError, setNumberError] = useState<string | null>(null);

  const handleNumberChange = (displayValue: number): void => {
    const mult = schema.displayMultiplier;
    const actual = mult !== undefined ? displayValue / mult : displayValue;
    const result = validateSetting(category, settingKey, actual);
    if (result.valid) {
      setNumberError(null);
      onChange(actual);
    } else {
      setNumberError(result.error ?? null);
    }
  };

  const displayMultiplier = schema.displayMultiplier ?? null;
  const displayValue =
    schema.type === 'number' && typeof rawValue === 'number' && displayMultiplier !== null
      ? rawValue * displayMultiplier
      : rawValue;

  const displayMin =
    schema.min !== undefined && displayMultiplier !== null
      ? schema.min * displayMultiplier
      : schema.min;
  const displayMax =
    schema.max !== undefined && displayMultiplier !== null
      ? schema.max * displayMultiplier
      : schema.max;
  const safeMult = displayMultiplier !== null && displayMultiplier > 0 ? displayMultiplier : 1;
  const displayStep = (schema.step ?? 1) * safeMult;

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 py-3 px-2 -mx-2 rounded-lg transition-colors',
        isHighlighted && 'bg-accent-3/10 ring-1 ring-accent-5/30',
        isDisabled && 'opacity-50'
      )}
      data-test-id={`setting-row-${categoryKey}-${String(settingKey)}`}
    >
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-fg-default font-medium">{schema.label}</span>
        </div>
        <p className="text-xs text-fg-muted mt-0.5">{schema.description}</p>
        {showWarning && (
          <p className="text-[11px] text-amber-11 mt-1 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
            {schema.warning}
          </p>
        )}
      </div>
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        {schema.type === 'boolean' && (
          <Switch
            checked={Boolean(rawValue)}
            onCheckedChange={(checked) => {
              onChange(checked);
            }}
            disabled={isDisabled}
            data-test-id={`setting-${categoryKey}-${String(settingKey)}`}
          />
        )}
        {schema.type === 'number' && (
          <>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={typeof displayValue === 'number' ? displayValue : ''}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!Number.isNaN(v)) {
                    handleNumberChange(v);
                  }
                }}
                min={displayMin}
                max={displayMax}
                step={displayStep}
                disabled={isDisabled}
                className="w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                data-test-id={`setting-${categoryKey}-${String(settingKey)}`}
              />
              {((): ReactElement | null => {
                const unit = schema.displayUnit ?? schema.unit ?? '';
                return unit !== '' ? <span className="text-xs text-fg-muted">{unit}</span> : null;
              })()}
            </div>
            {numberError !== null && numberError !== '' ? (
              <span className="text-[10px] text-red-11">{numberError}</span>
            ) : null}
          </>
        )}
        {schema.type === 'string' && (
          <Input
            type="text"
            value={typeof (rawValue as string) === 'string' ? (rawValue as string) : ''}
            onChange={(e) => {
              onChange(e.target.value);
            }}
            placeholder={
              schema.placeholder !== undefined && schema.placeholder !== ''
                ? schema.placeholder
                : undefined
            }
            disabled={isDisabled}
            className="w-40"
            data-test-id={`setting-${categoryKey}-${String(settingKey)}`}
          />
        )}
        {schema.type === 'select' && (schema.options?.length ?? 0) > 0 ? (
          <Select.Select
            value={
              typeof (rawValue as string) === 'string'
                ? (rawValue as string)
                : String(schema.default)
            }
            onValueChange={(v) => {
              onChange(v);
            }}
            disabled={isDisabled}
          >
            <Select.SelectTrigger
              className="w-[140px]"
              data-test-id={`setting-${categoryKey}-${String(settingKey)}`}
            >
              <Select.SelectValue />
            </Select.SelectTrigger>
            <Select.SelectContent
              data-test-id={`setting-${categoryKey}-${String(settingKey)}-list`}
            >
              {(schema.options ?? []).map((opt) => (
                <Select.SelectItem
                  key={opt.value}
                  value={opt.value}
                  data-test-id={`setting-option-${opt.value}`}
                >
                  {opt.label}
                </Select.SelectItem>
              ))}
            </Select.SelectContent>
          </Select.Select>
        ) : null}
      </div>
    </div>
  );
}
