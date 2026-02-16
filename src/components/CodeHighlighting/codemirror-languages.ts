/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Extension } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';
import { xml } from '@codemirror/lang-xml';
import { javascript } from '@codemirror/lang-javascript';
import { bracketMatching } from '@codemirror/language';
import { closeBrackets } from '@codemirror/autocomplete';

/** Alias map normalises shorthand language names to canonical keys. */
const aliasMap: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  yml: 'yaml',
};

/**
 * Returns a CodeMirror 6 extension array for the given language string,
 * or `null` when no language extension applies (plain-text fallback).
 *
 * JSON includes bracket matching and auto-close brackets.
 */
export const getLanguageExtension = (language: string): Extension[] | null => {
  const key = language.toLowerCase();
  const resolved = aliasMap[key] ?? key;

  switch (resolved) {
    case 'json':
      return [json(), bracketMatching(), closeBrackets()];
    case 'yaml':
      return [yaml()];
    case 'xml':
      return [xml()];
    case 'javascript':
      return [javascript()];
    case 'typescript':
      return [javascript({ typescript: true })];
    case 'html':
    case 'http':
    case 'text':
    case '':
      return null;
    default:
      return null;
  }
};
