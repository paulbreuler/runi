/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import * as React from 'react';
import {
  Separator as BaseSeparator,
  type SeparatorProps as BaseSeparatorProps,
  type SeparatorState,
} from '@base-ui/react/separator';
import { cn } from '@/utils/cn';

export interface SeparatorProps extends Omit<BaseSeparatorProps, 'className'> {
  /** Whether the separator is decorative (hidden from assistive tech). */
  decorative?: boolean;
  className?: BaseSeparatorProps['className'];
}

const Separator = React.forwardRef<React.ComponentRef<typeof BaseSeparator>, SeparatorProps>(
  ({ className, orientation = 'horizontal', decorative = true, role, ...props }, ref) => {
    const resolvedClassName =
      typeof className === 'function'
        ? (state: SeparatorState): string =>
            cn(
              'bg-border shrink-0',
              state.orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
              className(state)
            )
        : cn(
            'bg-border shrink-0',
            orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
            className
          );

    const resolvedRole = role ?? (decorative ? 'presentation' : 'separator');
    const resolvedAriaHidden = props['aria-hidden'] ?? (decorative ? true : undefined);
    const defaultAriaOrientation = orientation === 'vertical' ? 'vertical' : undefined;
    const resolvedAriaOrientation =
      props['aria-orientation'] ?? (decorative ? undefined : defaultAriaOrientation);

    return (
      <BaseSeparator
        ref={ref}
        orientation={orientation}
        role={resolvedRole}
        aria-hidden={resolvedAriaHidden}
        aria-orientation={resolvedAriaOrientation}
        data-orientation={orientation}
        className={resolvedClassName}
        {...props}
      />
    );
  }
);
Separator.displayName = 'Separator';

export { Separator };
