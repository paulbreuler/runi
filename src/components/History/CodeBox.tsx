/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CodeBox component
 * @description Reusable code box container with copy button positioning
 */

import { type ReactNode } from 'react';
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
  'data-testid'?: string;
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
 * Handles copy button positioning in the top-right corner when copyText is provided.
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
  'data-testid': dataTestId = 'code-box',
}: CodeBoxProps): React.ReactElement => {
  const isContained = variant === 'contained';

  return (
    <div
      data-testid={dataTestId}
      className={cn('flex-1 overflow-auto relative', containerClassName)}
      style={{ scrollbarGutter: 'stable' }}
    >
      <div
        className={cn(
          'text-xs font-mono overflow-x-auto relative',
          // Contained variant: full visual container
          isContained && 'bg-bg-raised p-3 rounded border border-border-default',
          // Borderless variant: minimal styling, just padding for copy button clearance
          !isContained && 'px-2 py-1',
          copyText !== undefined && copyText !== '' && isContained && 'pr-20', // Add right padding to prevent horizontal overlap with copy button
          className
        )}
        data-language={dataLanguage}
      >
        {/* Copy button positioned absolutely in top right, overlays content */}
        {copyText !== undefined && copyText !== '' && (
          <div className="absolute top-2 right-2 z-50 pointer-events-auto">
            <CopyButton text={copyText} aria-label={copyButtonLabel} />
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
};
