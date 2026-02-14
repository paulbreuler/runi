/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CodeEditor component
 * @description Unified code display and editing component with syntax highlighting
 */

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  CaseSensitive,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  XCircle,
} from 'lucide-react';
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
import { Toggle } from '@base-ui/react/toggle';

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
  /** Enable in-editor search UI and shortcuts (edit mode only) */
  enableSearch?: boolean;
  /** Optional ref to the underlying textarea (edit mode only; for find/scroll from parent) */
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  /** Optional range to highlight (edit mode only; drawn via mirror/measure, no focus change) */
  highlightRange?: { start: number; end: number } | null;
  /** Optional ranges to highlight (edit mode only; drawn via overlay, no focus change) */
  highlightRanges?: Array<{ start: number; end: number }> | null;
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

const getMatchRanges = (
  text: string,
  query: string,
  caseSensitive: boolean
): Array<{ start: number; end: number }> => {
  const q = query.trim();
  if (q === '') {
    return [];
  }
  const haystack = caseSensitive ? text : text.toLowerCase();
  const needle = caseSensitive ? q : q.toLowerCase();
  const ranges: Array<{ start: number; end: number }> = [];
  let pos = 0;
  while ((pos = haystack.indexOf(needle, pos)) !== -1) {
    ranges.push({ start: pos, end: pos + needle.length });
    pos += needle.length;
  }
  return ranges;
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
  enableSearch = true,
  textareaRef: textareaRefProp,
  highlightRange,
  highlightRanges,
  className,
}: CodeEditorProps): React.JSX.Element => {
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const highlightOverlayRef = useRef<HTMLDivElement | null>(null);
  const internalTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const textareaRef = textareaRefProp ?? internalTextareaRef;
  const [lineNumberGutterWidth, setLineNumberGutterWidth] = useState<number>(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-detect language if not provided
  const detectedLanguage = useMemo(
    () => language ?? detectSyntaxLanguage({ body: code }),
    [language, code]
  );

  const isJsonBody = useMemo(() => isValidJson(code), [code]);
  const showJsonValidation = mode === 'edit' && enableJsonValidation && code.trim().length > 0;
  const showFormatButton = showJsonValidation && enableJsonFormatting && isJsonBody;
  const searchMatches = useMemo(
    () => getMatchRanges(code, searchTerm, caseSensitive),
    [code, searchTerm, caseSensitive]
  );
  const hasSearchQuery = enableSearch && showSearch && searchTerm.trim().length > 0;
  const activeRanges = useMemo(() => {
    if (hasSearchQuery) {
      return searchMatches;
    }
    if (highlightRanges !== null && highlightRanges !== undefined && highlightRanges.length > 0) {
      return highlightRanges;
    }
    if (highlightRange !== null && highlightRange !== undefined) {
      return [highlightRange];
    }
    return [];
  }, [hasSearchQuery, searchMatches, highlightRanges, highlightRange]);
  const activeCurrentIndex = hasSearchQuery ? currentMatchIndex : 0;
  const normalizedRanges = useMemo(() => {
    const cleaned = activeRanges
      .map((range, index) => ({
        start: range.start,
        end: range.end,
        isCurrent: index === activeCurrentIndex,
      }))
      .filter((range) => range.start >= 0 && range.end > range.start && range.end <= code.length)
      .sort((a, b) => (a.start === b.start ? a.end - b.end : a.start - b.start));

    if (cleaned.length <= 1) {
      return cleaned;
    }

    const merged: Array<{ start: number; end: number; isCurrent: boolean }> = [];
    for (const range of cleaned) {
      const last = merged[merged.length - 1];
      if (last === undefined || range.start >= last.end) {
        merged.push({ ...range });
      } else {
        last.end = Math.max(last.end, range.end);
        last.isCurrent = last.isCurrent || range.isCurrent;
      }
    }
    return merged;
  }, [activeRanges, activeCurrentIndex, code.length]);

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

  useEffect(() => {
    if (!enableSearch) {
      return;
    }
    setCurrentMatchIndex(0);
  }, [searchTerm, caseSensitive, enableSearch]);

  useEffect(() => {
    if (!enableSearch) {
      return;
    }
    if (searchMatches.length === 0 && currentMatchIndex !== 0) {
      setCurrentMatchIndex(0);
    } else if (currentMatchIndex >= searchMatches.length && searchMatches.length > 0) {
      setCurrentMatchIndex(0);
    }
  }, [searchMatches.length, currentMatchIndex, enableSearch]);

  const openSearch = useCallback((): void => {
    if (!enableSearch) {
      return;
    }
    setShowSearch(true);
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }, [enableSearch]);

  const closeSearch = useCallback((): void => {
    if (!enableSearch) {
      return;
    }
    setShowSearch(false);
    setSearchTerm('');
    setCurrentMatchIndex(0);
    textareaRef.current?.focus();
  }, [enableSearch, textareaRef]);

  const goToNextMatch = useCallback((): void => {
    if (searchMatches.length === 0) {
      return;
    }
    setCurrentMatchIndex((prev) => (prev + 1) % searchMatches.length);
  }, [searchMatches.length]);

  const goToPreviousMatch = useCallback((): void => {
    if (searchMatches.length === 0) {
      return;
    }
    setCurrentMatchIndex((prev) => (prev - 1 + searchMatches.length) % searchMatches.length);
  }, [searchMatches.length]);

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
    if (highlightOverlayRef.current !== null) {
      highlightOverlayRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightOverlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (enableSearch && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      openSearch();
      return;
    }
    if (enableSearch && showSearch && e.key === 'Escape') {
      e.preventDefault();
      closeSearch();
      return;
    }
    // Note: Enter for match navigation is handled by the search input's onKeyDown.
    // Don't intercept Enter here - allow normal newline insertion in the textarea.
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (e.shiftKey) {
        // Shift+Tab: un-indent (remove up to 2 spaces from start of current line)
        const lineStart = code.lastIndexOf('\n', start - 1) + 1;
        const lineContent = code.substring(lineStart);
        let spacesToRemove = 0;
        if (lineContent.startsWith('  ')) {
          spacesToRemove = 2;
        } else if (lineContent.startsWith(' ')) {
          spacesToRemove = 1;
        }

        if (spacesToRemove > 0) {
          const newValue =
            code.substring(0, lineStart) + code.substring(lineStart + spacesToRemove);
          onChange?.(newValue);
          setTimeout(() => {
            if (
              textareaRef.current !== null &&
              textareaRef.current === textarea &&
              document.contains(textarea)
            ) {
              const newStart = Math.max(lineStart, start - spacesToRemove);
              const newEnd = Math.max(lineStart, end - spacesToRemove);
              textarea.selectionStart = newStart;
              textarea.selectionEnd = newEnd;
            }
          }, 0);
        }
      } else {
        // Tab: indent (add 2 spaces at cursor)
        const newValue = code.substring(0, start) + '  ' + code.substring(end);
        onChange?.(newValue);
        setTimeout(() => {
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
    }
  };

  const gutterWidth = lineNumberGutterWidth > 0 ? `${String(lineNumberGutterWidth)}px` : '3.5em';

  useEffect(() => {
    if (!hasSearchQuery || textareaRef.current === null) {
      return;
    }
    const match = searchMatches[currentMatchIndex];
    if (match === undefined) {
      return;
    }
    const ta = textareaRef.current;
    const parsedLineHeight = Number.parseInt(getComputedStyle(ta).lineHeight, 10);
    const lineHeight = Number.isNaN(parsedLineHeight) ? 20 : parsedLineHeight;
    const lines = code.slice(0, match.start).split('\n').length;
    ta.scrollTop = Math.max(0, (lines - 2) * lineHeight);
  }, [hasSearchQuery, searchMatches, currentMatchIndex, code, textareaRef]);

  // Debug logs removed after verification.

  const renderHighlightText = (): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    normalizedRanges.forEach((range, index) => {
      if (range.start > lastIndex) {
        parts.push(
          <span key={`text-${String(index)}`} className="text-transparent">
            {code.substring(lastIndex, range.start)}
          </span>
        );
      }
      const isCurrent = range.isCurrent;
      parts.push(
        <mark
          key={`match-${String(index)}`}
          className="text-transparent outline"
          style={{
            backgroundColor: isCurrent
              ? 'var(--color-accent-9, #1d4ed8)'
              : 'var(--color-accent-6, #93c5fd)',
            outlineColor: isCurrent
              ? 'var(--color-accent-10, #1e40af)'
              : 'var(--color-accent-7, #60a5fa)',
            opacity: isCurrent ? 0.4 : 0.28,
            paddingInlineStart: '0',
            paddingInlineEnd: '0',
          }}
          data-test-id="code-editor-highlight"
        >
          {code.substring(range.start, range.end)}
        </mark>
      );
      lastIndex = range.end;
    });
    if (lastIndex < code.length) {
      parts.push(
        <span key="text-end" className="text-transparent">
          {code.substring(lastIndex)}
        </span>
      );
    }
    return parts.length > 0 ? parts : ' ';
  };

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
          <div className="code-editor-wrapper">
            <SyntaxHighlighter
              language={detectedLanguage}
              style={syntaxHighlightTheme}
              customStyle={syntaxHighlightBaseStyle}
              showLineNumbers
              wrapLongLines={false}
              lineNumberStyle={syntaxHighlightLineNumberStyle}
              PreTag="div"
              codeTagProps={{
                style: syntaxHighlightCodeTagStyle,
              }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        </CodeBox>
      </div>
    );
  }

  // Edit mode - editable with overlay technique
  return (
    <div className={cn('h-full min-h-0 flex flex-col', className)} data-test-id="code-editor">
      {enableSearch && showSearch && (
        <div
          className="flex items-center gap-2 p-2 bg-bg-surface border-b border-border-subtle shrink-0"
          data-test-id="code-editor-search"
        >
          <div className="flex items-center flex-1 gap-2 bg-bg-app rounded px-3 py-1.5 border border-border-subtle">
            <Search className="h-3.5 w-3.5 text-fg-muted" aria-hidden />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  closeSearch();
                  return;
                }
                if (e.key === 'Enter' && searchMatches.length > 0) {
                  e.preventDefault();
                  if (e.shiftKey) {
                    goToPreviousMatch();
                  } else {
                    goToNextMatch();
                  }
                }
              }}
              placeholder="Find"
              aria-label="Find in editor"
              className={cn(
                focusRingClasses,
                'flex-1 bg-transparent text-sm outline-none text-text-primary'
              )}
              data-test-id="code-editor-search-input"
            />
            {searchTerm.trim().length > 0 && (
              <span
                className="text-xs text-fg-muted tabular-nums whitespace-nowrap"
                aria-live="polite"
              >
                {searchMatches.length > 0
                  ? `${String(currentMatchIndex + 1)} of ${String(searchMatches.length)}`
                  : 'No results'}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={goToPreviousMatch}
            disabled={searchMatches.length === 0}
            className={cn(
              focusRingClasses,
              'p-1.5 rounded text-fg-muted hover:text-fg-default hover:bg-bg-raised/50',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
            aria-label="Previous match"
            data-test-id="code-editor-search-prev"
          >
            <ChevronUp className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={goToNextMatch}
            disabled={searchMatches.length === 0}
            className={cn(
              focusRingClasses,
              'p-1.5 rounded text-fg-muted hover:text-fg-default hover:bg-bg-raised/50',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
            aria-label="Next match"
            data-test-id="code-editor-search-next"
          >
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          </button>
          <Toggle
            pressed={caseSensitive}
            onPressedChange={setCaseSensitive}
            aria-label="Match case"
            data-test-id="code-editor-search-case"
            render={(props, state) => (
              <button
                type="button"
                {...props}
                className={cn(
                  props.className,
                  focusRingClasses,
                  'inline-flex items-center justify-center size-7 rounded border border-border-subtle',
                  'text-fg-muted bg-bg-raised/50 hover:text-fg-default hover:bg-bg-raised',
                  state.pressed && 'bg-pressed text-pressed-text border-pressed-border'
                )}
              >
                <CaseSensitive className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          />
          <button
            type="button"
            onClick={closeSearch}
            className={cn(
              focusRingClasses,
              'p-1.5 rounded text-fg-muted hover:text-fg-default hover:bg-bg-raised/50'
            )}
            aria-label="Close search"
            data-test-id="code-editor-search-close"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-hidden relative bg-bg-app">
        {/* Syntax highlight layer (non-interactive) */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden
          ref={highlightRef}
          data-test-id="code-editor-syntax-layer"
        >
          <div className="p-4">
            <div data-language={detectedLanguage}>
              <SyntaxHighlighter
                language={detectedLanguage}
                style={syntaxHighlightTheme}
                customStyle={syntaxHighlightBaseStyle}
                showLineNumbers
                wrapLongLines={false}
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

        {/* Search/match highlight overlay (decoration layer; no focus) */}
        {normalizedRanges.length > 0 && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            aria-hidden
            ref={highlightOverlayRef}
            data-test-id="code-editor-highlight-layer"
          >
            <pre
              className="font-mono text-sm leading-relaxed whitespace-pre text-transparent pt-4 pr-4 pb-4"
              style={{ paddingLeft: `calc(1rem + ${gutterWidth})` }}
            >
              {renderHighlightText()}
            </pre>
          </div>
        )}

        {/* Transparent textarea for editing */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleChange}
          onScroll={syncHighlightScroll}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          wrap="off"
          className={cn(
            focusRingClasses,
            'w-full h-full p-4 font-mono text-sm leading-relaxed',
            'bg-transparent text-transparent overflow-auto',
            'border-0 resize-none',
            'placeholder:text-text-muted/50'
          )}
          style={{
            paddingLeft: `calc(1rem + ${gutterWidth})`,
            caretColor: 'var(--color-text-secondary)',
            scrollbarGutter: 'stable both-edges',
          }}
          data-test-id="code-editor-textarea"
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
