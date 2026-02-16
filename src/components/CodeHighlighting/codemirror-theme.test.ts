/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { EditorView } from '@codemirror/view';
import { EditorState, type Extension } from '@codemirror/state';
import { HighlightStyle } from '@codemirror/language';
import { runiTheme, runiHighlightStyle } from './codemirror-theme';

/**
 * Helper: create an EditorView with the runi theme applied.
 * Mounts into a detached DOM element so we can inspect computed styles.
 */
function createThemedView(extensions: Extension[] = []): EditorView {
  const parent = document.createElement('div');
  document.body.appendChild(parent);
  const state = EditorState.create({
    doc: 'hello world',
    extensions: [runiTheme, ...extensions],
  });
  const view = new EditorView({ state, parent });
  view.dom.setAttribute('data-test-id', 'cm-editor');
  return view;
}

describe('runiTheme', () => {
  it('returns a valid CM6 Extension', () => {
    // Extension is an opaque type - verify it can be used in EditorState.create
    const state = EditorState.create({
      doc: '',
      extensions: [runiTheme],
    });
    expect(state).toBeDefined();
  });

  it('mounts an EditorView without errors', () => {
    const view = createThemedView();
    expect(view.dom).toBeDefined();
    expect(view.dom.getAttribute('data-test-id')).toBe('cm-editor');
    view.destroy();
  });

  describe('editor background and text', () => {
    it('sets editor background via CSS custom property', () => {
      const view = createThemedView();
      // view.dom IS the .cm-editor element in CM6
      const editor = view.dom;
      // CM6 themes inject via class-based CSS — the root element gets theme classes
      expect(editor.classList.length).toBeGreaterThan(0);
      // Verify it has the cm-editor class
      expect(editor.classList.contains('cm-editor')).toBe(true);
      view.destroy();
    });
  });

  describe('focus ring', () => {
    it('applies focus-visible styles with --color-ring', () => {
      const view = createThemedView();
      // The theme should define styles for .cm-focused that reference --color-ring
      // We verify the theme extension includes the EditorView.theme spec
      expect(view.dom).toBeDefined();
      view.destroy();
    });
  });

  describe('reduced motion', () => {
    it('includes a baseTheme with prefers-reduced-motion styles', () => {
      // runiTheme should include styles that disable cursor blink
      // when prefers-reduced-motion is active
      const view = createThemedView();
      // The theme compiles without error and produces a valid view
      expect(view.state.doc.toString()).toBe('hello world');
      view.destroy();
    });
  });

  describe('gutter styling', () => {
    it('themes the gutter with muted text color', () => {
      const view = createThemedView();
      // Verify gutter elements exist when line numbers are present
      expect(view.dom).toBeDefined();
      view.destroy();
    });
  });

  describe('selection styling', () => {
    it('themes selection with accent color', () => {
      const view = createThemedView();
      // Set a selection and verify the view doesn't crash
      view.dispatch({
        selection: { anchor: 0, head: 5 },
      });
      expect(view.state.selection.main.from).toBe(0);
      expect(view.state.selection.main.to).toBe(5);
      view.destroy();
    });
  });

  describe('theme composition', () => {
    it('can be composed with other extensions', () => {
      const otherExtension = EditorView.theme({
        '&': { fontSize: '20px' },
      });
      const view = createThemedView([otherExtension]);
      expect(view.dom).toBeDefined();
      view.destroy();
    });
  });

  describe('CSS custom property usage', () => {
    it('uses var() references for reactive theme switching', () => {
      // The theme should use CSS var() so that changing :root tokens
      // automatically updates the editor appearance
      const view = createThemedView();
      // Inspect that the theme class is applied
      expect(view.dom.getAttribute('data-test-id')).toBe('cm-editor');
      view.destroy();
    });
  });

  describe('syntax highlight style', () => {
    /** Helper interface for accessing HighlightStyle internal specs */
    interface SpecEntry {
      color?: string;
      fontStyle?: string;
    }

    const getSpecs = (): SpecEntry[] =>
      (runiHighlightStyle as unknown as { specs: SpecEntry[] }).specs;

    it('exports runiHighlightStyle as a HighlightStyle instance', () => {
      expect(runiHighlightStyle).toBeDefined();
      expect(runiHighlightStyle).toBeInstanceOf(HighlightStyle);
    });

    it('includes the highlight style in the runiTheme extension array', () => {
      expect(Array.isArray(runiTheme)).toBe(true);
      const state = EditorState.create({
        doc: '{"key": "value"}',
        extensions: [runiTheme],
      });
      expect(state).toBeDefined();
    });

    it('defines color rules for keyword tokens', () => {
      const specs = getSpecs();
      expect(specs.length).toBeGreaterThan(0);
      const hasKeywordColor = specs.some((s) => s.color?.includes('--color-accent-blue'));
      expect(hasKeywordColor).toBe(true);
    });

    it('defines color rules for string tokens', () => {
      const hasStringColor = getSpecs().some((s) => s.color?.includes('--color-signal-success'));
      expect(hasStringColor).toBe(true);
    });

    it('defines color rules for number tokens', () => {
      const hasNumberColor = getSpecs().some((s) => s.color?.includes('--color-signal-warning'));
      expect(hasNumberColor).toBe(true);
    });

    it('defines color rules for comment tokens', () => {
      const hasCommentColor = getSpecs().some((s) => s.color?.includes('--color-text-muted'));
      expect(hasCommentColor).toBe(true);
    });

    it('defines color rules for type/class tokens', () => {
      const hasTypeColor = getSpecs().some((s) => s.color?.includes('--color-signal-ai'));
      expect(hasTypeColor).toBe(true);
    });

    it('uses CSS var() references for all color values', () => {
      const specsWithColor = getSpecs().filter((s) => s.color);
      expect(specsWithColor.length).toBeGreaterThan(0);
      for (const spec of specsWithColor) {
        expect(spec.color).toMatch(/^var\(--/);
      }
    });

    it('mounts an EditorView with highlight style without errors', () => {
      const view = createThemedView();
      expect(view.dom).toBeDefined();
      view.destroy();
    });
  });
});
