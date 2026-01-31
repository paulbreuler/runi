/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import * as React from 'react';
import { motion, type Variant } from 'motion/react';
import {
  Button as BaseButton,
  type ButtonProps as BaseButtonProps,
  type ButtonState,
} from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';

const buttonVariants = cva(
  `${focusRingClasses} inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4`,
  {
    variants: {
      variant: {
        // Primary: Clean solid accent - the main action
        default: 'bg-accent-blue hover:bg-accent-blue-hover text-accent-contrast',
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
          'bg-bg-raised border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-emphasis',
        // Ghost: Invisible until hover
        ghost: 'bg-transparent text-text-muted hover:text-text-primary hover:bg-bg-raised/50',
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
      BaseButtonProps,
      | 'className'
      | 'render'
      | 'onDrag'
      | 'onDragStart'
      | 'onDragEnd'
      | 'onAnimationStart'
      | 'onAnimationEnd'
    >,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Disable scale animations on hover/tap (useful for compact UI like status bars) */
  noScale?: boolean;
  className?: BaseButtonProps['className'];
  render?: BaseButtonProps['render'];
}

const Button = React.forwardRef<HTMLElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      disabled = false,
      noScale = false,
      render,
      nativeButton,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = buttonVariants({ variant, size });
    const resolvedClassName =
      typeof className === 'function'
        ? (state: ButtonState): string => cn(baseClasses, className(state))
        : cn(baseClasses, className);

    const renderElement =
      asChild && render === undefined && React.isValidElement(children)
        ? (children as React.ReactElement)
        : undefined;
    const resolvedRender = renderElement ?? render;

    return (
      <BaseButton
        {...props}
        ref={ref}
        disabled={disabled}
        className={resolvedClassName}
        nativeButton={asChild ? (nativeButton ?? false) : nativeButton}
        render={
          resolvedRender ??
          ((renderProps): React.ReactElement => {
            const {
              children: renderChildren,
              type,
              onDrag: _onDrag,
              onDragStart: _onDragStart,
              onDragEnd: _onDragEnd,
              onAnimationStart: _onAnimationStart,
              onAnimationEnd: _onAnimationEnd,
              ...restRenderProps
            } = renderProps as React.ComponentPropsWithRef<'button'>;

            // Use Motion variants for cleaner, more maintainable animations
            // Following Motion docs: variants are better than inline whileHover/whileTap
            // noScale disables hover/tap animations for compact UI contexts
            return (
              <motion.button
                {...restRenderProps}
                type={type ?? 'button'}
                disabled={disabled}
                variants={noScale ? undefined : buttonMotionVariants}
                initial={noScale ? undefined : 'rest'}
                whileHover={disabled || noScale ? undefined : 'hover'}
                whileTap={disabled || noScale ? undefined : 'tap'}
              >
                {renderChildren}
              </motion.button>
            );
          })
        }
      >
        {renderElement === undefined ? children : null}
      </BaseButton>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
