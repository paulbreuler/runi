/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { Popover as PopoverPrimitive } from 'radix-ui';
import React from 'react';
import { cn } from '@/utils/cn';

/**
 * Popover root component.
 * Controls the open state of the popover.
 */
export const Popover = PopoverPrimitive.Root;

/**
 * Popover trigger component.
 * The element that opens the popover when clicked.
 */
export const PopoverTrigger = PopoverPrimitive.Trigger;

/**
 * Popover anchor component.
 * An optional element to use as the positioning anchor.
 */
export const PopoverAnchor = PopoverPrimitive.Anchor;

/**
 * Popover close component.
 * Closes the popover when clicked.
 */
export const PopoverClose = PopoverPrimitive.Close;

export interface PopoverContentProps extends React.ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Content
> {
  /** Optional test ID */
  'data-testid'?: string;
}

/**
 * Popover content component using Radix UI.
 *
 * Features:
 * - Accessible with keyboard navigation
 * - Automatic focus management
 * - Click outside to close
 * - Escape key to close
 * - Smooth animations
 */
export const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(
  (
    {
      className,
      align = 'start',
      sideOffset = 8,
      'data-testid': testId = 'popover-content',
      ...props
    },
    ref
  ) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 w-72 rounded-md border border-border-default bg-bg-surface p-4 shadow-lg',
          'outline-none',
          'animate-in fade-in-0 zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className
        )}
        data-testid={testId}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
);

PopoverContent.displayName = PopoverPrimitive.Content.displayName;
