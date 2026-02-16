/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CodeMirror 6 theme extension for runi
 * @description Reads CSS custom properties from runi's design system for reactive dark/light mode.
 * Styles: editor bg, text, selection, cursor, gutter, active line, search panel, focus ring.
 * Reduced motion: disables cursor blink when prefers-reduced-motion is active.
 */

import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

/**
 * runi editor theme — dark-first, CSS-custom-property-driven.
 *
 * Uses `var()` references so the editor reactively follows runi's theme
 * class changes (dark ↔ light) without remounting.
 */
const theme = EditorView.theme({
  // Editor root
  '&': {
    backgroundColor: 'var(--color-bg-app)',
    color: 'var(--color-text-secondary)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.875rem',
    lineHeight: '1.6',
    height: '100%',
  },

  // Focus ring — keyboard-only, mirrors focusRingClasses pattern (--color-ring, 2px)
  // Scoped to html[data-intent="keyboard"] so mouse clicks don't show focus ring
  'html[data-intent="keyboard"] &.cm-focused': {
    outline: '2px solid var(--color-ring)',
    outlineOffset: '2px',
  },

  // Content area
  '.cm-content': {
    caretColor: 'var(--color-text-secondary)',
    fontFamily: 'var(--font-mono)',
    padding: '0.5rem 0',
  },

  // Cursor
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--color-text-secondary)',
    borderLeftWidth: '2px',
  },

  // Selection
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'var(--accent-a4, oklch(0.7 0.1 230 / 25%))',
  },
  '.cm-selectionMatch': {
    backgroundColor: 'var(--accent-a3, oklch(0.7 0.1 230 / 15%))',
  },

  // Active line
  '.cm-activeLine': {
    backgroundColor: 'var(--accent-a2, oklch(0.7 0.1 230 / 8%))',
  },

  // Gutter
  '.cm-gutters': {
    backgroundColor: 'var(--color-bg-app)',
    color: 'var(--color-text-muted)',
    border: 'none',
    paddingRight: '0.5rem',
  },
  '.cm-gutter': {
    minWidth: '2.5em',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--accent-a2, oklch(0.7 0.1 230 / 8%))',
    color: 'var(--color-text-secondary)',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    opacity: '0.5',
    fontSize: '0.875rem',
    lineHeight: '1.6',
  },

  // Scrollbar
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'var(--font-mono)',
  },

  // Search panel
  '.cm-panels': {
    backgroundColor: 'var(--color-bg-surface)',
    borderBottom: '1px solid var(--color-border-subtle)',
    color: 'var(--color-text-primary)',
  },
  '.cm-panels.cm-panels-top': {
    borderBottom: '1px solid var(--color-border-subtle)',
  },
  '.cm-panels.cm-panels-bottom': {
    borderTop: '1px solid var(--color-border-subtle)',
  },
  '.cm-search': {
    padding: '0.5rem',
  },
  '.cm-search input': {
    backgroundColor: 'var(--color-bg-app)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border-subtle)',
    borderRadius: '4px',
    padding: '0.25rem 0.5rem',
    fontSize: '0.875rem',
    outline: 'none',
  },
  '.cm-search input:focus-visible': {
    outline: '2px solid var(--color-ring)',
    outlineOffset: '2px',
  },
  '.cm-search button': {
    backgroundColor: 'var(--color-bg-raised, #26272b)',
    color: 'var(--color-text-secondary)',
    border: '1px solid var(--color-border-subtle)',
    borderRadius: '4px',
    padding: '0.25rem 0.5rem',
    fontSize: '0.8125rem',
    cursor: 'pointer',
  },
  '.cm-search button:hover': {
    backgroundColor: 'var(--color-hover, var(--color-bg-raised))',
    color: 'var(--color-text-primary)',
  },
  '.cm-search label': {
    color: 'var(--color-text-muted)',
    fontSize: '0.8125rem',
  },

  // Fold gutter
  '.cm-foldGutter': {
    color: 'var(--color-text-muted)',
    opacity: '0.5',
  },
  '.cm-foldGutter:hover': {
    opacity: '1',
  },

  // Matching bracket
  '&.cm-focused .cm-matchingBracket': {
    backgroundColor: 'var(--accent-a3, oklch(0.7 0.1 230 / 15%))',
    outline: '1px solid var(--color-border-default)',
  },

  // Tooltip
  '.cm-tooltip': {
    backgroundColor: 'var(--color-bg-surface)',
    border: '1px solid var(--color-border-subtle)',
    borderRadius: '4px',
    color: 'var(--color-text-primary)',
  },
  '.cm-tooltip-autocomplete': {
    backgroundColor: 'var(--color-bg-surface)',
  },
});

