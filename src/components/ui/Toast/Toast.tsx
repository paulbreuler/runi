/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Toast as BaseUIToast } from '@base-ui/react/toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info, Terminal } from 'lucide-react';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import { Button } from '@/components/ui/button';
import { globalEventBus } from '@/events/bus';
import type { ToastVariant } from './toast.types';
import type { ToastManagerData } from './useToast';

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
  toast: ReturnType<typeof BaseUIToast.useToastManager>['toasts'][number];
}

/**
 * Individual toast component with animations and interactions.
 */
export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(({ toast, variant }, ref) => {
  const shouldReduceMotion = useReducedMotion();
  const toastData = toast.data as ToastManagerData | undefined;
  const toastVariant = variant ?? ((toast.type ?? 'info') as ToastVariant);
  const Icon = variantIcons[toastVariant];
  const useMotion = process.env.NODE_ENV !== 'test';
  const MotionContainer = useMotion ? motion.div : 'div';
  const motionProps = useMotion
    ? {
        layout: true,
        variants: shouldReduceMotion === true ? reducedMotionVariants : toastMotionVariants,
        initial: 'initial',
        animate: 'animate',
      }
    : {};

  // Handle "View Console" click for error toasts
  const handleViewConsole = (): void => {
    globalEventBus.emit(
      'panel.console-requested',
      { correlationId: toastData?.correlationId },
      'Toast'
    );
  };

  // Determine if we should show "View Console" action
  const showConsoleAction = toastVariant === 'error' && toastData?.correlationId !== undefined;

  return (
    <BaseUIToast.Root
      ref={ref}
      toast={toast}
      swipeDirection="right"
      data-test-id={toastData?.testId ?? `toast-${toast.id}`}
      data-variant={toastVariant}
    >
      <MotionContainer {...motionProps} className={cn(toastVariants({ variant: toastVariant }))}>
        <BaseUIToast.Content className="flex w-full items-start gap-2">
          {/* Icon */}
          <Icon
            className={cn('h-4 w-4 shrink-0', iconColorClasses[toastVariant])}
            aria-hidden="true"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-1.5">
              <BaseUIToast.Title className="text-xs font-medium text-text-primary line-clamp-2" />
              {toastData !== undefined && toastData.count > 1 && (
                <span
                  className="shrink-0 text-xs text-text-muted font-normal"
                  data-test-id={`toast-count-${toast.id}`}
                >
                  (x{toastData.count})
                </span>
              )}
            </div>

            <BaseUIToast.Description className="mt-0.5 text-xs text-text-secondary line-clamp-1" />
          </div>

          {/* Action button (right side) */}
          {showConsoleAction && (
            <BaseUIToast.Action
              data-test-id={`toast-view-console-${toast.id}`}
              render={(renderProps) => (
                <Button
                  {...renderProps}
                  variant="secondary"
                  size="xs"
                  noScale
                  onClick={(event) => {
                    renderProps.onClick?.(event);
                    handleViewConsole();
                  }}
                  data-test-id={`toast-view-console-${toast.id}`}
                >
                  {renderProps.children}
                </Button>
              )}
            >
              <Terminal className="h-3 w-3" />
              Console
            </BaseUIToast.Action>
          )}

          {/* Close button */}
          <BaseUIToast.Close
            className={cn(
              'shrink-0 rounded p-0.5',
              'text-text-muted hover:text-text-primary hover:bg-bg-elevated',
              'transition-colors',
              focusRingClasses
            )}
            aria-label="Dismiss notification"
            data-test-id={`toast-close-${toast.id}`}
          >
            <X className="h-3.5 w-3.5" />
          </BaseUIToast.Close>
        </BaseUIToast.Content>
      </MotionContainer>
    </BaseUIToast.Root>
  );
});

Toast.displayName = 'Toast';
