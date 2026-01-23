/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CopyButton component
 * @description Button that copies text to clipboard and shows "✓ Copied" feedback
 */

import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface CopyButtonProps {
  /** Text to copy to clipboard */
  text: string;
  /** Duration in milliseconds to show feedback (default: 2000) */
  feedbackDuration?: number;
  /** Additional CSS classes */
  className?: string;
  /** ARIA label for the button */
  'aria-label'?: string;
}

/**
 * CopyButton component that copies text to clipboard and shows feedback.
 *
 * @example
 * ```tsx
 * <CopyButton text="Hello, world!" />
 * ```
 */
export const CopyButton = ({
  text,
  feedbackDuration = 2000,
  className,
  'aria-label': ariaLabel = 'Copy to clipboard',
}: CopyButtonProps): React.ReactElement => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      // Reset feedback after duration
      setTimeout(() => {
        setCopied(false);
      }, feedbackDuration);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  }, [text, feedbackDuration]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary',
        'hover:text-text-primary transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-1 rounded',
        className
      )}
      aria-label={ariaLabel}
    >
      {copied ? (
        <>
          <Check size={14} className="text-signal-success" />
          <span className="text-signal-success">Copied</span>
        </>
      ) : (
        <>
          <Copy size={14} />
          <span>Copy</span>
        </>
      )}
    </button>
  );
};
