/**
 * @file LanguageTabs component
 * @description Tab navigation for switching between code generation languages
 */

import { useCallback } from 'react';
import { cn } from '@/utils/cn';
import { LANGUAGE_NAMES, type CodeLanguage } from '@/utils/codeGenerators';

export interface LanguageTabsProps {
  /** Available languages */
  languages: CodeLanguage[];
  /** Currently active language */
  activeLanguage: CodeLanguage;
  /** Callback when language changes */
  onLanguageChange: (language: CodeLanguage) => void;
  /** Additional CSS classes */
  className?: string;
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
}: LanguageTabsProps): React.ReactElement => {
  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent, language: CodeLanguage): void => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onLanguageChange(language);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const currentIndex = languages.indexOf(language);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : languages.length - 1;
        const prevLanguage = languages[prevIndex];
        if (prevLanguage !== undefined) {
          onLanguageChange(prevLanguage);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const currentIndex = languages.indexOf(language);
        const nextIndex = currentIndex < languages.length - 1 ? currentIndex + 1 : 0;
        const nextLanguage = languages[nextIndex];
        if (nextLanguage !== undefined) {
          onLanguageChange(nextLanguage);
        }
      }
    },
    [languages, onLanguageChange]
  );

  return (
    <div
      data-testid="language-tabs"
      className={cn('flex gap-1 border-b border-border-default', className)}
      role="tablist"
      aria-label="Code generation languages"
    >
      {languages.map((language) => {
        const isActive = language === activeLanguage;
        return (
          <button
            key={language}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`code-panel-${language}`}
            id={`language-tab-${language}`}
            onClick={(): void => {
              onLanguageChange(language);
            }}
            onKeyDown={(e): void => {
              handleTabKeyDown(e, language);
            }}
            className={cn(
              'px-3 py-1.5 text-xs font-medium transition-colors',
              'border-b-2 -mb-px',
              isActive
                ? 'text-text-primary border-accent-purple'
                : 'text-text-secondary border-transparent hover:text-text-primary'
            )}
          >
            {LANGUAGE_NAMES[language]}
          </button>
        );
      })}
    </div>
  );
};
