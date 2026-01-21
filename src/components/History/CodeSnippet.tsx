/**
 * @file CodeSnippet component
 * @description Displays code with syntax highlighting and copy functionality
 */

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { CopyButton } from './CopyButton';
import {
  syntaxHighlightBaseStyle,
  syntaxHighlightCodeTagStyle,
  syntaxHighlightLineNumberStyle,
  syntaxHighlightTheme,
} from '@/components/CodeHighlighting/syntaxHighlighting';
import { cn } from '@/utils/cn';

export interface CodeSnippetProps {
  /** Code content to display */
  code: string;
  /** Language for syntax highlighting */
  language: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * CodeSnippet component for displaying code with syntax highlighting.
 *
 * Includes copy button and proper formatting for code display.
 *
 * @example
 * ```tsx
 * <CodeSnippet code="const x = 1;" language="javascript" />
 * ```
 */
export const CodeSnippet = ({ code, language, className }: CodeSnippetProps): React.JSX.Element => {
  return (
    <div data-testid="code-snippet" className={cn('flex flex-col', className)}>
      {/* Header with copy button */}
      <div className="flex items-center justify-end mb-1">
        <CopyButton text={code} aria-label={`Copy ${language} code`} />
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto" style={{ scrollbarGutter: 'stable' }}>
        <div className="pt-1 px-4 pb-4" data-language={language}>
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
        </div>
      </div>
    </div>
  );
};