/**
 * Base theme for reduced-motion and non-themed-selector defaults.
 * Uses `baseTheme` so it can be overridden by the dark/light theme above.
 */
const baseTheme = EditorView.baseTheme({
  // Reduced motion: disable cursor blink
  '@media (prefers-reduced-motion: reduce)': {
    '.cm-cursor': {
      animationDuration: '0s !important',
      animationIterationCount: '1 !important',
    },
  },
});

/**
 * Syntax highlighting colors — maps lezer tags to runi design tokens.
 *
 * Uses CSS `var()` references so token colors react to dark/light mode
 * without remounting the editor.
 */
export const runiHighlightStyle = HighlightStyle.define([
  // Keywords
  { tag: [tags.keyword, tags.controlKeyword], color: 'var(--color-accent-blue)' },

  // Strings
  { tag: [tags.string, tags.special(tags.string)], color: 'var(--color-signal-success)' },

  // Numbers
  { tag: [tags.number, tags.integer, tags.float], color: 'var(--color-signal-warning)' },

  // Booleans and null
  { tag: [tags.bool, tags.null], color: 'var(--color-signal-warning)' },

  // Comments
  {
    tag: [tags.comment, tags.lineComment, tags.blockComment],
    color: 'var(--color-text-muted)',
    fontStyle: 'italic',
  },

  // Functions
  {
    tag: [tags.function(tags.variableName), tags.function(tags.definition(tags.variableName))],
    color: 'var(--color-accent-blue)',
  },

  // Property names
  {
    tag: [tags.propertyName, tags.definition(tags.propertyName)],
    color: 'var(--color-text-primary)',
  },

  // Types and classes
  { tag: [tags.typeName, tags.className, tags.namespace], color: 'var(--color-signal-ai)' },

  // Operators and punctuation
  { tag: [tags.operator, tags.punctuation], color: 'var(--color-text-muted)' },

  // Variables (default text)
  { tag: tags.variableName, color: 'var(--color-text-secondary)' },

  // Meta / processing instructions
  { tag: [tags.meta, tags.processingInstruction], color: 'var(--color-text-muted)' },

  // Regexp
  { tag: tags.regexp, color: 'var(--color-signal-error)' },

  // HTML/XML tags
  { tag: tags.tagName, color: 'var(--color-accent-blue)' },

  // HTML/XML attributes
  { tag: tags.attributeName, color: 'var(--color-signal-warning)' },
  { tag: tags.attributeValue, color: 'var(--color-signal-success)' },
]);

/**
 * Complete runi theme extension for CodeMirror 6.
 *
 * Combines:
 * - Dark/light reactive theme (CSS custom properties)
 * - Syntax highlighting (token colors via CSS custom properties)
 * - Focus ring styling (--color-ring, 2px, focus-visible)
 * - Reduced motion support (disables cursor blink)
 *
 * @example
 * ```ts
 * import { runiTheme } from './codemirror-theme';
 * const state = EditorState.create({ extensions: [runiTheme] });
 * ```
 */
export const runiTheme: Extension = [theme, baseTheme, syntaxHighlighting(runiHighlightStyle)];
