/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import * as React from 'react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import { motion, type Variant } from 'motion/react';
import { Check, Minus } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const checkboxVariants = cva(
  // Base styles - matching existing checkbox pattern in the codebase
  [
    'peer shrink-0 rounded border-2 flex items-center justify-center',
    'transition-colors duration-200',
    'outline-none',
    'focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app',
    'disabled:cursor-not-allowed disabled:opacity-50',
    // Unchecked state
    'data-[state=unchecked]:border-border-default data-[state=unchecked]:hover:border-border-emphasis',
    // Checked state
    'data-[state=checked]:bg-accent-blue data-[state=checked]:border-accent-blue',
    // Indeterminate state
    'data-[state=indeterminate]:bg-accent-blue data-[state=indeterminate]:border-accent-blue',
  ],
  {
    variants: {
      size: {
        sm: 'w-3.5 h-3.5',
        default: 'w-4 h-4',
        lg: 'w-5 h-5',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

// Motion animation variants for the check indicator
const indicatorMotionVariants: Record<string, Variant> = {
  hidden: {
    scale: 0,
    opacity: 0,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 25,
      mass: 0.5,
    },
  },
};

// Icon size mapping based on checkbox size
const iconSizeMap = {
  sm: 8,
  default: 10,
  lg: 12,
} as const;

export interface CheckboxProps
  extends
    Omit<
      React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
      'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'
    >,
    VariantProps<typeof checkboxVariants> {}

const Checkbox = React.forwardRef<React.ComponentRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, size, checked, ...props }, ref) => {
    const iconSize = iconSizeMap[size ?? 'default'];
    const isChecked = checked === true;
    const isIndeterminate = checked === 'indeterminate';

    return (
      <CheckboxPrimitive.Root
        ref={ref}
        className={cn(checkboxVariants({ size, className }))}
        checked={checked}
        {...props}
      >
        <CheckboxPrimitive.Indicator asChild forceMount>
          <motion.span
            className="flex items-center justify-center text-white"
            initial="hidden"
            animate={isChecked || isIndeterminate ? 'visible' : 'hidden'}
            variants={indicatorMotionVariants}
          >
            {isIndeterminate ? (
              <Minus size={iconSize} strokeWidth={3} />
            ) : (
              <Check size={iconSize} strokeWidth={3} />
            )}
          </motion.span>
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox, checkboxVariants };
