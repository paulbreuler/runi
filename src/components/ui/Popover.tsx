/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { Popover as BaseUIPopover } from '@base-ui/react/popover';
import React from 'react';
import { cn } from '@/utils/cn';
import { OVERLAY_Z_INDEX } from '@/utils/z-index';

/**
 * Popover root component.
 * Controls the open state of the popover.
 */
export const Popover = BaseUIPopover.Root;

/**
 * Popover trigger component.
 * The element that opens the popover when clicked.
 */
export const PopoverTrigger = BaseUIPopover.Trigger;

/**
 * Popover close component.
 * Closes the popover when clicked.
 */
export const PopoverClose = BaseUIPopover.Close;

export interface PopoverContentProps extends React.ComponentPropsWithoutRef<
  typeof BaseUIPopover.Popup
> {
  /** Optional test ID */
  'data-test-id'?: string;
  /** Alignment of the popover relative to the trigger */
  align?: 'start' | 'center' | 'end';
  /** Which side of the trigger to show the popover */
  side?: 'top' | 'right' | 'bottom' | 'left' | 'inline-start' | 'inline-end';
  /** Distance between the trigger and the popover in pixels */
  sideOffset?: number;
}

/**
 * Popover content component using Base UI.
 *
 * Features:
 * - Accessible with keyboard navigation
 * - Automatic focus management
 * - Click outside to close
 * - Escape key to close
 * - Smooth animations
 */
export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  (
    {
      className,
      align = 'start',
      side = 'bottom',
      sideOffset = 8,
      style,
      'data-test-id': testId = 'popover-content',
      ...props
    },
    ref
  ) => (
    <BaseUIPopover.Portal>
      <BaseUIPopover.Positioner align={align} side={side} sideOffset={sideOffset}>
        <BaseUIPopover.Popup
          ref={ref}
          className={cn(
            'w-72 rounded-md border border-border-default bg-bg-elevated p-4 shadow-lg',
            'outline-none',
            'focus-within:ring-2 focus-within:ring-(--color-ring) focus-within:ring-offset-2 focus-within:ring-offset-bg-app',
            'animate-in fade-in-0 zoom-in-95',
            'data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
            'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            className
          )}
          style={{ ...(style as React.CSSProperties), zIndex: OVERLAY_Z_INDEX }}
          data-test-id={testId}
          {...props}
        />
      </BaseUIPopover.Positioner>
    </BaseUIPopover.Portal>
  )
);

PopoverContent.displayName = 'PopoverContent';
