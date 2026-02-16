/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file useCodeMirror hook tests
 * @description Tests for the foundational CodeMirror 6 hook: mount, content sync, onChange, cleanup
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EditorView } from '@codemirror/view';
import { useCodeMirror } from './useCodeMirror';

describe('useCodeMirror', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('creates an EditorView in the container on mount', () => {
    const ref = { current: container };

    const { result } = renderHook(() => useCodeMirror({ containerRef: ref, code: 'hello' }));

    expect(result.current.view).toBeInstanceOf(EditorView);
    expect(container.querySelector('.cm-editor')).not.toBeNull();
  });

  it('sets initial content from code prop', () => {
    const ref = { current: container };

    const { result } = renderHook(() => useCodeMirror({ containerRef: ref, code: 'const x = 1;' }));

    expect(result.current.view?.state.doc.toString()).toBe('const x = 1;');
  });

  it('syncs external code changes via dispatch (not re-mount)', () => {
    const ref = { current: container };
    let code = 'initial';

    const { result, rerender } = renderHook(
      ({ code: c }) => useCodeMirror({ containerRef: ref, code: c }),
      { initialProps: { code } }
    );

    const viewBefore = result.current.view;

    code = 'updated';
    rerender({ code });

    // Same EditorView instance — not re-mounted
    expect(result.current.view).toBe(viewBefore);
    expect(result.current.view?.state.doc.toString()).toBe('updated');
  });

  it('fires onChange via updateListener when user edits', () => {
    const ref = { current: container };
    const onChange = vi.fn();

    const { result } = renderHook(() => useCodeMirror({ containerRef: ref, code: '', onChange }));

    const view = result.current.view!;

    // Simulate a user typing by dispatching a transaction
    act(() => {
      view.dispatch({
        changes: { from: 0, insert: 'typed' },
      });
    });

    expect(onChange).toHaveBeenCalledWith('typed');
  });

  it('does not fire onChange when code prop changes externally', () => {
    const ref = { current: container };
    const onChange = vi.fn();

    const { rerender } = renderHook(
      ({ code }) => useCodeMirror({ containerRef: ref, code, onChange }),
      { initialProps: { code: 'initial' } }
    );

    rerender({ code: 'external update' });

    // onChange should NOT fire for external prop changes
    expect(onChange).not.toHaveBeenCalled();
  });

  it('applies readOnly state', () => {
    const ref = { current: container };

    const { result } = renderHook(() =>
      useCodeMirror({ containerRef: ref, code: 'readonly', readOnly: true })
    );

    expect(result.current.view?.state.readOnly).toBe(true);
  });

  it('accepts custom extensions', () => {
    const ref = { current: container };

    // Just verify it doesn't throw with extensions
    const { result } = renderHook(() =>
      useCodeMirror({
        containerRef: ref,
        code: 'test',
        extensions: [],
      })
    );

    expect(result.current.view).toBeInstanceOf(EditorView);
  });

  it('cleans up EditorView on unmount', () => {
    const ref = { current: container };

    const { result, unmount } = renderHook(() =>
      useCodeMirror({ containerRef: ref, code: 'cleanup test' })
    );

    const view = result.current.view!;
    const destroySpy = vi.spyOn(view, 'destroy');

    unmount();

    expect(destroySpy).toHaveBeenCalled();
  });

  it('handles null container ref gracefully', () => {
    const ref = { current: null };

    const { result } = renderHook(() => useCodeMirror({ containerRef: ref, code: 'no container' }));

    expect(result.current.view).toBeUndefined();
  });
});
