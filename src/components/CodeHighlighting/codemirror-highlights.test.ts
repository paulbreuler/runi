/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Tests for CM6 highlight decoration extension
 * @description Verifies that highlight ranges produce Decoration.mark in EditorView
 */

import { describe, it, expect } from 'vitest';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { createHighlightExtension, type HighlightRange } from './codemirror-highlights';

/** Helper: create an EditorView with highlights */
const createEditorWithHighlights = (doc: string, ranges: HighlightRange[]): EditorView => {
  const ext = createHighlightExtension(ranges);
  const state = EditorState.create({ doc, extensions: [ext] });
  return new EditorView({ state });
};

describe('codemirror-highlights', () => {
  describe('createHighlightExtension', () => {
    it('returns an extension that can be added to EditorState', () => {
      const ext = createHighlightExtension([]);
      const state = EditorState.create({ doc: 'test', extensions: [ext] });
      expect(state).toBeDefined();
    });

    it('produces no decorations for empty ranges', () => {
      const view = createEditorWithHighlights('hello world', []);
      const highlighted = view.dom.querySelectorAll('.cm-runi-highlight');
      expect(highlighted.length).toBe(0);
      view.destroy();
    });

    it('produces a decoration for a single range', () => {
      const view = createEditorWithHighlights('hello world', [{ from: 0, to: 5 }]);
      const highlighted = view.dom.querySelectorAll('.cm-runi-highlight');
      expect(highlighted.length).toBe(1);
      expect(highlighted[0]?.textContent).toBe('hello');
      view.destroy();
    });

    it('produces decorations for multiple ranges', () => {
      const view = createEditorWithHighlights('hello world foo', [
        { from: 0, to: 5 },
        { from: 6, to: 11 },
      ]);
      const highlighted = view.dom.querySelectorAll('.cm-runi-highlight');
      expect(highlighted.length).toBe(2);
      view.destroy();
    });

    it('applies custom className when provided', () => {
      const view = createEditorWithHighlights('hello world', [
        { from: 0, to: 5, className: 'cm-search-match' },
      ]);
      const highlighted = view.dom.querySelectorAll('.cm-search-match');
      expect(highlighted.length).toBe(1);
      view.destroy();
    });

    it('clamps ranges to document bounds', () => {
      // Range extends beyond doc length — should clamp
      const view = createEditorWithHighlights('hi', [{ from: 0, to: 100 }]);
      const highlighted = view.dom.querySelectorAll('.cm-runi-highlight');
      expect(highlighted.length).toBe(1);
      expect(highlighted[0]?.textContent).toBe('hi');
      view.destroy();
    });

    it('skips invalid ranges (from >= to)', () => {
      const view = createEditorWithHighlights('hello', [{ from: 3, to: 2 }]);
      const highlighted = view.dom.querySelectorAll('.cm-runi-highlight');
      expect(highlighted.length).toBe(0);
      view.destroy();
    });

    it('skips ranges with negative positions', () => {
      const view = createEditorWithHighlights('hello', [{ from: -1, to: 3 }]);
      const highlighted = view.dom.querySelectorAll('.cm-runi-highlight');
      expect(highlighted.length).toBe(0);
      view.destroy();
    });

    it('can update highlights via Compartment reconfigure', () => {
      const compartment = new Compartment();
      const ext1 = createHighlightExtension([{ from: 0, to: 5 }]);
      const ext2 = createHighlightExtension([{ from: 6, to: 11 }]);

      const state = EditorState.create({
        doc: 'hello world',
        extensions: [compartment.of(ext1)],
      });
      const view = new EditorView({ state });

      let highlighted = view.dom.querySelectorAll('.cm-runi-highlight');
      expect(highlighted.length).toBe(1);
      expect(highlighted[0]?.textContent).toBe('hello');

      // Reconfigure compartment with new highlights
      view.dispatch({
        effects: compartment.reconfigure(ext2),
      });

      highlighted = view.dom.querySelectorAll('.cm-runi-highlight');
      expect(highlighted.length).toBe(1);
      expect(highlighted[0]?.textContent).toBe('world');

      view.destroy();
    });
  });
});
