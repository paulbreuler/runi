/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import * as React from 'react';
import { Select as SelectPrimitive } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import { OVERLAY_Z_INDEX } from '@/utils/z-index';

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

/**
 * SelectTrigger - The button that opens the select dropdown.
 *
 * By default, Base UI applies `role="combobox"` which some accessibility
 * checkers flag as requiring child elements. For non-editable selects,
 * you can override with `role="button"` and `aria-haspopup="listbox"`.
 *
 * @example
 * ```tsx
 * <SelectTrigger role="button" aria-haspopup="listbox">
 *   <SelectValue />
 * </SelectTrigger>
 * ```
 */
const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & { 'data-testid'?: string }
>(({ className, children, 'data-testid': dataTestId, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    {...(dataTestId !== undefined && { 'data-testid': dataTestId })}
    className={cn(
      focusRingClasses,
      'border border-border-subtle data-[placeholder]:text-text-muted flex h-9 w-fit items-center justify-between gap-2 rounded-lg bg-bg-surface px-3 py-2 text-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-bg-raised hover:border-border-default [&>span]:line-clamp-1',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon>
      <ChevronDown className="h-4 w-4 opacity-40" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

const SelectScrollUpButton = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.ScrollUpArrow>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpArrow>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpArrow
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    {/* Scroll up icon would go here if needed */}
  </SelectPrimitive.ScrollUpArrow>
));
SelectScrollUpButton.displayName = 'SelectScrollUpButton';

const SelectScrollDownButton = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.ScrollDownArrow>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownArrow>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownArrow
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    {/* Scroll down icon would go here if needed */}
  </SelectPrimitive.ScrollDownArrow>
));
SelectScrollDownButton.displayName = 'SelectScrollDownButton';

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'> & {
    position?: 'popper' | 'item-aligned';
    'data-testid'?: string;
  }
>(({ className, children, position = 'popper', 'data-testid': dataTestId, ...props }, ref) => (
  <SelectPrimitive.Portal>
    {/* Fixed overlay ensures dropdown stacks above sticky/pinned columns (viewport stacking) */}
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: OVERLAY_Z_INDEX,
        pointerEvents: 'none',
      }}
    >
      {/* Restore pointer events for the dropdown so it remains interactive */}
      <div style={{ pointerEvents: 'auto' }}>
        <SelectPrimitive.Positioner
          alignItemWithTrigger={position === 'item-aligned'}
          sideOffset={8}
          className={cn(
            position === 'popper' &&
              'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1'
          )}
        >
          <SelectPrimitive.Popup
            ref={ref}
            {...(dataTestId !== undefined && { 'data-testid': dataTestId })}
            style={{ zIndex: OVERLAY_Z_INDEX }}
            className={cn(
              'bg-bg-elevated text-text-primary relative max-h-96 min-w-[8rem] overflow-hidden rounded-lg border border-border-default shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-end-2 data-[side=right]:slide-in-from-start-2 data-[side=top]:slide-in-from-bottom-2',
              className
            )}
            {...props}
          >
            <SelectScrollUpButton />
            <SelectPrimitive.List className="p-1">{children}</SelectPrimitive.List>
            <SelectScrollDownButton />
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </div>
    </div>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = 'SelectContent';

const SelectLabel = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.GroupLabel>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.GroupLabel>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.GroupLabel
    ref={ref}
    className={cn('py-1.5 pl-6 pr-8 text-sm font-semibold', className)}
    {...props}
  />
));
SelectLabel.displayName = 'SelectLabel';

const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & { 'data-testid'?: string }
>(({ className, children, 'data-testid': dataTestId, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    {...(dataTestId !== undefined && { 'data-testid': dataTestId })}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-6 pr-8 text-sm outline-none focus:bg-bg-raised focus:text-text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-1.5 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

const SelectSeparator = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-border-default', className)}
    {...props}
  />
));
SelectSeparator.displayName = 'SelectSeparator';

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
