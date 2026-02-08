/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';

export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'
> {
  /** Disable scale animations on hover (useful for compact UI) */
  noScale?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, noScale = false, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion() === true;

    const baseClasses = cn(
      focusRingClasses,
      'text-text-primary placeholder:text-text-muted',
      'flex w-full min-w-0 rounded-lg px-3 py-2 text-sm leading-tight',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'aria-invalid:ring-signal-error/20 aria-invalid:border-signal-error',
      'bg-bg-surface border border-border-subtle',
      'transition-colors duration-200',
      'hover:border-border-default',
      className
    );

    // Use motion.input for scale effects if not reduced motion
    if (!prefersReducedMotion && !noScale) {
      return (
        <motion.input
          type={type}
          className={baseClasses}
          ref={ref}
          whileHover={{ scale: 1.005 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          {...props}
        />
      );
    }

    return <input type={type} className={baseClasses} ref={ref} {...props} />;
  }
);
Input.displayName = 'Input';

export { Input };
