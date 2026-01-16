import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useRequestStore } from '@/stores/useRequestStore';
import { cn } from '@/utils/cn';
import {
  syntaxHighlightBaseStyle,
  syntaxHighlightCodeTagStyle,
  syntaxHighlightLineNumberStyle,
  syntaxHighlightTheme,
} from '@/components/CodeHighlighting/syntaxHighlighting';
import { detectSyntaxLanguage } from '@/components/CodeHighlighting/syntaxLanguage';

/**
 * BodyEditor component for editing HTTP request body.
 */
export const BodyEditor = (): React.JSX.Element => {
  const { body, setBody } = useRequestStore();
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [lineNumberGutterWidth, setLineNumberGutterWidth] = useState<number>(0);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setBody(e.target.value);
  };

  const isJson = (value: string): boolean => {
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

  const language = useMemo(() => detectSyntaxLanguage({ body }), [body]);
  const isJsonBody = useMemo(() => isJson(body), [body]);

  useLayoutEffect(() => {
    if (typeof window === 'undefined' || highlightRef.current === null) {
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
  }, [language, lineNumberGutterWidth]);

  const formatJson = (): void => {
    if (body.trim().length === 0) {
      return;
    }
    try {
      const parsed = JSON.parse(body) as unknown;
      setBody(JSON.stringify(parsed, null, 2));
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

  const gutterWidth = lineNumberGutterWidth > 0 ? `${String(lineNumberGutterWidth)}px` : '3.5em';

  return (
    <div className="h-full flex flex-col" data-testid="body-editor">
      <div className="flex-1 overflow-hidden relative bg-bg-app">
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden
          ref={highlightRef}
          data-testid="body-syntax-layer"
        >
          <div className="p-4">
            <div data-language={language}>
              <SyntaxHighlighter
                language={language}
                style={syntaxHighlightTheme}
                customStyle={syntaxHighlightBaseStyle}
                showLineNumbers
                lineNumberStyle={syntaxHighlightLineNumberStyle}
                PreTag="div"
                codeTagProps={{
                  style: syntaxHighlightCodeTagStyle,
                }}
              >
                {body.length > 0 ? body : ' '}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={body}
          onChange={handleChange}
          onScroll={syncHighlightScroll}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              const start = e.currentTarget.selectionStart;
              const end = e.currentTarget.selectionEnd;
              const newValue = body.substring(0, start) + '  ' + body.substring(end);
              setBody(newValue);
              setTimeout(() => {
                e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
              }, 0);
            }
          }}
          placeholder="Enter request body (JSON, XML, text, etc.)"
          className={cn(
            'w-full h-full p-4 font-mono text-sm leading-relaxed',
            'bg-transparent text-transparent',
            'border-0 outline-none resize-none',
            'focus:outline-none',
            'placeholder:text-text-muted/50'
          )}
          style={{
            paddingLeft: `calc(1rem + ${gutterWidth})`,
            caretColor: 'var(--color-text-secondary)',
          }}
          data-testid="body-textarea"
          spellCheck={false}
        />

        {/* JSON validation indicator */}
        {body.trim().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 right-4 flex items-center gap-2"
          >
            {isJsonBody ? (
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-signal-success/10 text-signal-success text-xs">
                <span className="size-1.5 rounded-full bg-signal-success" />
                Valid JSON
              </div>
            ) : (
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-signal-error/10 text-signal-error text-xs">
                <span className="size-1.5 rounded-full bg-signal-error" />
                Invalid JSON
              </div>
            )}
            {isJsonBody && (
              <button
                onClick={formatJson}
                className="px-2 py-1 text-xs rounded bg-bg-raised text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
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
