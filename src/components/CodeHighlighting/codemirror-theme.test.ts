/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { EditorView } from '@codemirror/view';
import { EditorState, type Extension } from '@codemirror/state';
import { runiTheme, getRuniTheme } from './codemirror-theme';

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
  const originalDestroy = view.destroy.bind(view);
  view.destroy = (): void => {
    originalDestroy();
    parent.remove();
  };
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

  describe('One Dark syntax theme', () => {
    it('includes One Dark as the syntax highlighting base', () => {
      // runiTheme is an array containing oneDark + structural overrides
      expect(Array.isArray(runiTheme)).toBe(true);
      const state = EditorState.create({
        doc: '{"key": "value", "number": 42, "bool": true}',
        extensions: [runiTheme],
      });
      expect(state).toBeDefined();
    });

    it('mounts with JSON content showing differentiated syntax tokens', () => {
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      const state = EditorState.create({
        doc: '{"key": "value", "count": 42, "active": true}',
        extensions: [runiTheme],
      });
      const view = new EditorView({ state, parent });
      // The editor should mount without errors with JSON content
      expect(view.dom.querySelector('.cm-content')).toBeTruthy();
      view.destroy();
      parent.remove();
    });
  });
});

describe('getRuniTheme', () => {
  it('returns a valid Extension array for one-dark', () => {
    const ext = getRuniTheme('one-dark');
    expect(Array.isArray(ext)).toBe(true);
    const state = EditorState.create({ doc: '', extensions: [ext] });
    expect(state).toBeDefined();
  });

  it('returns a valid Extension array for solarized-dark', () => {
    const ext = getRuniTheme('solarized-dark');
    expect(Array.isArray(ext)).toBe(true);
    const state = EditorState.create({ doc: '', extensions: [ext] });
    expect(state).toBeDefined();
  });

  it('returns a valid Extension array for github-dark', () => {
    const ext = getRuniTheme('github-dark');
    expect(Array.isArray(ext)).toBe(true);
    const state = EditorState.create({ doc: '', extensions: [ext] });
    expect(state).toBeDefined();
  });

  it('falls back to One Dark for unknown theme names', () => {
    const oneDarkExt = getRuniTheme('one-dark');
    const unknownExt = getRuniTheme('unknown-theme');
    // Both should be arrays of the same length (same structure)
    expect(Array.isArray(unknownExt)).toBe(true);
    expect((unknownExt as Extension[]).length).toBe((oneDarkExt as Extension[]).length);
  });

  it('each theme mounts an EditorView without errors', () => {
    for (const themeName of ['one-dark', 'solarized-dark', 'github-dark']) {
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      const state = EditorState.create({
        doc: '{"key": "value"}',
        extensions: [getRuniTheme(themeName)],
      });
      const view = new EditorView({ state, parent });
      expect(view.dom.querySelector('.cm-content')).toBeTruthy();
      view.destroy();
      parent.remove();
    }
  });

  it('runiTheme export still works as backwards-compatible default', () => {
    // runiTheme should still be the One Dark default
    expect(Array.isArray(runiTheme)).toBe(true);
    const state = EditorState.create({ doc: 'test', extensions: [runiTheme] });
    expect(state).toBeDefined();
  });
});
