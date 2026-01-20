/**
 * @file BodyViewer component
 * @description Displays formatted JSON body with syntax highlighting
 */

import { useMemo } from 'react';
import { cn } from '@/utils/cn';

export interface BodyViewerProps {
  /** Body content to display (JSON string or plain text) */
  body: string | null;
  /** Additional CSS classes */
  className?: string;
}

/**
 * BodyViewer component that displays formatted JSON or plain text.
 *
 * Attempts to format JSON with 2-space indentation. Falls back to
 * displaying raw text if JSON parsing fails.
 *
 * @example
 * ```tsx
 * <BodyViewer body='{"name":"John"}' />
 * ```
 */
export const BodyViewer = ({ body, className }: BodyViewerProps): React.ReactElement => {
  const formattedBody = useMemo(() => {
    if (body === null || body === '') {
      return null;
    }

    // Try to parse and format as JSON
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // Not valid JSON, return as-is
      return body;
    }
  }, [body]);

  if (formattedBody === null) {
    return (
      <div data-testid="body-viewer" className={cn('text-sm text-text-muted italic', className)}>
        No body
      </div>
    );
  }

  return (
    <pre
      data-testid="body-viewer"
      className={cn(
        'text-xs font-mono text-text-primary bg-bg-raised p-3 rounded overflow-x-auto',
        'border border-border-default',
        className
      )}
    >
      <code>{formattedBody}</code>
    </pre>
  );
};
