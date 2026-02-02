/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { ReactElement } from 'react';
import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';

export interface SettingsSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
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
  placeholder = 'Search settings (⌘F)',
  className,
  id = 'settings-search',
}: SettingsSearchBarProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);

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
        className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-muted"
        aria-hidden
      />
      <input
        ref={inputRef}
        id={id}
        type="search"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        aria-label="Search settings"
        className={cn(
          focusRingClasses,
          'w-full bg-bg-raised border border-border-subtle rounded-lg pl-9 pr-16 py-2 text-sm text-fg-default',
          'placeholder:text-fg-muted focus:border-accent-6'
        )}
        data-test-id="settings-search-input"
      />
      {value.length > 0 && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <span className="text-[10px] text-fg-muted" aria-live="polite">
            {resultCount} {resultCount === 1 ? 'match' : 'matches'}
          </span>
          <button
            type="button"
            onClick={() => {
              onChange('');
            }}
            className="text-fg-muted hover:text-fg-default transition-colors p-0.5 rounded"
            aria-label="Clear search"
            data-test-id="settings-search-clear"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
