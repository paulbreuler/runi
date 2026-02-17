/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file useCodeMirror hook
 * @description Thin React hook that mounts a CodeMirror 6 EditorView into a container ref.
 * Handles creation, content sync, onChange, and cleanup.
 */

import { useEffect, useRef, useState } from 'react';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { minimalSetup } from 'codemirror';

interface UseCodeMirrorOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  code: string;
  onChange?: (value: string) => void;
  /** Dynamically reconfigured when the reference changes. */
  extensions?: Extension[];
  /** Applied once on mount. Changes require remounting the component. */
  readOnly?: boolean;
}

interface UseCodeMirrorReturn {
  view: EditorView | undefined;
}

/**
 * React hook that creates and manages a CodeMirror 6 EditorView.
 *
 * - Mounts EditorView into the container on first render
 * - Syncs external `code` changes via `EditorView.dispatch` (no re-mount)
 * - Fires `onChange` only for user-initiated edits (not external syncs)
 * - Cleans up EditorView on unmount
 */
export const useCodeMirror = ({
  containerRef,
  code,
  onChange,
  extensions = [],
  readOnly = false,
}: UseCodeMirrorOptions): UseCodeMirrorReturn => {
  const [view, setView] = useState<EditorView | undefined>(undefined);
  const viewRef = useRef<EditorView | undefined>(undefined);
  const onChangeRef = useRef(onChange);
  const isSyncingRef = useRef(false);
  const compartmentRef = useRef(new Compartment());

  // Keep onChange ref current without re-creating the view
  onChangeRef.current = onChange;

  // Create EditorView on mount
  useEffect(() => {
    const container = containerRef.current;
    if (container === null) {
      return;
    }

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !isSyncingRef.current) {
        onChangeRef.current?.(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: code,
      extensions: [
        minimalSetup,
        EditorState.readOnly.of(readOnly),
        updateListener,
        compartmentRef.current.of(extensions),
      ],
    });

    const editorView = new EditorView({ state, parent: container });
    viewRef.current = editorView;
    setView(editorView);

    return (): void => {
      editorView.destroy();
      viewRef.current = undefined;
      setView(undefined);
    };
    // Only re-create on mount/unmount and when container changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef]);

  // Reconfigure extensions when they change (e.g. theme switch)
  useEffect(() => {
    const v = viewRef.current;
    if (v === undefined) {
      return;
    }
    v.dispatch({
      effects: compartmentRef.current.reconfigure(extensions),
    });
  }, [extensions]);

  // Sync external code changes
  useEffect(() => {
    const v = viewRef.current;
    if (v === undefined) {
      return;
    }

    const currentDoc = v.state.doc.toString();
    if (currentDoc === code) {
      return;
    }

    isSyncingRef.current = true;
    v.dispatch({
      changes: {
        from: 0,
        to: currentDoc.length,
        insert: code,
      },
    });
    isSyncingRef.current = false;
  }, [code]);

  return { view };
};
