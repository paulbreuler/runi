/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import * as React from 'react';
import { cn } from '@/utils/cn';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Label text */
  children: React.ReactNode;
}

/**
 * Label component for form inputs and controls.
 *
 * Uses a standard HTML label element for maximum flexibility.
 * Use with Switch, Input, Checkbox, and other form controls.
 * Associates label with control via htmlFor/id for accessibility.
 */
export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn('text-xs text-text-secondary cursor-pointer', className)}
        {...props}
      >
        {children}
      </label>
    );
  }
);
Label.displayName = 'Label';
