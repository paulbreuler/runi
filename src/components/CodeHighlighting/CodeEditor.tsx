/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CodeEditor component
 * @description Unified code display and editing component powered by CodeMirror 6.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import type { Extension } from '@codemirror/state';
import { EditorView, keymap, placeholder as cmPlaceholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { search, searchKeymap } from '@codemirror/search';
import { CodeBox } from '@/components/History/CodeBox';
import { detectSyntaxLanguage } from '@/components/CodeHighlighting/syntaxLanguage';
import { useCodeMirror } from '@/components/CodeHighlighting/useCodeMirror';
import { runiTheme } from '@/components/CodeHighlighting/codemirror-theme';
import { getLanguageExtension } from '@/components/CodeHighlighting/codemirror-languages';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';

export interface CodeEditorProps {
  /** Display mode shows read-only code, edit mode allows editing */
  mode: 'display' | 'edit';
  /** Code content to display or edit */
  code: string;
  /** Callback when code changes (edit mode only) */
  onChange?: (value: string) => void;
  /** Language for syntax highlighting (auto-detected if not provided) */
  language?: string;
  /** Visual variant: 'contained' for standalone use, 'borderless' for use inside containers */
  variant?: 'contained' | 'borderless';
  /** Placeholder text when code is empty (edit mode only) */
  placeholder?: string;
  /** Enable JSON validation indicator (edit mode only) */
  enableJsonValidation?: boolean;
  /** Enable JSON format button (edit mode only) */
  enableJsonFormatting?: boolean;
  /** Enable in-editor search via Cmd+F (edit mode only) */
  enableSearch?: boolean;
  /** Optional ref to the underlying EditorView (edit mode only) */
  editorRef?: React.RefObject<EditorView | null>;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for the editor */
  'aria-label'?: string;
}

const isValidJson = (value: string): boolean => {
  if (value.trim().length === 0) {
    return false;
  }
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * CodeEditor component for displaying and editing code with syntax highlighting.
 *
 * Unifies CodeSnippet (display) and BodyEditor (edit) into a single component.
 * - Display mode: Read-only with copy button (uses CodeBox)
 * - Edit mode: Full CodeMirror 6 editor with indent, undo/redo, bracket matching, search
 *
 * @example
 * ```tsx
 * // Display mode (read-only)
 * <CodeEditor mode="display" code="const x = 1;" language="javascript" />
 *
 * // Edit mode (editable)
 * <CodeEditor
 *   mode="edit"
 *   code={body}
 *   onChange={setBody}
 *   enableJsonValidation
 *   enableJsonFormatting
 *   placeholder="Enter request body..."
 * />
 * ```
 */
export const CodeEditor = ({
  mode,
  code,
  onChange,
  language,
  variant = 'contained',
  placeholder,
  enableJsonValidation = false,
  enableJsonFormatting = false,
  enableSearch = true,
  editorRef: editorRefProp,
  className,
  'aria-label': ariaLabel,
}: CodeEditorProps): React.JSX.Element => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [jsonValid, setJsonValid] = useState<boolean | null>(null);

  // Auto-detect language if not provided
  const detectedLanguage = useMemo(
    () => language ?? detectSyntaxLanguage({ body: code }),
    [language, code]
  );

  // Build CM6 extensions
  const extensions = useMemo((): Extension[] => {
    const exts: Extension[] = [runiTheme];

    // Language support
    const langExt = getLanguageExtension(detectedLanguage);
    if (langExt !== null) {
      exts.push(...langExt);
    }

    // Keymaps
    exts.push(keymap.of(defaultKeymap));
    exts.push(keymap.of(historyKeymap));
    exts.push(history());

    if (mode === 'edit') {
      exts.push(keymap.of([indentWithTab]));
    }

    // Search
    if (enableSearch && mode === 'edit') {
      exts.push(search());
      exts.push(keymap.of(searchKeymap));
    }

    // Placeholder (edit mode only)
    if (mode === 'edit' && placeholder !== undefined && placeholder !== '') {
      exts.push(cmPlaceholder(placeholder));
    }

    // Test selectors on CM6 internal elements
    exts.push(EditorView.editorAttributes.of({ 'data-test-id': 'cm-editor' }));

    // Aria label and test selector via EditorView.contentAttributes
    const contentAttrs: Record<string, string> = { 'data-test-id': 'cm-content' };
    if (ariaLabel !== undefined) {
      contentAttrs['aria-label'] = ariaLabel;
    }
    exts.push(EditorView.contentAttributes.of(contentAttrs));

    // Line wrapping off (horizontal scroll)
    // EditorView default is no wrap, which is what we want

    return exts;
  }, [detectedLanguage, mode, enableSearch, placeholder, ariaLabel]);

  const { view } = useCodeMirror({
    containerRef,
    code,
    onChange: mode === 'edit' ? onChange : undefined,
    extensions,
    readOnly: mode === 'display',
  });

  // Expose EditorView via editorRef
  useEffect(() => {
    if (editorRefProp === undefined) {
      return;
    }
    editorRefProp.current = view ?? null;
    return (): void => {
      editorRefProp.current = null;
    };
  }, [view, editorRefProp]);

  // Debounced JSON validation
  useEffect(() => {
    if (!enableJsonValidation || mode !== 'edit') {
      setJsonValid(null);
      return;
    }
    if (code.trim().length === 0) {
      setJsonValid(null);
      return;
    }
    const timer = setTimeout(() => {
      setJsonValid(isValidJson(code));
    }, 300);
    return (): void => {
      clearTimeout(timer);
    };
  }, [code, enableJsonValidation, mode]);

  const showJsonValidation = mode === 'edit' && enableJsonValidation && jsonValid !== null;
  const showFormatButton = showJsonValidation && enableJsonFormatting && jsonValid;

  const formatJson = useCallback((): void => {
    if (code.trim().length === 0 || onChange === undefined) {
      return;
    }
    try {
      const parsed = JSON.parse(code) as unknown;
      onChange(JSON.stringify(parsed, null, 2));
    } catch {
      // Invalid JSON, do nothing
    }
  }, [code, onChange]);

  // Display mode - read-only with copy button via CodeBox
  if (mode === 'display') {
    return (
      <div data-test-id="code-editor" className={cn('flex flex-col min-h-0', className)}>
        <CodeBox
          copyText={code}
          copyButtonLabel={`Copy ${detectedLanguage} code`}
          variant={variant}
          containerClassName="flex-1"
          data-language={detectedLanguage}
        >
          <div
            ref={containerRef}
            className="code-editor-wrapper"
            data-test-id="code-editor-cm-container"
            data-language={detectedLanguage}
          />
        </CodeBox>
      </div>
    );
  }

  // Edit mode - CodeMirror 6
  return (
    <div
      className={cn(
        'h-full min-h-0 flex flex-col',
        variant === 'contained' && 'bg-bg-raised border border-border-default rounded-md',
        className
      )}
      data-test-id="code-editor"
    >
      <div className="flex-1 overflow-hidden relative bg-bg-app">
        <div
          ref={containerRef}
          className="h-full w-full"
          data-test-id="code-editor-cm-container"
          data-language={detectedLanguage}
        />

        {/* JSON validation indicator */}
        {showJsonValidation && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 right-4 flex items-center gap-2"
          >
            {jsonValid ? (
              <div
                className="flex items-center gap-2 px-2 py-1 rounded bg-signal-success/10 text-signal-success text-xs"
                data-test-id="json-valid-indicator"
              >
                <CheckCircle size={12} />
                Valid JSON
              </div>
            ) : (
              <div
                className="flex items-center gap-2 px-2 py-1 rounded bg-signal-error/10 text-signal-error text-xs"
                data-test-id="json-invalid-indicator"
              >
                <XCircle size={12} />
                Invalid JSON
              </div>
            )}
            {showFormatButton && (
              <button
                onClick={formatJson}
                className={cn(
                  focusRingClasses,
                  'px-2 py-1 text-xs rounded bg-bg-raised text-text-secondary hover:text-text-primary hover:border-border-emphasis transition-colors border border-transparent'
                )}
                data-test-id="format-json-button"
              >
                Format
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
