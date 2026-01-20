/**
 * @file MethodCell component
 * @description Renders HTTP method badges with color coding
 */

import * as React from 'react';
import { cn } from '@/utils/cn';

const methodColors: Record<string, string> = {
  GET: 'text-accent-blue',
  POST: 'text-signal-success',
  PUT: 'text-signal-warning',
  PATCH: 'text-signal-warning',
  DELETE: 'text-signal-error',
  HEAD: 'text-text-muted',
  OPTIONS: 'text-text-muted',
};

const methodBgColors: Record<string, string> = {
  GET: 'bg-accent-blue/10',
  POST: 'bg-signal-success/10',
  PUT: 'bg-signal-warning/10',
  PATCH: 'bg-signal-warning/10',
  DELETE: 'bg-signal-error/10',
  HEAD: 'bg-text-muted/10',
  OPTIONS: 'bg-text-muted/10',
};

interface MethodCellProps {
  method: string;
}

/**
 * Renders an HTTP method badge with appropriate color styling.
 *
 * @example
 * ```tsx
 * <MethodCell method="GET" />
 * <MethodCell method="POST" />
 * ```
 */
export const MethodCell = ({ method }: MethodCellProps): React.ReactElement => {
  const upperMethod = method.toUpperCase();
  const colorClass = methodColors[upperMethod] ?? 'text-text-muted';
  const bgClass = methodBgColors[upperMethod] ?? 'bg-text-muted/10';

  return (
    <span
      className={cn('px-1.5 py-0.5 text-xs font-semibold rounded font-mono', colorClass, bgClass)}
    >
      {upperMethod}
    </span>
  );
};
