/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import * as React from 'react';
import { Label as LabelPrimitive } from 'radix-ui';
import { cn } from '@/utils/cn';

export interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  /** Label text */
  children: React.ReactNode;
}

/**
 * Label component for form inputs and controls.
 *
 * Uses Radix UI Label primitive for better accessibility and focus management.
 * Use with Switch, Input, Checkbox, and other form controls.
 * Associates label with control via htmlFor/id for accessibility.
 */
export const Label = React.forwardRef<React.ComponentRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <LabelPrimitive.Root
        ref={ref}
        className={cn('text-xs text-text-secondary cursor-pointer', className)}
        {...props}
      >
        {children}
      </LabelPrimitive.Root>
    );
  }
);
Label.displayName = LabelPrimitive.Root.displayName;
