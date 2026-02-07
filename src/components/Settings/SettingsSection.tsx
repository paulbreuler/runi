/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition -- runtime guards for optional schema keys */
/* eslint-disable @typescript-eslint/no-unnecessary-type-arguments -- explicit SettingKey<typeof category> for inference */
import type { ReactElement } from 'react';
import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import { SettingRow } from './SettingRow';
import { SETTINGS_SCHEMA, type SettingMeta } from '@/types/settings-meta';
import type { SettingsSchema, SettingsCategory, SettingKey } from '@/types/settings';

export interface SettingsSectionProps {
  category: SettingsCategory;
  settings: SettingsSchema;
  onUpdate: <C extends SettingsCategory>(
    category: C,
    key: SettingKey<C>,
    value: SettingsSchema[C][SettingKey<C>]
  ) => void;
  searchResults: Set<string> | null;
  forceExpand?: boolean;
}

/**
 * Collapsible section for one settings category (http, storage, ui, mcp).
 * Shows _meta icon, label, optional badge; expand/collapse; list of SettingRows.
 */
export function SettingsSection({
  category,
  settings,
  onUpdate,
  searchResults,
  forceExpand = false,
}: SettingsSectionProps): ReactElement {
  const schema = SETTINGS_SCHEMA[category];
  const meta = schema._meta;
  const [isExpanded, setIsExpanded] = useState(forceExpand || category === 'http');

  useEffect(() => {
    setIsExpanded(forceExpand);
  }, [forceExpand]);

  const schemaKeys = Object.keys(schema);
  const fieldEntries = schemaKeys.filter((k) => k !== '_meta') as Array<
    SettingKey<typeof category>
  >;

  const visibleFields =
    searchResults !== null
      ? fieldEntries.filter(
          (key) => searchResults.has(category) || searchResults.has(`${category}.${String(key)}`)
        )
      : fieldEntries;

  if (searchResults !== null && visibleFields.length === 0) {
    return <></>;
  }

  return (
    <div
      className="border-b border-border-subtle last:border-b-0"
      data-test-id={`settings-section-${category}`}
    >
      <button
        type="button"
        onClick={() => {
          setIsExpanded((e) => !e);
        }}
        className={cn(
          focusRingClasses,
          'w-full flex items-center gap-2 py-3 px-4 rounded-lg transition-colors',
          'hover:bg-bg-raised/50 text-left'
        )}
        aria-expanded={isExpanded}
        aria-controls={`settings-section-content-${category}`}
        id={`settings-section-heading-${category}`}
        data-test-id={`settings-section-toggle-${category}`}
      >
        <span
          className={cn('text-fg-muted text-xs transition-transform', isExpanded && 'rotate-90')}
          aria-hidden
        >
          <ChevronRight className="h-4 w-4" />
        </span>
        <span className="text-base" aria-hidden>
          {meta.icon}
        </span>
        <span className="text-fg-muted text-xs font-semibold tracking-wide uppercase">
          {meta.label}
        </span>
        {meta.badge !== undefined && meta.badge !== null ? (
          <span
            className={cn(
              'text-xs font-medium px-1.5 py-0.5 rounded-full',
              (meta.badge as { text: string; className: string }).className
            )}
          >
            {(meta.badge as { text: string; className: string }).text}
          </span>
        ) : null}
        <span className="text-fg-muted/70 text-xs ml-auto">
          {visibleFields.length} setting{visibleFields.length === 1 ? '' : 's'}
        </span>
      </button>
      {isExpanded && (
        <div
          id={`settings-section-content-${category}`}
          aria-labelledby={`settings-section-heading-${category}`}
          className="px-4 pb-2"
          role="region"
        >
          {visibleFields.map((key) => {
            const fieldSchema = schema[key] as SettingMeta<unknown> | undefined;
            if (fieldSchema === undefined || fieldSchema === null) {
              return null;
            }

            let parentDisabled = false;
            if (fieldSchema.dependsOn !== undefined && fieldSchema.dependsOn !== null) {
              const parts = fieldSchema.dependsOn.key.split('.');
              const depCat = parts[0];
              const depKey = parts[1];
              if (depCat !== undefined && depKey !== undefined) {
                const depValue = (settings as unknown as Record<string, Record<string, unknown>>)[
                  depCat
                ]?.[depKey];
                parentDisabled = depValue !== fieldSchema.dependsOn.value;
              }
            }

            const categorySettings = settings[category] as unknown as Record<string, unknown>;
            const value = categorySettings[key as string];

            return (
              <SettingRow
                key={String(key)}
                category={category}
                settingKey={key}
                schema={fieldSchema}
                value={value}
                onChange={(v) => {
                  onUpdate(
                    category,
                    key,
                    v as SettingsSchema[typeof category][SettingKey<typeof category>]
                  );
                }}
                isHighlighted={searchResults?.has(`${category}.${String(key)}`) === true}
                parentDisabled={parentDisabled}
                categoryKey={category}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
