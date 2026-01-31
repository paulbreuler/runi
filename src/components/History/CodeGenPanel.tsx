/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CodeGenPanel component
 * @description Panel with language tabs for code generation
 */

import { useState, useMemo } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { cn } from '@/utils/cn';
import { LanguageTabs } from './LanguageTabs';
import { CodeEditor } from '@/components/CodeHighlighting/CodeEditor';
import type { NetworkHistoryEntry } from '@/types/history';
import { generateCode, LANGUAGE_SYNTAX, type CodeLanguage } from '@/utils/codeGenerators';

export interface CodeGenPanelProps {
  /** Network history entry to generate code from */
  entry: NetworkHistoryEntry;
  /** Available languages (defaults to all) */
  languages?: CodeLanguage[];
  /** Additional CSS classes */
  className?: string;
}

const DEFAULT_LANGUAGES: CodeLanguage[] = ['javascript', 'python', 'go', 'ruby', 'curl'];

/**
 * CodeGenPanel component with language tabs for code generation.
 *
 * Displays generated code for the selected language with syntax highlighting.
 * Defaults to JavaScript tab.
 *
 * @example
 * ```tsx
 * <CodeGenPanel entry={networkHistoryEntry} />
 * ```
 */
export const CodeGenPanel = ({
  entry,
  languages = DEFAULT_LANGUAGES,
  className,
}: CodeGenPanelProps): React.ReactElement => {
  const [activeLanguage, setActiveLanguage] = useState<CodeLanguage>(languages[0] ?? 'javascript');

  // Generate code for the active language
  const code = useMemo(() => {
    try {
      return generateCode(entry, activeLanguage);
    } catch (error) {
      console.error(`Failed to generate ${activeLanguage} code:`, error);
      return `// Error generating ${activeLanguage} code`;
    }
  }, [entry, activeLanguage]);

  // LANGUAGE_SYNTAX is a Record, so it always has a value for valid CodeLanguage
  const syntaxLanguage = LANGUAGE_SYNTAX[activeLanguage];

  return (
    <div data-test-id="codegen-panel" className={cn('flex flex-col h-full', className)}>
      {/* Language tabs */}
      <LanguageTabs
        languages={languages}
        activeLanguage={activeLanguage}
        onLanguageChange={setActiveLanguage}
        className="mb-3"
      >
        <Tabs.Panel value={activeLanguage} className="flex-1 flex flex-col min-h-0">
          <CodeEditor mode="display" code={code} language={syntaxLanguage} className="flex-1" />
        </Tabs.Panel>
      </LanguageTabs>
    </div>
  );
};
