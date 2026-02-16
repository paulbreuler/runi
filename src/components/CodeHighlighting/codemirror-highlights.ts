/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CM6 highlight decoration extension
 * @description Creates Decoration.mark ranges for external search highlighting,
 * error markers, or any range-based visual emphasis in CodeMirror 6.
 */

import { type Extension, RangeSetBuilder } from '@codemirror/state';
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
} from '@codemirror/view';

/** A range to highlight in the editor */
export interface HighlightRange {
  /** Start position (0-based character offset) */
  from: number;
  /** End position (exclusive, 0-based character offset) */
  to: number;
  /** Optional CSS class (defaults to 'cm-runi-highlight') */
  className?: string;
}

const DEFAULT_CLASS = 'cm-runi-highlight';

/** Build a DecorationSet from highlight ranges, clamped to doc bounds */
const buildDecorations = (ranges: HighlightRange[], docLength: number): DecorationSet => {
  const builder = new RangeSetBuilder<Decoration>();

  // Filter, clamp, and sort ranges
  const valid = ranges
    .filter((r) => r.from >= 0 && r.to > r.from)
    .map((r) => ({
      from: Math.min(r.from, docLength),
      to: Math.min(r.to, docLength),
      className: r.className ?? DEFAULT_CLASS,
    }))
    .filter((r) => r.from < r.to)
    .sort((a, b) => (a.from !== b.from ? a.from - b.from : a.to - b.to));

  for (const range of valid) {
    builder.add(range.from, range.to, Decoration.mark({ class: range.className }));
  }

  return builder.finish();
};

/**
 * Creates a CM6 extension that renders highlight decorations for the given ranges.
 *
 * Usage: pass to CodeMirror's extensions array. To update highlights, reconfigure
 * the editor with a new extension created from updated ranges.
 */
export const createHighlightExtension = (ranges: HighlightRange[]): Extension => {
  const plugin = ViewPlugin.define(
    (view) => ({
      decorations: buildDecorations(ranges, view.state.doc.length),
      update(update: ViewUpdate): void {
        if (update.docChanged) {
          this.decorations = buildDecorations(ranges, update.state.doc.length);
        }
      },
    }),
    {
      decorations: (plugin) => plugin.decorations,
    }
  );

  // Base styles for the default highlight class
  const baseTheme = EditorView.baseTheme({
    [`.${DEFAULT_CLASS}`]: {
      backgroundColor: 'var(--color-signal-info, rgba(59, 130, 246, 0.15))',
      borderRadius: '2px',
    },
  });

  return [plugin, baseTheme];
};
