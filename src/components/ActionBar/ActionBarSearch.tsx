/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useState, useRef } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useOptionalActionBarContext, type ActionBarVariant } from './ActionBarContext';

interface ActionBarSearchProps {
  /** Current search value */
  value: string;
  /** Callback when search value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** ARIA label for the search input (required for accessibility) */
  'aria-label': string;
  /**
   * Allow search to expand on focus (in icon mode).
   * When true, the input starts collapsed and expands when focused.
   */
  expandable?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Override the variant from context */
  variant?: ActionBarVariant;
}

/**
 * ActionBarSearch - Compact search input with icon.
 *
 * Automatically responds to ActionBar's responsive variant context.
 * In icon mode with `expandable`, the input collapses to just an icon
 * and expands on focus.
 *
 * @example
 * ```tsx
 * <ActionBarSearch
 *   value={search}
 *   onChange={setSearch}
 *   placeholder="Filter by URL..."
 *   aria-label="Filter history by URL"
 * />
 * ```
 */
export const ActionBarSearch = ({
  value,
  onChange,
  placeholder = 'Search...',
  'aria-label': ariaLabel,
  expandable = false,
  className,
  variant: variantOverride,
}: ActionBarSearchProps): React.JSX.Element => {
  const context = useOptionalActionBarContext();
  const variant = variantOverride ?? context?.variant ?? 'full';
  const isIconMode = variant === 'icon';
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // In icon mode with expandable, show collapsed state when not focused and empty
  const isCollapsed = isIconMode && expandable && !isFocused && value === '';

  const handleIconClick = (): void => {
    if (isCollapsed) {
      setIsFocused(true);
      // Focus the input after state update
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={handleIconClick}
        className={cn(
          'flex items-center justify-center size-7 rounded border border-border-subtle text-text-muted hover:text-text-primary hover:bg-bg-raised/50 transition-colors',
          className
        )}
        aria-label={ariaLabel}
        title={placeholder}
      >
        <Search size={14} />
      </button>
    );
  }

  return (
    <div
      className={cn(
        'relative',
        isIconMode ? 'w-32' : 'flex-1 min-w-[120px] max-w-[280px]',
        className
      )}
    >
      <Search
        size={14}
        className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onFocus={() => {
          setIsFocused(true);
        }}
        onBlur={() => {
          setIsFocused(false);
        }}
        placeholder={isIconMode ? 'Search...' : placeholder}
        aria-label={ariaLabel}
        className={cn(
          'w-full pl-7 pr-2 py-1 text-sm bg-bg-surface border border-border-subtle rounded',
          'focus:outline-none focus:border-border-emphasis',
          'text-text-secondary placeholder:text-text-muted',
          'transition-colors duration-200'
        )}
      />
    </div>
  );
};
