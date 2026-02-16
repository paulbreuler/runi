/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { ReactElement } from 'react';
import { useEffect, useState, useRef } from 'react';
import type { EditorView } from '@codemirror/view';
import { CodeEditor } from '@/components/CodeHighlighting/CodeEditor';
import type { SettingsSchema, DeepPartialSettings } from '@/types/settings';
import { mergeWithDefaults } from '@/types/settings-defaults';

function getMatchIndices(text: string, query: string, caseSensitive: boolean): number[] {
  const q = query.trim();
  if (q === '') {
    return [];
  }
  const lower = caseSensitive ? q : q.toLowerCase();
  const lowerText = caseSensitive ? text : text.toLowerCase();
  const indices: number[] = [];
  let pos = 0;
  while ((pos = lowerText.indexOf(lower, pos)) !== -1) {
    indices.push(pos);
    pos += 1;
  }
  return indices;
}

export interface SettingsJsonEditorProps {
  settings: SettingsSchema;
  onChange: (settings: SettingsSchema) => void;
  onError: (error: string | null) => void;
  /** When set, search is scoped to JSON content; editor scrolls to and highlights match at currentMatchIndex (focus stays in search box, VS Code–style). */
  searchQuery?: string;
  /** Toggle for case-sensitive search */
  caseSensitive?: boolean;
  /** 0-based index of which match to show (for prev/next navigation) */
  currentMatchIndex?: number;
  /** Called when match count for searchQuery changes */
  onMatchCountChange?: (count: number) => void;
}

export function SettingsJsonEditor({
  settings,
  onChange,
  onError,
  searchQuery = '',
  caseSensitive = false,
  currentMatchIndex = 0,
  onMatchCountChange,
}: SettingsJsonEditorProps): ReactElement {
  const [jsonText, setJsonText] = useState(() => JSON.stringify(settings, null, 2));
  const [error, setError] = useState<string | null>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const jsonTextRef = useRef(jsonText);
  jsonTextRef.current = jsonText;

  const query = searchQuery.trim();

  useEffect(() => {
    setJsonText(JSON.stringify(settings, null, 2));
  }, [settings]);

  // Report match count when query or text changes
  useEffect(() => {
    const indices = getMatchIndices(jsonText, query, caseSensitive);
    onMatchCountChange?.(indices.length);
  }, [query, jsonText, onMatchCountChange, caseSensitive]);

  // Scroll to current match and set selection via EditorView API.
  useEffect(() => {
    const query = searchQuery.trim();
    if (query === '' || editorViewRef.current === null) {
      return;
    }
    const text = jsonTextRef.current;
    const matchIndices = getMatchIndices(text, query, caseSensitive);
    const matchIdx = Math.max(0, Math.min(currentMatchIndex, matchIndices.length - 1));
    const start = matchIndices[matchIdx];
    if (start === undefined) {
      return;
    }
    const end = start + query.length;
    const view = editorViewRef.current;
    view.dispatch({
      selection: { anchor: start, head: end },
      scrollIntoView: true,
    });
  }, [searchQuery, currentMatchIndex, caseSensitive]);

  const handleChange = (value: string): void => {
    setJsonText(value);
    try {
      const parsed = JSON.parse(value) as DeepPartialSettings<SettingsSchema>;
      const merged = mergeWithDefaults(parsed);
      setError(null);
      onError(null);
      onChange(merged);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid JSON';
      setError(message);
      onError(message);
    }
  };

  return (
    <div className="flex flex-col h-full" data-test-id="settings-json-editor">
      <CodeEditor
        mode="edit"
        code={jsonText}
        onChange={handleChange}
        language="json"
        variant="borderless"
        placeholder="{}"
        enableJsonValidation
        enableJsonFormatting
        enableSearch={false}
        editorRef={editorViewRef}
        className="flex-1 min-h-0"
      />
      {error !== null && error !== '' ? (
        <div
          className="px-4 py-2 border-t border-border-subtle bg-red-3 text-red-11 text-xs shrink-0"
          data-test-id="settings-json-error"
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
