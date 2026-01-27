/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import * as React from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info, Terminal } from 'lucide-react';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import { Button } from '@/components/ui/button';
import { globalEventBus } from '@/events/bus';
import type { ToastData, ToastVariant } from './toast.types';

/**
 * CVA variants for toast styling.
 * Uses thick left border accent as specified.
 */
const toastVariants = cva(
  [
    'group pointer-events-auto relative flex w-full items-center gap-2',
    'overflow-hidden rounded-md border border-l-[3px] px-3 py-2',
    'bg-bg-raised shadow-lg',
  ],
  {
    variants: {
      variant: {
        success: 'border-l-signal-success border-border-subtle',
        error: 'border-l-signal-error border-border-subtle',
        warning: 'border-l-signal-warning border-border-subtle',
        info: 'border-l-accent-blue border-border-subtle',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
);

/**
 * Icon mapping for each toast variant.
 */
const variantIcons: Record<ToastVariant, React.FC<{ className?: string }>> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

/**
 * Icon color classes for each variant.
 */
const iconColorClasses: Record<ToastVariant, string> = {
  success: 'text-signal-success',
  error: 'text-signal-error',
  warning: 'text-signal-warning',
  info: 'text-accent-blue',
};

/**
 * Motion animation variants for toast enter/exit.
 */
const toastMotionVariants = {
  initial: {
    opacity: 0,
    x: 50,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
      mass: 0.5,
    },
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: 'easeOut' as const,
    },
  },
};

/**
 * Reduced motion variants (instant transitions).
 */
const reducedMotionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

export interface ToastProps extends VariantProps<typeof toastVariants> {
  /** Toast data */
  toast: ToastData;
  /** Callback when toast is dismissed */
  onDismiss: (id: string) => void;
}

/**
 * Individual toast component with animations and interactions.
 */
export const Toast = React.forwardRef<HTMLLIElement, ToastProps>(
  ({ toast, variant, onDismiss }, ref) => {
    const shouldReduceMotion = useReducedMotion();
    const [isOpen, setIsOpen] = React.useState(true);
    const toastVariant = variant ?? toast.variant;
    const Icon = variantIcons[toastVariant];

    // Handle open state change from Radix (e.g., auto-dismiss timer)
    const handleOpenChange = (open: boolean): void => {
      setIsOpen(open);
      if (!open) {
        onDismiss(toast.id);
      }
    };

    // Handle "View Console" click for error toasts
    const handleViewConsole = (): void => {
      globalEventBus.emit(
        'panel.console-requested',
        { correlationId: toast.correlationId },
        'Toast'
      );
    };

    // Determine if we should show "View Console" action
    const showConsoleAction = toastVariant === 'error' && toast.correlationId !== undefined;

    return (
      <AnimatePresence mode="popLayout">
        {isOpen && (
          <ToastPrimitives.Root
            ref={ref}
            open={isOpen}
            onOpenChange={handleOpenChange}
            duration={toast.duration}
            asChild
            forceMount
          >
            <motion.li
              layout
              variants={shouldReduceMotion === true ? reducedMotionVariants : toastMotionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={cn(toastVariants({ variant: toastVariant }))}
              data-testid={toast.testId ?? `toast-${toast.id}`}
              data-variant={toastVariant}
            >
              {/* Icon */}
              <Icon
                className={cn('h-4 w-4 shrink-0', iconColorClasses[toastVariant])}
                aria-hidden="true"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <ToastPrimitives.Title className="text-xs font-medium text-text-primary line-clamp-2">
                  {toast.message}
                  {toast.count > 1 && (
                    <span
                      className="ml-1.5 text-text-muted font-normal"
                      data-testid={`toast-count-${toast.id}`}
                    >
                      (x{toast.count})
                    </span>
                  )}
                </ToastPrimitives.Title>

                {toast.details !== undefined && (
                  <ToastPrimitives.Description className="mt-0.5 text-xs text-text-secondary line-clamp-1">
                    {toast.details}
                  </ToastPrimitives.Description>
                )}
              </div>

              {/* Action button (right side) */}
              {showConsoleAction && (
                <ToastPrimitives.Action asChild altText="View error in console">
                  <Button
                    variant="secondary"
                    size="xs"
                    noScale
                    onClick={handleViewConsole}
                    data-testid={`toast-view-console-${toast.id}`}
                  >
                    <Terminal className="h-3 w-3" />
                    Console
                  </Button>
                </ToastPrimitives.Action>
              )}

              {/* Close button */}
              <ToastPrimitives.Close
                className={cn(
                  'shrink-0 rounded p-0.5',
                  'text-text-muted hover:text-text-primary hover:bg-bg-elevated',
                  'transition-colors',
                  focusRingClasses
                )}
                aria-label="Dismiss notification"
                data-testid={`toast-close-${toast.id}`}
              >
                <X className="h-3.5 w-3.5" />
              </ToastPrimitives.Close>
            </motion.li>
          </ToastPrimitives.Root>
        )}
      </AnimatePresence>
    );
  }
);

Toast.displayName = 'Toast';
