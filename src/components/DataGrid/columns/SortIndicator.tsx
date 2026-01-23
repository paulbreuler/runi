/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file SortIndicator component
 * @description Visual indicator for column sorting state
 *
 * Shows sort direction (ascending/descending) or no indicator when not sorted.
 * Used in column headers to indicate current sort state.
 */

import * as React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export type SortDirection = 'asc' | 'desc' | null;

interface SortIndicatorProps {
  /** Current sort direction */
  direction: SortDirection;
  /** Optional className for styling */
  className?: string;
}

/**
 * Visual indicator for column sorting state
 *
 * @example
 * ```tsx
 * <SortIndicator direction="asc" />
 * <SortIndicator direction="desc" />
 * <SortIndicator direction={null} />
 * ```
 */
export function SortIndicator({ direction, className }: SortIndicatorProps): React.ReactElement {
  if (direction === null) {
    // Show placeholder when not sorted (for consistent spacing)
    return (
      <span className={cn('inline-flex items-center w-4 h-4', className)} aria-hidden="true">
        {' '}
      </span>
    );
  }

  const Icon = direction === 'asc' ? ArrowUp : ArrowDown;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-4 h-4 text-text-secondary',
        className
      )}
      aria-label={direction === 'asc' ? 'Sorted ascending' : 'Sorted descending'}
      role="img"
    >
      <Icon size={14} className="shrink-0" />
    </span>
  );
}
