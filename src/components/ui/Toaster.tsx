/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect, useSyncExternalStore, useCallback, useState } from 'react';
import { Toaster as SonnerToaster, toast } from 'sonner';
import { motion } from 'motion/react';
import { X, Copy, Bell } from 'lucide-react';
import { globalEventBus, type ToastEventPayload, type ToastType } from '@/events/bus';
import { usePanelStore } from '@/stores/usePanelStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

// ─────────────────────────────────────────────────────────────────────────────
// Deduplication Cache (module-level)
// ─────────────────────────────────────────────────────────────────────────────

interface DedupEntry {
  id: string;
  count: number;
  expiresAt: number;
}

/** Module-level cache for deduplication */
const dedupCache = new Map<string, DedupEntry>();

/** Window in milliseconds during which duplicate toasts are aggregated */
const DEDUPE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate deduplication key from toast content.
 * Key format: "type:message" - catches identical errors regardless of correlation ID.
 */
const getDedupKey = (type: ToastType, message: string): string => {
  return `${type}:${message}`;
};

/**
 * Clean expired entries from cache (lazy cleanup on add).
 */
const cleanExpired = (): void => {
  const now = Date.now();
  for (const [key, entry] of dedupCache) {
    if (entry.expiresAt < now) {
      dedupCache.delete(key);
    }
  }
};

/**
 * Clear the deduplication cache.
 * Exported for testing purposes.
 */
export const clearDedupCache = (): void => {
  dedupCache.clear();
};

// ─────────────────────────────────────────────────────────────────────────────
// Active Toast Tracking (module-level)
// ─────────────────────────────────────────────────────────────────────────────

/** Set of currently active toast IDs */
const activeToasts = new Set<string>();

/** Subscribers to toast count changes */
const countSubscribers = new Set<() => void>();

/** Get current active toast count */
const getActiveToastCount = (): number => activeToasts.size;

/** Subscribe to count changes (for useSyncExternalStore) */
const subscribeToCount = (callback: () => void): (() => void) => {
  countSubscribers.add(callback);
  return (): void => {
    countSubscribers.delete(callback);
  };
};

/** Notify all subscribers of count change */
const notifyCountChange = (): void => {
  for (const subscriber of countSubscribers) {
    subscriber();
  }
};

/** Track a toast as active */
const trackToast = (id: string): void => {
  activeToasts.add(id);
  notifyCountChange();
};

/** Untrack a toast (dismissed or expired) */
const untrackToast = (id: string): void => {
  activeToasts.delete(id);
  notifyCountChange();
};

/** Clear all tracked toasts */
const clearTrackedToasts = (): void => {
  activeToasts.clear();
  notifyCountChange();
};

/**
 * Hook to get the current active toast count.
 * Re-renders when count changes.
 */
export const useToastCount = (): number => {
  return useSyncExternalStore(subscribeToCount, getActiveToastCount);
};

// ─────────────────────────────────────────────────────────────────────────────
// Expand State (module-level)
// ─────────────────────────────────────────────────────────────────────────────

/** Current expand state */
let expandState = false;

/** Subscribers to expand state changes */
const expandSubscribers = new Set<() => void>();

/** Get current expand state */
const getExpandState = (): boolean => expandState;

/** Subscribe to expand changes (for useSyncExternalStore) */
const subscribeToExpand = (callback: () => void): (() => void) => {
  expandSubscribers.add(callback);
  return (): void => {
    expandSubscribers.delete(callback);
  };
};

/** Notify all expand subscribers */
const notifyExpandChange = (): void => {
  for (const subscriber of expandSubscribers) {
    subscriber();
  }
};

/** Set expand state */
export const setToastExpand = (expanded: boolean): void => {
  expandState = expanded;
  notifyExpandChange();
};

/** Toggle expand state */
export const toggleToastExpand = (): void => {
  expandState = !expandState;
  notifyExpandChange();
};

/**
 * Hook to get the current expand state.
 * Re-renders when state changes.
 */
export const useToastExpand = (): boolean => {
  return useSyncExternalStore(subscribeToExpand, getExpandState);
};

// ─────────────────────────────────────────────────────────────────────────────
// Signal Colors (design system)
// ─────────────────────────────────────────────────────────────────────────────

