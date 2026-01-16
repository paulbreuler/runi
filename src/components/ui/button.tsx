import * as React from 'react';
import { motion } from 'motion/react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent-purple focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
  {
    variants: {
      variant: {
        default: 'bg-accent-blue text-white hover:bg-accent-blue-hover',
        destructive:
          'bg-signal-error text-white hover:bg-signal-error/90 focus-visible:ring-signal-error/20',
        outline:
          'bg-transparent border border-border-emphasis text-text-primary hover:bg-bg-raised',
        secondary: 'bg-bg-raised border border-border-emphasis text-text-primary hover:bg-bg-elevated',
        ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-raised',
        link: 'text-accent-blue underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 py-1.5 text-sm',
        lg: 'h-10 px-6 py-2.5 text-base',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      disabled,
      onDrag,
      onDragStart,
      onDragEnd,
      onAnimationStart,
      onAnimationEnd,
      ...props
    },
    ref
  ) => {
    if (asChild) {
      const Comp = Slot;
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      );
    }

    const motionProps = {
      ...props,
      className: cn(buttonVariants({ variant, size, className })),
      ref,
      disabled,
      whileHover: disabled ? undefined : { scale: 1.02 },
      whileTap: disabled ? undefined : { scale: 0.98 },
      transition: { duration: 0.2 },
    };

    return <motion.button {...motionProps} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
