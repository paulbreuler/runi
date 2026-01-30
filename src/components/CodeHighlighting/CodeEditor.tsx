/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CodeEditor component
 * @description Unified code display and editing component with syntax highlighting
 */

import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { CodeBox } from '@/components/History/CodeBox';
import { detectSyntaxLanguage } from '@/components/CodeHighlighting/syntaxLanguage';
import {
  syntaxHighlightBaseStyle,
  syntaxHighlightCodeTagStyle,
  syntaxHighlightLineNumberStyle,
  syntaxHighlightTheme,
} from '@/components/CodeHighlighting/syntaxHighlighting';
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
  /** Additional CSS classes */
  className?: string;
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
 * - Display mode: Read-only with copy button
 * - Edit mode: Transparent textarea over syntax highlight layer with optional JSON validation
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
  className,
}: CodeEditorProps): React.JSX.Element => {
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [lineNumberGutterWidth, setLineNumberGutterWidth] = useState<number>(0);

  // Auto-detect language if not provided
  const detectedLanguage = useMemo(
    () => language ?? detectSyntaxLanguage({ body: code }),
    [language, code]
  );

  const isJsonBody = useMemo(() => isValidJson(code), [code]);
  const showJsonValidation = mode === 'edit' && enableJsonValidation && code.trim().length > 0;
  const showFormatButton = showJsonValidation && enableJsonFormatting && isJsonBody;

  // Calculate gutter width for edit mode
  useLayoutEffect(() => {
    if (mode !== 'edit' || typeof window === 'undefined' || highlightRef.current === null) {
      return;
    }

    const lineNumber = highlightRef.current.querySelector<HTMLElement>(
      '.react-syntax-highlighter-line-number'
    );

    if (lineNumber === null) {
      return;
    }

    const updateGutterWidth = (): void => {
      const width = Math.ceil(lineNumber.getBoundingClientRect().width);
      if (width > 0 && width !== lineNumberGutterWidth) {
        setLineNumberGutterWidth(width);
      }
    };

    updateGutterWidth();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(updateGutterWidth);
    observer.observe(lineNumber);

    return (): void => {
      observer.disconnect();
    };
  }, [mode, detectedLanguage, lineNumberGutterWidth]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    onChange?.(e.target.value);
  };

  const formatJson = (): void => {
    if (code.trim().length === 0 || onChange === undefined) {
      return;
    }
    try {
      const parsed = JSON.parse(code) as unknown;
      onChange(JSON.stringify(parsed, null, 2));
    } catch {
      // Invalid JSON, do nothing
    }
  };

  const syncHighlightScroll = (): void => {
    if (highlightRef.current === null || textareaRef.current === null) {
      return;
    }
    highlightRef.current.scrollTop = textareaRef.current.scrollTop;
    highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = code.substring(0, start) + '  ' + code.substring(end);
      onChange?.(newValue);
      setTimeout(() => {
        // Check if textarea still exists and is mounted before setting selection
        if (
          textareaRef.current !== null &&
          textareaRef.current === textarea &&
          document.contains(textarea)
        ) {
          textarea.selectionStart = start + 2;
          textarea.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const gutterWidth = lineNumberGutterWidth > 0 ? `${String(lineNumberGutterWidth)}px` : '3.5em';

  // Display mode - read-only with copy button via CodeBox
  if (mode === 'display') {
    return (
      <div data-testid="code-editor" className={cn('flex flex-col', className)}>
        <CodeBox
          copyText={code}
          copyButtonLabel={`Copy ${detectedLanguage} code`}
          variant={variant}
          containerClassName="flex-1"
          data-language={detectedLanguage}
        >
          <div className="overflow-x-auto" style={{ scrollbarGutter: 'stable' }}>
            <div className="code-editor-wrapper">
              <SyntaxHighlighter
                language={detectedLanguage}
                style={syntaxHighlightTheme}
                customStyle={syntaxHighlightBaseStyle}
                showLineNumbers
                lineNumberStyle={syntaxHighlightLineNumberStyle}
                PreTag="div"
                codeTagProps={{
                  style: syntaxHighlightCodeTagStyle,
                }}
              >
                {code}
              </SyntaxHighlighter>
            </div>
          </div>
        </CodeBox>
      </div>
    );
  }

  // Edit mode - editable with overlay technique
  return (
    <div className={cn('h-full flex flex-col', className)} data-testid="code-editor">
      <div className="flex-1 overflow-hidden relative bg-bg-app">
        {/* Syntax highlight layer (non-interactive) */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden
          ref={highlightRef}
          data-testid="code-editor-syntax-layer"
        >
          <div className="p-4">
            <div data-language={detectedLanguage}>
              <SyntaxHighlighter
                language={detectedLanguage}
                style={syntaxHighlightTheme}
                customStyle={syntaxHighlightBaseStyle}
                showLineNumbers
                lineNumberStyle={syntaxHighlightLineNumberStyle}
                PreTag="div"
                codeTagProps={{
                  style: syntaxHighlightCodeTagStyle,
                }}
              >
                {code.length > 0 ? code : ' '}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>

        {/* Transparent textarea for editing */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleChange}
          onScroll={syncHighlightScroll}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            focusRingClasses,
            'w-full h-full p-4 font-mono text-sm leading-relaxed',
            'bg-transparent text-transparent',
            'border-0 resize-none',
            'placeholder:text-text-muted/50'
          )}
          style={{
            paddingLeft: `calc(1rem + ${gutterWidth})`,
            caretColor: 'var(--color-text-secondary)',
          }}
          data-testid="code-editor-textarea"
          spellCheck={false}
        />

        {/* JSON validation indicator */}
        {showJsonValidation && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 right-4 flex items-center gap-2"
          >
            {isJsonBody ? (
              <div
                className="flex items-center gap-2 px-2 py-1 rounded bg-signal-success/10 text-signal-success text-xs"
                data-testid="json-valid-indicator"
              >
                <span className="size-1.5 rounded-full bg-signal-success" />
                Valid JSON
              </div>
            ) : (
              <div
                className="flex items-center gap-2 px-2 py-1 rounded bg-signal-error/10 text-signal-error text-xs"
                data-testid="json-invalid-indicator"
              >
                <span className="size-1.5 rounded-full bg-signal-error" />
                Invalid JSON
              </div>
            )}
            {showFormatButton && (
              <button
                onClick={formatJson}
                className="px-2 py-1 text-xs rounded bg-bg-raised text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                data-testid="format-json-button"
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
