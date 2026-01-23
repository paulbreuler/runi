/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file HeaderRow component
 * @description Displays a single HTTP header key-value pair
 */

import React from 'react';
import { cn } from '@/utils/cn';

export interface HeaderRowProps {
  /** Header name (key) */
  name: string;
  /** Header value */
  value: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * HeaderRow component that displays a single HTTP header.
 *
 * Displays the header name in accent-blue and the value in text-secondary,
 * with proper formatting for readability.
 *
 * @example
 * ```tsx
 * <HeaderRow name="Content-Type" value="application/json" />
 * ```
 */
export const HeaderRow = ({ name, value, className }: HeaderRowProps): React.ReactElement => {
  return (
    <div data-testid="header-row" className={cn('flex items-start gap-2 py-1.5', className)}>
      <span className="text-accent-blue font-mono text-xs font-medium shrink-0">{name}</span>
      <span className="text-text-muted font-mono text-xs shrink-0">:</span>
      <span className="text-text-secondary font-mono text-xs break-words flex-1">{value}</span>
    </div>
  );
};
