/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { ReactElement } from 'react';
import { useEffect, useRef } from 'react';
import { CaseSensitive, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface SettingsSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  /** When true, search applies only to JSON content below; show prev/next match arrows */
  jsonMode?: boolean;
  /** 0-based index of current match (for JSON find-in-page) */
  currentMatchIndex?: number;
  /** Go to previous match (only in jsonMode when resultCount > 0) */
  onPrevMatch?: () => void;
  /** Go to next match (only in jsonMode when resultCount > 0) */
  onNextMatch?: () => void;
  /** Whether search is case-sensitive */
  caseSensitive?: boolean;
  /** Toggle case-sensitive search */
  onCaseSensitiveChange?: (next: boolean) => void;
  placeholder?: string;
  className?: string;
  /** Optional id for aria */
  id?: string;
}

/**
 * Search input for settings. ⌘F to focus; Escape to clear and blur.
 * Shows result count when query is non-empty.
 */
export function SettingsSearchBar({
  value,
  onChange,
  resultCount,
  jsonMode = false,
  currentMatchIndex = 0,
  onPrevMatch,
  onNextMatch,
  caseSensitive = false,
  onCaseSensitiveChange,
  placeholder,
  className,
  id = 'settings-search',
}: SettingsSearchBarProps): ReactElement {
  const resolvedPlaceholder =
    placeholder ?? (jsonMode ? 'Search JSON below (⌘F)' : 'Search settings (⌘F)');
  const inputRef = useRef<HTMLInputElement>(null);
  const hasResults = resultCount > 0;
  const showResults = value.length > 0;
  const jsonMatchLabel = hasResults
    ? `${String(currentMatchIndex + 1)}/${String(resultCount)}`
    : 'No results';
  const settingsMatchLabel = hasResults
    ? `${String(resultCount)} ${resultCount === 1 ? 'match' : 'matches'}`
    : 'No results';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        onChange('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return (): void => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onChange]);

  return (
    <div className={cn('relative', className)}>
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-muted pointer-events-none z-10"
        aria-hidden
      />
      <Input
        ref={inputRef}
        id={id}
        type="search"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onChange('');
            inputRef.current?.blur();
          }
          if (event.key === 'Enter' && jsonMode && resultCount > 0) {
            event.preventDefault();
            if (event.shiftKey) {
              onPrevMatch?.();
            } else {
              onNextMatch?.();
            }
          }
        }}
        placeholder={resolvedPlaceholder}
        aria-label={jsonMode ? 'Search JSON' : 'Search settings'}
        className={cn(
          'w-full pl-9 pr-24',
          value.length > 0 && 'pr-36',
          /* Hide native search clear circle so only our custom clear + match count show */
          '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-cancel-button]:[-webkit-appearance:none]'
        )}
        data-test-id="settings-search-input"
        noScale
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {showResults && (
          <>
            {jsonMode ? (
              <>
                <span className="text-[10px] text-fg-muted tabular-nums" aria-live="polite">
                  {jsonMatchLabel}
                </span>
                {hasResults && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={onPrevMatch}
                      aria-label="Previous match"
                      data-test-id="settings-search-prev"
                      className="text-fg-muted hover:text-fg-default"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={onNextMatch}
                      aria-label="Next match"
                      data-test-id="settings-search-next"
                      className="text-fg-muted hover:text-fg-default"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </>
            ) : (
              <span className="text-[10px] text-fg-muted" aria-live="polite">
                {settingsMatchLabel}
              </span>
            )}
          </>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => {
            onCaseSensitiveChange?.(!caseSensitive);
          }}
          aria-label="Match case"
          data-test-id="settings-search-case"
          disabled={onCaseSensitiveChange === undefined}
          className={cn('text-fg-muted hover:text-fg-default', caseSensitive && 'text-accent-11')}
        >
          <CaseSensitive className="h-3 w-3" />
        </Button>
        {value.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              onChange('');
            }}
            aria-label="Clear search"
            data-test-id="settings-search-clear"
            className="text-fg-muted hover:text-fg-default"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
