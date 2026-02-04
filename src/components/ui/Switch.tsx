/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import * as React from 'react';
import { Switch as SwitchPrimitive } from '@base-ui/react/switch';
import { motion } from 'motion/react';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';

export interface SwitchProps extends Omit<
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
  'onCheckedChange' | 'checked'
> {
  /** Whether the switch is on */
  checked: boolean;
  /** Callback when switch changes */
  onCheckedChange: (checked: boolean) => void;
  /** Optional test ID */
  'data-test-id'?: string;
}

/**
 * Switch component based on Base UI Switch primitive with Motion animations.
 *
 * Features:
 * - Full keyboard navigation (Space, Enter)
 * - Motion animations for smooth transitions (spring physics)
 * - Prevents event propagation (stopPropagation)
 * - Accessible with proper ARIA attributes
 */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, className, 'data-test-id': testId = 'switch', ...props }, ref) => {
    return (
      <SwitchPrimitive.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        render={(rootProps, state) => {
          const {
            onDrag: _onDrag,
            onDragStart: _onDragStart,
            onDragEnd: _onDragEnd,
            ...filteredRootProps
          } = rootProps;
          return (
            <motion.button
              {...filteredRootProps}
              ref={ref}
              className={cn(
                focusRingClasses,
                'relative flex h-[18px] w-[32px] cursor-pointer items-center rounded-full p-[2px]',
                'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60',
                className
              )}
              style={{
                WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
              }}
              initial={false}
              animate={{
                backgroundColor: state.disabled
                  ? 'var(--color-bg-raised)'
                  : checked
                    ? 'var(--color-accent-blue)'
                    : 'var(--color-bg-raised)',
                justifyContent: checked ? 'flex-end' : 'flex-start',
              }}
              onMouseDown={(e): void => {
                e.stopPropagation(); // Prevent dialog from closing
                filteredRootProps.onMouseDown?.(e);
              }}
              data-test-id={testId}
            >
              <SwitchPrimitive.Thumb
                render={({
                  onDrag: _onDrag,
                  onDragStart: _onDragStart,
                  onDragEnd: _onDragEnd,
                  onAnimationStart: _onAnimStart,
                  onAnimationEnd: _onAnimEnd,
                  ...thumbProps
                }) => (
                  <motion.div
                    {...thumbProps}
                    className="block size-[14px] rounded-full bg-white shadow-sm"
                    layout
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
              />
            </motion.button>
          );
        }}
        {...props}
      />
    );
  }
);

Switch.displayName = 'Switch';
