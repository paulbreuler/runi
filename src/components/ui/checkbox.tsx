/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import * as React from 'react';
import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
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
    // Default unchecked state
    'border-border-default hover:border-border-emphasis',
    // Checked state - Base UI uses data-checked
    'data-checked:bg-accent-blue data-checked:border-accent-blue',
    // Indeterminate state - Base UI uses data-indeterminate
    'data-indeterminate:bg-accent-blue data-indeterminate:border-accent-blue',
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
      'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'checked'
    >,
    VariantProps<typeof checkboxVariants> {
  /** Whether the checkbox is checked, unchecked, or indeterminate */
  checked?: boolean | 'indeterminate';
}

const Checkbox = React.forwardRef<React.ComponentRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, size, checked, ...props }, ref) => {
    const iconSize = iconSizeMap[size ?? 'default'];
    const isChecked = checked === true;
    const isIndeterminate = checked === 'indeterminate';
    // Base UI Checkbox.Root expects boolean, so we pass false for indeterminate
    // and handle the indeterminate state via the underlying input element
    const baseUIChecked = isIndeterminate ? false : checked;
    const rootRef = React.useRef<HTMLButtonElement>(null);

    // Set indeterminate on the underlying input element and root element for styling
    React.useEffect(() => {
      const root = rootRef.current;
      if (root !== null) {
        const input = root.querySelector('input[type="checkbox"]');
        if (input instanceof HTMLInputElement) {
          input.indeterminate = isIndeterminate;
        }
        // Set data-indeterminate on root for CSS styling
        if (isIndeterminate) {
          root.setAttribute('data-indeterminate', '');
        } else {
          root.removeAttribute('data-indeterminate');
        }
      }
    }, [isIndeterminate]);

    // Merge refs
    const mergedRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        rootRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref !== null && ref !== undefined) {
          ref.current = node;
        }
      },
      [ref]
    );

    return (
      <CheckboxPrimitive.Root
        ref={mergedRef}
        className={cn(checkboxVariants({ size, className }))}
        checked={baseUIChecked}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          render={({ onDrag: _onDrag, ...props }) => (
            <motion.span
              {...props}
              className="flex items-center justify-center text-accent-contrast"
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
          )}
        />
      </CheckboxPrimitive.Root>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox, checkboxVariants };
