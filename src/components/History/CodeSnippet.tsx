/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CodeSnippet component
 * @description Displays code with syntax highlighting and copy functionality
 */

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  syntaxHighlightBaseStyle,
  syntaxHighlightCodeTagStyle,
  syntaxHighlightLineNumberStyle,
  syntaxHighlightTheme,
} from '@/components/CodeHighlighting/syntaxHighlighting';
import { cn } from '@/utils/cn';
import { CodeBox } from './CodeBox';

export interface CodeSnippetProps {
  /** Code content to display */
  code: string;
  /** Language for syntax highlighting */
  language: string;
  /** Visual variant: 'contained' for standalone use with border/background, 'borderless' for use inside existing containers */
  variant?: 'contained' | 'borderless';
  /** Additional CSS classes */
  className?: string;
}

/**
 * CodeSnippet component for displaying code with syntax highlighting.
 *
 * Includes copy button and proper formatting for code display.
 * Supports both contained (default) and borderless variants via CodeBox.
 *
 * @example
 * ```tsx
 * // Contained variant (default) - for standalone use
 * <CodeSnippet code="const x = 1;" language="javascript" />
 *
 * // Borderless variant - for use inside containers
 * <CodeSnippet code="const x = 1;" language="javascript" variant="borderless" />
 * ```
 */
export const CodeSnippet = ({
  code,
  language,
  variant = 'contained',
  className,
}: CodeSnippetProps): React.JSX.Element => {
  return (
    <div data-testid="code-snippet" className={cn('flex flex-col', className)}>
      <CodeBox
        copyText={code}
        copyButtonLabel={`Copy ${language} code`}
        variant={variant}
        containerClassName="flex-1"
        data-language={language}
      >
        {/* Syntax highlighted code */}
        <div className="overflow-x-auto" style={{ scrollbarGutter: 'stable' }}>
          <div className="code-snippet-wrapper">
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
              {code}
            </SyntaxHighlighter>
          </div>
        </div>
      </CodeBox>
    </div>
  );
};
