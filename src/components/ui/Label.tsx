/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import * as React from 'react';
import { Field } from '@base-ui/react/field';
import { cn } from '@/utils/cn';

export interface LabelProps extends React.ComponentPropsWithoutRef<typeof Field.Label> {
  /** Label text */
  children: React.ReactNode;
}

/**
 * Label component for form inputs and controls.
 *
 * Uses Base UI Field.Label for better accessibility and focus management.
 * Use with Switch, Input, Checkbox, and other form controls.
 * Associates label with control via htmlFor/id for accessibility.
 */
export const Label = React.forwardRef<React.ComponentRef<typeof Field.Label>, LabelProps>(
  ({ children, className, ...props }, ref) => {
    const resolvedClassName =
      typeof className === 'function'
        ? (state: Field.Label.State): string =>
            cn('text-xs text-text-secondary cursor-pointer', className(state))
        : cn('text-xs text-text-secondary cursor-pointer', className);

    return (
      <Field.Label ref={ref} className={resolvedClassName} {...props}>
        {children}
      </Field.Label>
    );
  }
);
Label.displayName = 'Label';
