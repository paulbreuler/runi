/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useCallback, useMemo } from 'react';
import { useRequestStore } from '@/stores/useRequestStore';
import { KeyValueEditor, type KeyValueEntry } from './KeyValueEditor';

/**
 * HeaderEditor component for managing HTTP request headers.
 *
 * Uses the shared KeyValueEditor with `:` separator.
 */
export const HeaderEditor = (): React.JSX.Element => {
  const { headers, setHeaders } = useRequestStore();

  const entries: KeyValueEntry[] = useMemo(
    () => Object.entries(headers).map(([key, value]) => ({ key, value })),
    [headers]
  );

  const handleEntriesChange = useCallback(
    (newEntries: KeyValueEntry[]): void => {
      const newHeaders: Record<string, string> = {};
      for (const entry of newEntries) {
        newHeaders[entry.key] = entry.value;
      }
      setHeaders(newHeaders);
    },
    [setHeaders]
  );

  return (
    <KeyValueEditor
      entries={entries}
      onEntriesChange={handleEntriesChange}
      separator=":"
      keyPlaceholder="Header name"
      valuePlaceholder="Header value"
      testIdPrefix="header"
      labelPrefix="header"
    />
  );
};
