/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import * as React from 'react';
import { motion, type Variant } from 'motion/react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
  {
    variants: {
      variant: {
        // Primary: Clean solid accent - the main action
        default: 'bg-accent-blue hover:bg-accent-blue-hover text-white',
        // Destructive: Soft error styling
        destructive: 'bg-signal-error/10 text-signal-error hover:bg-signal-error/20',
        // Destructive Outline: Ghost until hover, then reveals destructive intent
        'destructive-outline':
          'bg-transparent border border-transparent text-text-muted hover:text-signal-error hover:bg-signal-error/10 hover:border-signal-error/20',
        // Outline: Subtle border, ghost-like
        outline:
          'bg-transparent border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-raised/50',
        // Secondary: Raised surface
        secondary:
          'bg-bg-raised border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
        // Ghost: Invisible until hover
        ghost: 'bg-transparent text-text-muted hover:text-text-secondary hover:bg-bg-raised/50',
        // Link: Text only
        link: 'text-accent-blue underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-5 py-2 text-sm',
        sm: 'h-8 px-3 py-1.5 text-sm',
        xs: 'h-7 px-2 py-1 text-xs',
        lg: 'h-10 px-6 py-2.5 text-sm',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-xs': 'size-7',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// Motion animation variants - following Motion best practices
// Using variants makes animations reusable and easier to maintain
const buttonMotionVariants: Record<string, Variant> = {
  // Zen aesthetic: subtle, calm interactions
  rest: {
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
      mass: 0.5,
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      type: 'spring',
      stiffness: 600,
      damping: 30,
    },
  },
};

export interface ButtonProps
  extends
    Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'
    >,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Disable scale animations on hover/tap (useful for compact UI like status bars) */
  noScale?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, disabled, noScale = false, ...props }, ref) => {
    if (asChild) {
      const Comp = Slot;
      return (
        <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
      );
    }

    // Use Motion variants for cleaner, more maintainable animations
    // Following Motion docs: variants are better than inline whileHover/whileTap
    // noScale disables hover/tap animations for compact UI contexts
    return (
      <motion.button
        {...props}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled}
        variants={noScale ? undefined : buttonMotionVariants}
        initial={noScale ? undefined : 'rest'}
        whileHover={disabled === true || noScale ? undefined : 'hover'}
        whileTap={disabled === true || noScale ? undefined : 'tap'}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
