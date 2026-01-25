/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { cn } from '@/utils/cn';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Label text */
  children: React.ReactNode;
  /** Optional test ID */
  'data-testid'?: string;
}

/**
 * Label component for form inputs and controls.
 *
 * Use with ToggleSwitch, Input, Checkbox, and other form controls.
 * Associates label with control via htmlFor/id for accessibility.
 */
export const Label: React.FC<LabelProps> = ({
  children,
  className,
  'data-testid': testId,
  ...props
}) => {
  return (
    <label
      className={cn('text-xs text-text-secondary cursor-pointer', className)}
      data-testid={testId}
      {...props}
    >
      {children}
    </label>
  );
};
