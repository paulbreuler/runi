/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { motion } from 'motion/react';
import { cn } from '@/utils/cn';

export interface ToggleSwitchProps extends Omit<
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
  'onCheckedChange' | 'checked'
> {
  /** Whether the toggle is on */
  checked: boolean;
  /** Callback when toggle changes */
  onCheckedChange: (checked: boolean) => void;
  /** Optional test ID */
  'data-testid'?: string;
}

/**
 * Toggle switch component based on Radix UI Switch primitive with Motion animations.
 *
 * Features:
 * - Full keyboard navigation (Space, Enter)
 * - Motion animations for smooth transitions (spring physics)
 * - Prevents event propagation (stopPropagation)
 * - Accessible with proper ARIA attributes
 */
export const ToggleSwitch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  ToggleSwitchProps
>(
  (
    { checked, onCheckedChange, className, 'data-testid': testId = 'toggle-switch', ...props },
    ref
  ) => {
    return (
      <SwitchPrimitive.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        onMouseDown={(e): void => {
          e.stopPropagation(); // Prevent dialog from closing
        }}
        asChild
        data-testid={testId}
        {...props}
      >
        <motion.button
          ref={ref}
          className={cn(
            'relative flex h-[25px] w-[42px] cursor-pointer items-center rounded-full p-[2px] outline-none',
            'focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app',
            className
          )}
          style={{
            WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
          }}
          initial={false}
          animate={{
            backgroundColor: checked ? 'var(--color-accent-blue)' : 'var(--color-bg-raised)',
            justifyContent: checked ? 'flex-end' : 'flex-start',
          }}
        >
          <SwitchPrimitive.Thumb asChild>
            <motion.div
              className="block size-[21px] rounded-full bg-white shadow-sm"
              layout
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 30,
              }}
            />
          </SwitchPrimitive.Thumb>
        </motion.button>
      </SwitchPrimitive.Root>
    );
  }
);

ToggleSwitch.displayName = 'ToggleSwitch';