const signalColors: Record<ToastType, { border: string; bg: string }> = {
  error: { border: 'border-l-signal-error', bg: 'bg-signal-error/4' },
  warning: { border: 'border-l-signal-warning', bg: 'bg-signal-warning/4' },
  success: { border: 'border-l-signal-success', bg: 'bg-signal-success/4' },
  info: { border: 'border-l-accent-blue', bg: 'bg-accent-blue/4' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Error Toast Card Component
// ─────────────────────────────────────────────────────────────────────────────

interface ErrorToastCardProps {
  id: string | number;
  message: string;
  count: number;
  correlationId?: string;
  details?: string;
  testId?: string;
  onDismiss?: () => void;
}

/**
 * Custom error toast card with View Console and Copy buttons.
 * Preserves existing UX:
 * - Signal color left border
 * - Background tint
 * - View Console button → opens panel + emits panel.console-requested
 * - Copy button → copies message + details to clipboard
 * - Duplicate count badge
 */
const ErrorToastCard = ({
  id,
  message,
  count,
  correlationId,
  details,
  testId,
  onDismiss,
}: ErrorToastCardProps): React.JSX.Element => {
  const { setVisible } = usePanelStore();

  // Build full error message for copying (includes details/correlation ID)
  const fullErrorMessage = details !== undefined ? `${message}\n${details}` : message;

  // Handle "View Console" button click - open panel and switch to console tab
  const handleViewConsoleClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setVisible(true);
    // Emit event to switch to console tab (MainLayout will listen)
    globalEventBus.emit('panel.console-requested', { correlationId });
  };

  // Handle copy button click
  const handleCopyClick = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(fullErrorMessage);
    } catch (error) {
      console.error('Failed to copy error message:', error);
    }
  };

  // Handle dismiss
  const handleDismiss = (e: React.MouseEvent): void => {
    e.stopPropagation();
    toast.dismiss(id);
    onDismiss?.();
  };

  return (
    <div
      role="status"
      aria-live="assertive"
      data-test-id={testId}
      className={cn(
        'relative rounded-[8px] border border-l-2 p-[12px] overflow-hidden w-[356px]',
        'shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px]',
        'bg-bg-raised border-border-default text-text-primary',
        signalColors.error.border
      )}
    >
      {/* Background tint overlay */}
      <div className={cn('absolute inset-0 pointer-events-none', signalColors.error.bg)} />

      {/* Header: Title + Close button */}
      <div className="relative flex items-start justify-between gap-3 mb-2">
        <span className="text-sm font-medium leading-normal text-text-primary flex-1 pr-8 line-clamp-3">
          {message}
          {count > 1 && <span className="ml-2 text-xs text-text-muted">(×{count})</span>}
        </span>
        <button
          onClick={handleDismiss}
          data-test-id={correlationId === 'memory-warning' ? 'memory-warning-dismiss' : undefined}
          className="shrink-0 rounded p-1.5 hover:bg-bg-raised/50 transition-colors text-text-muted hover:text-text-secondary z-10"
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>

      {/* Actions: View Console button + Copy button */}
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
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Standard Toast Card Component
// ─────────────────────────────────────────────────────────────────────────────

interface StandardToastCardProps {
  id: string | number;
  type: ToastType;
  message: string;
  count: number;
  testId?: string;
}

/**
 * Standard toast card for non-error types (warning, success, info).
 */
const StandardToastCard = ({
  id,
  type,
  message,
  count,
  testId,
}: StandardToastCardProps): React.JSX.Element => {
  const handleDismiss = (e: React.MouseEvent): void => {
    e.stopPropagation();
    toast.dismiss(id);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      data-test-id={testId}
      className={cn(
        'relative rounded-[8px] border border-l-2 p-[12px] overflow-hidden w-[356px]',
        'shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px]',
        'bg-bg-raised border-border-default text-text-primary',
        signalColors[type].border
      )}
    >
      {/* Background tint overlay */}
      <div className={cn('absolute inset-0 pointer-events-none', signalColors[type].bg)} />

      {/* Header: Title + Close button */}
      <div className="relative flex items-start justify-between gap-3">
        <span className="text-sm font-medium leading-normal text-text-primary flex-1 pr-8 line-clamp-3">
          {message}
          {count > 1 && <span className="ml-2 text-xs text-text-muted">(×{count})</span>}
        </span>
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded p-1.5 hover:bg-bg-raised/50 transition-colors text-text-muted hover:text-text-secondary z-10"
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// showToast Function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Show a toast notification with deduplication.
 *
 * @param payload - Toast event payload
 * @param options - Additional options (onDismiss callback)
 */
export const showToast = (
  payload: ToastEventPayload,
  options?: { onDismiss?: () => void }
): void => {
  const { type, message, details, correlationId, duration, testId } = payload;
  const { onDismiss } = options ?? {};

  cleanExpired();

  const dedupKey = getDedupKey(type, message);
  const existing = dedupCache.get(dedupKey);
  let toastId: string;
  let count: number;

  if (existing !== undefined && existing.expiresAt > Date.now()) {
    // Duplicate found - increment count and update existing toast
    count = existing.count + 1;
    toastId = existing.id;
    dedupCache.set(dedupKey, {
      id: toastId,
      count,
      expiresAt: Date.now() + DEDUPE_WINDOW_MS,
    });
    // Dismiss old and show updated
    toast.dismiss(toastId);
  } else {
    // New toast
    count = 1;
    toastId = `toast-${String(Date.now())}-${Math.random().toString(36).slice(2, 11)}`;
    dedupCache.set(dedupKey, {
      id: toastId,
      count,
      expiresAt: Date.now() + DEDUPE_WINDOW_MS,
    });
  }

  // Track toast as active
  trackToast(toastId);

  if (type === 'error') {
    toast.custom(
      () => (
        <ErrorToastCard
          id={toastId}
          message={message}
          count={count}
          correlationId={correlationId}
          details={details}
          testId={testId}
          onDismiss={onDismiss}
        />
      ),
      {
        id: toastId,
        duration: Infinity,
        onDismiss: () => {
          // Remove from tracking and dedup cache when dismissed
          untrackToast(toastId);
          dedupCache.delete(dedupKey);
          onDismiss?.();
        },
      }
    );
  } else {
    toast.custom(
      () => (
        <StandardToastCard
          id={toastId}
          type={type}
          message={message}
          count={count}
          testId={testId}
        />
      ),
      {
        id: toastId,
        duration: duration ?? 5000,
        onDismiss: () => {
          // Remove from tracking and dedup cache when dismissed
          untrackToast(toastId);
          dedupCache.delete(dedupKey);
        },
      }
    );
  }
};

/**
 * Clear all toasts.
 */
export const clearToasts = (): void => {
  toast.dismiss();
  clearDedupCache();
  clearTrackedToasts();
};

// ─────────────────────────────────────────────────────────────────────────────
// Toast Event Bridge
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bridge component that listens to toast.show events and triggers toasts.
 */
const ToastEventBridge = (): null => {
  useEffect(() => {
    const unsubscribe = globalEventBus.on<ToastEventPayload>('toast.show', (event) => {
      showToast(event.payload);
    });

    return unsubscribe;
  }, []);

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// ToastBell Component
// ─────────────────────────────────────────────────────────────────────────────

// Shake animation for empty bell (matches BadgeCount pattern)
const bellShakeAnimation = {
  x: [0, -2, 2, -2, 2, -2, 2, 0],
};

const bellShakeTransition = {
  duration: 0.4,
  ease: 'easeInOut' as const,
};

/**
 * Bell icon button that shows toast count badge and toggles Sonner expand.
 * Used in StatusBar to provide quick access to toasts.
 * Shakes when clicked with no active toasts to provide feedback.
 */
export const ToastBell: React.FC = () => {
  const count = useToastCount();
  const expanded = useToastExpand();
  const [shakeKey, setShakeKey] = useState(0);

  const handleClick = useCallback(() => {
    if (count === 0) {
      // Trigger shake animation by incrementing key
      setShakeKey((k) => k + 1);
    } else {
      toggleToastExpand();
    }
  }, [count]);

  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={handleClick}
      className={cn('gap-1.5 relative', expanded && 'bg-bg-raised text-text-primary')}
      data-testid="toast-bell-button"
      aria-label={count > 0 ? `Notifications (${String(count)} active)` : 'Notifications'}
      aria-expanded={expanded}
    >
      <motion.div
        key={shakeKey}
        animate={shakeKey > 0 ? bellShakeAnimation : undefined}
        transition={bellShakeTransition}
        className="flex items-center justify-center w-2"
      >
        <Bell className="w-3 h-3" />
      </motion.div>
      {/* Active toast badge */}
      {count > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full bg-signal-error text-white text-[9px] font-medium flex items-center justify-center px-1"
          data-testid="toast-bell-badge"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Toaster Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Toaster component that renders Sonner toast container and event bridge.
 * Should be mounted once at the app root.
 */
export const Toaster = (): React.JSX.Element => {
  const expanded = useToastExpand();

  return (
    <>
      <ToastEventBridge />
      <SonnerToaster
        position="bottom-right"
        offset={56}
        gap={10}
        visibleToasts={3}
        expand={expanded}
        toastOptions={{
          unstyled: true,
        }}
        // Custom container styles
        style={{
          // Ensure high z-index
          zIndex: 2147483647,
        }}
      />
    </>
  );
};
