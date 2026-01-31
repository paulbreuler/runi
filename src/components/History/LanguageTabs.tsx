/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file LanguageTabs component
 * @description Tab navigation for switching between code generation languages
 */

import { Tabs } from '@base-ui/react/tabs';
import { cn } from '@/utils/cn';
import { LANGUAGE_NAMES, type CodeLanguage } from '@/utils/codeGenerators';
import { BaseTabsList } from '@/components/ui/BaseTabsList';

export interface LanguageTabsProps {
  /** Available languages */
  languages: CodeLanguage[];
  /** Currently active language */
  activeLanguage: CodeLanguage;
  /** Callback when language changes */
  onLanguageChange: (language: CodeLanguage) => void;
  /** Additional CSS classes */
  className?: string;
  /** Optional tab panels */
  children?: React.ReactNode;
}

/**
 * LanguageTabs component for switching between code generation languages.
 *
 * Provides keyboard navigation and accessibility support.
 *
 * @example
 * ```tsx
 * <LanguageTabs
 *   languages={['javascript', 'python', 'go']}
 *   activeLanguage="javascript"
 *   onLanguageChange={setLanguage}
 * />
 * ```
 */
export const LanguageTabs = ({
  languages,
  activeLanguage,
  onLanguageChange,
  className,
  children,
}: LanguageTabsProps): React.ReactElement => {
  return (
    <Tabs.Root value={activeLanguage} onValueChange={onLanguageChange as (value: string) => void}>
      <BaseTabsList
        activeTab={activeLanguage}
        onTabChange={onLanguageChange}
        tabs={languages.map((language) => ({
          value: language,
          label: LANGUAGE_NAMES[language],
          testId: `language-tab-${language}`,
        }))}
        listClassName={cn('flex gap-1 border-b border-border-default', className)}
        tabClassName="px-3 py-1.5 text-xs rounded-t flex items-center gap-1.5 relative"
        activeTabClassName="text-text-primary"
        inactiveTabClassName="text-text-secondary hover:text-text-primary hover:bg-bg-raised/50"
        indicatorLayoutId="language-tabs-indicator"
        indicatorClassName="bg-bg-raised rounded-t"
        indicatorTestId="language-tabs-indicator"
        listTestId="language-tabs"
        listAriaLabel="Code generation languages"
        activateOnFocus={false}
      />
      {children}
    </Tabs.Root>
  );
};
