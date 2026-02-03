/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition -- config from schema[key] may be undefined at runtime */

import { SETTINGS_SCHEMA } from '@/types/settings-meta';
import type { SettingsCategory } from '@/types/settings';

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) {
    return true;
  }
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      qi++;
    }
  }
  return qi === q.length;
}

/**
 * Returns set of matching keys: category (e.g. "http") or "category.key" (e.g. "http.timeout").
 * Returns null when query is empty (show all).
 */
export function searchSettings(query: string): Set<string> | null {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const results = new Set<string>();
  const q = trimmed.toLowerCase();

  for (const category of Object.keys(SETTINGS_SCHEMA) as SettingsCategory[]) {
    const fields = SETTINGS_SCHEMA[category];
    const meta = fields._meta;

    const desc = (meta as { description?: string }).description ?? '';
    if (fuzzyMatch(q, meta.label) || fuzzyMatch(q, desc)) {
      results.add(category);
      continue;
    }

    for (const key of Object.keys(fields)) {
      if (key === '_meta') {
        continue;
      }
      const config = (
        fields as Record<string, { label: string; description: string; keywords?: string[] }>
      )[key];
      if (config === undefined || config === null) {
        continue;
      }
      const searchable = [config.label, config.description, ...(config.keywords ?? [])].join(' ');
      if (fuzzyMatch(q, searchable)) {
        results.add(`${category}.${key}`);
      }
    }
  }

  return results;
}
