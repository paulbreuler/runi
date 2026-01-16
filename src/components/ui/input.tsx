import * as React from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'bg-bg-raised border border-border-default text-text-primary placeholder:text-text-muted ring-offset-bg-app flex h-9 w-full min-w-0 rounded-lg border px-3 py-1 text-sm transition-colors duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-50',
          'focus-visible:border-accent-blue focus-visible:ring-2 focus-visible:ring-accent-purple focus-visible:ring-offset-2',
          'aria-invalid:ring-signal-error/20 aria-invalid:border-signal-error',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
