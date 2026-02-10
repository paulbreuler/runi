/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { HttpResponse } from './http';

/**
 * Identifies the origin of a tab's content — either a collection request or a history entry.
 * Used by `findTabBySource` to avoid opening duplicate tabs for the same resource.
 */
export interface TabSource {
  type: 'collection' | 'history';
  collectionId?: string;
  requestId?: string;
  historyEntryId?: string;
}

/**
 * State for a single open request tab.
 *
 * Each tab holds an independent copy of request state (method, url, headers, body)
 * plus its response. The active tab syncs bidirectionally with `useRequestStore`.
 */
export interface TabState {
  /** Unique tab identifier (UUID) */
  id: string;
  /** Display label derived from URL path or collection request name */
  label: string;
  /** HTTP method */
  method: string;
  /** Request URL */
  url: string;
  /** Request headers */
  headers: Record<string, string>;
  /** Request body */
  body: string;
  /** Cached response (excluded from persistence) */
  response: HttpResponse | null;
  /** Whether the tab has unsaved changes relative to its source */
  isDirty: boolean;
  /** Origin of this tab's content, if loaded from collection or history */
  source?: TabSource;
  /** Timestamp when the tab was created */
  createdAt: number;
}

/**
 * Derive a human-readable tab label from a URL or explicit name.
 *
 * @param url - The request URL
 * @param name - Optional explicit name (e.g., from a collection request)
 * @returns A short label for display in the tab list
 */
export function deriveTabLabel(url: string, name?: string): string {
  if (name !== undefined && name.length > 0) {
    return name;
  }

  if (url.length === 0) {
    return 'New Request';
  }

  try {
    const parsed = new URL(url);
    const path = parsed.pathname;
    // Use last meaningful path segment, or hostname if root
    if (path === '/' || path === '') {
      return parsed.hostname;
    }
    // Remove trailing slash and get last segment
    const segments = path.replace(/\/$/, '').split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    return lastSegment !== undefined ? `/${lastSegment}` : parsed.hostname;
  } catch {
    // Not a valid URL — return as-is (truncated)
    return url.length > 30 ? `${url.slice(0, 30)}...` : url;
  }
}
