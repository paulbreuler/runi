/**
 * @file StatusCell component
 * @description Renders HTTP status codes with color coding
 */

import * as React from 'react';
import { cn } from '@/utils/cn';

function getStatusColorClass(status: number): string {
  if (status >= 200 && status < 300) {
    return 'text-signal-success';
  }
  if (status >= 300 && status < 400) {
    return 'text-accent-blue';
  }
  if (status >= 400 && status < 500) {
    return 'text-signal-warning';
  }
  if (status >= 500) {
    return 'text-signal-error';
  }
  return 'text-text-muted';
}

interface StatusCellProps {
  status: number;
}

/**
 * Renders an HTTP status code with appropriate color styling.
 *
 * @example
 * ```tsx
 * <StatusCell status={200} />
 * <StatusCell status={404} />
 * <StatusCell status={500} />
 * ```
 */
export const StatusCell = ({ status }: StatusCellProps): React.ReactElement => {
  return (
    <span className={cn('text-sm font-mono font-semibold', getStatusColorClass(status))}>
      {status}
    </span>
  );
};
