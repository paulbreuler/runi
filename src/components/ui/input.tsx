import * as React from 'react';
import { motion, useMotionValue, useSpring, useMotionTemplate } from 'motion/react';
import { cn } from '@/utils/cn';

export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'
> {
  /** Enable glass-morphism effect (Apple 2025 aesthetic) */
  glass?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, glass = false, onFocus, onBlur, ...props }, ref) => {
    // Motion values for smooth animations
    const bgOpacity = useMotionValue(glass ? 0.05 : 1);
    const borderOpacity = useMotionValue(0.1);
    const blurAmount = useMotionValue(glass ? 8 : 0);

    // Spring animations for smooth transitions
    const bgOpacitySpring = useSpring(bgOpacity, { stiffness: 200, damping: 25 });
    const borderOpacitySpring = useSpring(borderOpacity, { stiffness: 200, damping: 25 });
    const blurSpring = useSpring(blurAmount, { stiffness: 200, damping: 25 });

    // Transform values to CSS strings using useMotionTemplate
    const backgroundColor = useMotionTemplate`rgba(255, 255, 255, ${bgOpacitySpring})`;
    const borderColor = useMotionTemplate`rgba(255, 255, 255, ${borderOpacitySpring})`;
    const backdropBlur = useMotionTemplate`blur(${blurSpring}px)`;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>): void => {
      if (glass) {
        bgOpacity.set(0.12);
        borderOpacity.set(0.3);
        blurAmount.set(12);
      }
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>): void => {
      if (glass) {
        bgOpacity.set(0.05);
        borderOpacity.set(0.1);
        blurAmount.set(8);
      }
      onBlur?.(e);
    };

    const baseClasses = cn(
      'text-text-primary placeholder:text-text-muted ring-offset-bg-app',
      'flex h-9 w-full min-w-0 rounded-lg px-3 py-1 text-sm',
      'outline-none disabled:cursor-not-allowed disabled:opacity-50',
      'aria-invalid:ring-signal-error/20 aria-invalid:border-signal-error',
      // Glass-morphism base styles (Apple 2025 aesthetic)
      glass && [
        'border',
        'shadow-sm shadow-black/5',
        // Focus styles - subtle, calm, muted unless focused
        'focus-visible:shadow-md focus-visible:shadow-black/10',
        'focus-visible:ring-1 focus-visible:ring-white/20',
      ],
      // Non-glass fallback styles
      !glass && [
        'bg-bg-raised border border-border-default',
        'transition-colors duration-200',
        'focus-visible:border-accent-blue focus-visible:ring-2',
        'focus-visible:ring-accent-purple focus-visible:ring-offset-2',
      ],
      className
    );

    // Use motion.input for glass effect, regular input otherwise
    if (glass) {
      return (
        <motion.input
          type={type}
          className={baseClasses}
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            backgroundColor,
            borderColor,
            backdropFilter: backdropBlur,
            WebkitBackdropFilter: backdropBlur,
          }}
          data-motion-component="input"
          whileHover={{
            scale: 1.005,
          }}
          whileFocus={{
            scale: 1.01,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          {...props}
        />
      );
    }

    return (
      <input
        type={type}
        className={baseClasses}
        ref={ref}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
