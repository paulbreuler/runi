import React, { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, Copy } from 'lucide-react';
import { useToastStore, type ToastItem, type ToastType } from '@/stores/useToastStore';
import { usePanelStore } from '@/stores/usePanelStore';
import { globalEventBus, type ToastEventPayload } from '@/events/bus';
import { cn } from '@/utils/cn';

/**
 * Get signal color for left border accent (strategic color pattern).
 * Returns base signal color for 2px left border accent.
 */
const getSignalColor = (type: ToastType): string => {
  switch (type) {
    case 'error':
      return 'border-l-signal-error';
    case 'warning':
      return 'border-l-signal-warning';
    case 'success':
      return 'border-l-signal-success';
    case 'info':
      return 'border-l-accent-blue';
  }
};

/**
 * Get background tint overlay color (subtle emphasis).
 * Returns bg opacity class for overlay div.
 */
const getSignalBgTint = (type: ToastType): string => {
  switch (type) {
    case 'error':
      return 'bg-signal-error/4';
    case 'warning':
      return 'bg-signal-warning/4';
    case 'success':
      return 'bg-signal-success/4';
    case 'info':
      return 'bg-accent-blue/4';
  }
};

/**
 * Get base toast styling (background, border, text).
 * Errors use readable styling (dark surface, not red on red).
 */
const getBaseToastStyles = (type: ToastType): string => {
  switch (type) {
    case 'error':
      // Readable error styling - dark surface with neutral border (left border is accent)
      return 'bg-bg-raised border-border-default text-text-primary';
    case 'warning':
      return 'bg-bg-raised border-border-default text-text-primary';
    case 'success':
      return 'bg-bg-raised border-border-default text-text-primary';
    case 'info':
      return 'bg-bg-raised border-border-default text-text-primary';
  }
};

/**
 * Spring animation configuration for toast transitions.
 * Stiffer spring (400) for snappier, more intentional motion per design ideology.
 */
const toastSpring = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
  mass: 1,
};

/**
 * ToastProvider component that wraps the Radix Toast.Provider.
 * Should be mounted once at the app root.
 * Subscribes to 'toast.show' events for loose coupling.
 */
export const ToastProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  const { enqueue } = useToastStore();

  // Subscribe to toast.show events for event-driven toast notifications
  useEffect(() => {
    const unsubscribe = globalEventBus.on<ToastEventPayload>('toast.show', (event) => {
      enqueue(event.payload);
    });

    return unsubscribe;
  }, [enqueue]);

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {children}
      <Toast />
    </ToastPrimitive.Provider>
  );
};

/**
 * Individual ToastItem component that renders a single toast.
 * Uses the correct Radix + Motion pattern: Toast.Root with asChild and forceMount.
 */
const ToastItem = ({ toast }: { toast: ToastItem }): React.JSX.Element => {
  const { dismiss } = useToastStore();
  const { setVisible } = usePanelStore();
  const prefersReducedMotion = useReducedMotion();

  const transition = prefersReducedMotion === true ? { duration: 0 } : toastSpring;

  // Build full error message for copying (includes details/correlation ID)
  const fullErrorMessage =
    toast.details !== undefined ? `${toast.message}\n${toast.details}` : toast.message;

  // Handle "View Console" button click - open panel and switch to console tab
  const handleViewConsoleClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setVisible(true);
    // Emit event to switch to console tab (MainLayout will listen)
    globalEventBus.emit('panel.console-requested', { correlationId: toast.correlationId });
  };

  // Handle copy button click
  const handleCopyClick = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(fullErrorMessage);
      // Optionally show a brief success feedback (could be another toast)
    } catch (error) {
      console.error('Failed to copy error message:', error);
    }
  };

  return (
    <ToastPrimitive.Root
      key={toast.id}
      duration={toast.duration ?? Infinity}
      open
      onOpenChange={(open): void => {
        if (!open) {
          dismiss(toast.id);
        }
      }}
      asChild
      forceMount
    >
      <motion.div
        role="status"
        aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
        className={cn(
          'relative rounded-[8px] border border-l-2 p-[12px] overflow-hidden',
          'shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px]',
          getBaseToastStyles(toast.type),
          getSignalColor(toast.type)
        )}
        initial={prefersReducedMotion === true ? false : { opacity: 0, x: 20, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={prefersReducedMotion === true ? {} : { opacity: 0, scale: 0.96 }}
        transition={transition}
        drag="x"
        dragElastic={0.1}
        dragConstraints={{ left: 0 }}
        onDragEnd={(_, info): void => {
          if (info.offset.x > 100) {
            dismiss(toast.id);
          }
        }}
      >
        {/* Background tint overlay - subtle emphasis without overwhelming */}
        <div className={cn('absolute inset-0 pointer-events-none', getSignalBgTint(toast.type))} />

        {/* Header: Title + Close button */}
        <div className="relative flex items-start justify-between gap-3 mb-2">
          <ToastPrimitive.Title className="text-[15px] font-medium leading-normal text-text-primary flex-1 pr-8 line-clamp-3">
            {toast.message}
            {toast.count > 1 && (
              <span className="ml-2 text-xs text-text-muted">(×{toast.count})</span>
            )}
          </ToastPrimitive.Title>
          <ToastPrimitive.Close asChild>
            <button
              onClick={(e): void => {
                e.stopPropagation();
                dismiss(toast.id);
              }}
              className="shrink-0 rounded p-1.5 hover:bg-bg-raised/50 transition-colors text-text-muted hover:text-text-secondary z-10"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </ToastPrimitive.Close>
        </div>

        {/* Actions: View Console button + Copy button (errors only) */}
        {toast.type === 'error' && (
          <div className="relative flex items-center gap-2 mt-3">
            <button
              onClick={handleViewConsoleClick}
              className="rounded-[6px] px-[12px] py-[6px] text-[12px] font-medium transition-colors bg-signal-error text-white hover:brightness-110"
              aria-label="View console"
            >
              View Console
            </button>
            <button
              onClick={handleCopyClick}
              className="rounded-[6px] px-[10px] py-[6px] text-[12px] transition-colors bg-transparent border border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-raised/50"
              aria-label="Copy error message"
            >
              <Copy size={14} />
            </button>
          </div>
        )}
      </motion.div>
    </ToastPrimitive.Root>
  );
};

/**
 * Toast component that renders toasts from the store.
 * Uses AnimatePresence to wrap Toast.Root elements (correct Radix + Motion pattern).
 * Handles auto-dismiss and animations.
 */
export const Toast = (): React.JSX.Element => {
  const { toasts, dismiss } = useToastStore();

  // Auto-dismiss toasts based on their duration
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    toasts.forEach((toast) => {
      // Only auto-dismiss non-error toasts with a duration
      if (toast.type !== 'error' && toast.duration !== undefined) {
        const timer = setTimeout(() => {
          dismiss(toast.id);
        }, toast.duration);

        timers.push(timer);
      }
    });

    return (): void => {
      timers.forEach((timer): void => {
        clearTimeout(timer);
      });
    };
  }, [toasts, dismiss]);

  return (
    <>
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
      <ToastPrimitive.Viewport
        className="fixed bottom-[56px] right-0 z-9999 flex flex-col gap-[10px] p-[25px] w-[390px] max-w-[100vw] m-0 list-none outline-none"
        style={{
          zIndex: 2147483647,
        }}
        data-testid="toast-viewport"
      />
    </>
  );
};
