/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRequestStore } from '@/stores/useRequestStore';
import { KeyValueEditor, type KeyValueEntry } from './KeyValueEditor';

/**
 * ParamsEditor component for managing URL query parameters.
 *
 * Uses the shared KeyValueEditor with `=` separator.
 * Parses params from the URL and writes them back on change.
 */
export const ParamsEditor = (): React.JSX.Element => {
  const { url, setUrl } = useRequestStore();
  const [params, setParams] = useState<KeyValueEntry[]>([]);

  // Parse URL to extract query parameters
  useEffect(() => {
    try {
      const urlObj = new URL(url);
      const parsedParams: KeyValueEntry[] = [];
      urlObj.searchParams.forEach((value, key) => {
        parsedParams.push({ key, value });
      });
      setParams(parsedParams);
    } catch {
      setParams([]);
    }
  }, [url]);

  const handleEntriesChange = useCallback(
    (newEntries: KeyValueEntry[]): void => {
      try {
        const urlObj = new URL(url);
        urlObj.search = '';
        for (const { key, value } of newEntries) {
          if (key.trim().length > 0) {
            urlObj.searchParams.append(key.trim(), value.trim());
          }
        }
        setUrl(urlObj.toString());
      } catch {
        // Invalid URL, don't update
      }
    },
    [url, setUrl]
  );

  return (
    <KeyValueEditor
      entries={params}
      onEntriesChange={handleEntriesChange}
      separator="="
      keyPlaceholder="Parameter name"
      valuePlaceholder="Parameter value"
      testIdPrefix="param"
      labelPrefix="parameter"
    />
  );
};
