/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CodeBox component
 * @description Reusable code box container with copy button positioning
 */

import { type ReactNode } from 'react';
import { containedFocusRingClasses } from '@/utils/accessibility';
import { cn } from '@/utils/cn';
import { CopyButton } from './CopyButton';

export interface CodeBoxProps {
  /** Content to display inside the code box */
  children: ReactNode;
  /** Text to copy when copy button is clicked */
  copyText?: string;
  /** ARIA label for the copy button */
  copyButtonLabel?: string;
  /** Visual variant: 'contained' for standalone use with border/background, 'borderless' for use inside existing containers */
  variant?: 'contained' | 'borderless';
  /** Additional CSS classes */
  className?: string;
  /** Additional CSS classes for the container */
  containerClassName?: string;
  /** Additional data attributes */
  'data-language'?: string;
  /** Additional data attributes */
  'data-test-id'?: string;
}

/**
 * CodeBox component that provides consistent styling and copy button positioning
 * for code display containers.
 *
 * Supports two variants:
 * - `contained` (default): Full visual container with background, border, padding, and rounded corners.
 *   Use for standalone code display (e.g., in expanded panels, history views).
 * - `borderless`: Minimal styling without background, border, or rounded corners.
 *   Use inside existing containers (e.g., MainLayout panes) to avoid nested visual containers.
 *
 * Places copy button in a row above the content when copyText is provided.
 *
 * @example
 * ```tsx
 * // Contained variant (default) - for standalone use
 * <CodeBox copyText="const x = 1;">
 *   <pre><code>const x = 1;</code></pre>
 * </CodeBox>
 *
 * // Borderless variant - for use inside containers
 * <CodeBox variant="borderless" copyText="const x = 1;">
 *   <pre><code>const x = 1;</code></pre>
 * </CodeBox>
 * ```
 */
export const CodeBox = ({
  children,
  copyText,
  copyButtonLabel,
  variant = 'contained',
  className,
  containerClassName,
  'data-language': dataLanguage,
  'data-test-id': dataTestId = 'code-box',
}: CodeBoxProps): React.ReactElement => {
  const isContained = variant === 'contained';
  const hasCopyButton = copyText !== undefined && copyText !== '';

  return (
    <div
      data-test-id={dataTestId}
      className={cn(
        'flex flex-col flex-1 min-h-0 overflow-hidden',
        // Contained variant: full visual container
        isContained && 'bg-bg-raised rounded border border-border-default',
        containerClassName
      )}
      style={{ scrollbarGutter: 'stable' }}
    >
      {/* Copy button row above content */}
      {hasCopyButton && (
        <div className="flex justify-end px-1 pt-1">
          <CopyButton text={copyText} aria-label={copyButtonLabel} />
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          'text-xs font-mono flex-1 min-h-0 overflow-auto',
          containedFocusRingClasses,
          // Padding based on variant
          isContained && 'px-3 pb-3',
          isContained && !hasCopyButton && 'pt-3',
          !isContained && 'px-2 py-1',
          className
        )}
        data-language={dataLanguage}
        tabIndex={0}
      >
        {children}
      </div>
    </div>
  );
};
