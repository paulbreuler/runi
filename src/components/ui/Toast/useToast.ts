/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { create } from 'zustand';
import { globalEventBus, type ToastEventPayload } from '@/events/bus';
import {
  type ToastData,
  type ToastVariant,
  type ToastOptions,
  DEFAULT_DURATIONS,
  DEDUPLICATION_WINDOW_MS,
} from './toast.types';

/**
 * Generate a unique ID for a toast.
 */
const generateId = (): string => {
  return `toast-${String(Date.now())}-${Math.random().toString(36).slice(2, 9)}`;
};

/**
 * Generate a deduplication key from variant, message, and details.
 */
const getDeduplicationKey = (variant: ToastVariant, message: string, details?: string): string => {
  return `${variant}|${message}|${details ?? ''}`;
};

/**
 * Toast store state interface.
 */
interface ToastState {
  /** Map of toast ID to toast data */
  toasts: Map<string, ToastData>;
  /** Map of deduplication key to toast ID (for quick lookup) */
  deduplicationMap: Map<string, string>;

  // Actions
  /** Add a new toast or increment existing toast's count */
  addToast: (variant: ToastVariant, options: ToastOptions) => string;
  /** Remove a toast by ID */
  removeToast: (id: string) => void;
  /** Remove all toasts */
  clearAll: () => void;
  /** Get all toasts as an array (sorted by createdAt desc) */
  getToasts: () => ToastData[];
  /** Get count of active toasts */
  getCount: () => number;
}

/**
 * Zustand store for toast notifications.
 */
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: new Map(),
  deduplicationMap: new Map(),

  addToast: (variant: ToastVariant, options: ToastOptions): string => {
    const now = Date.now();
    const dedupeKey = getDeduplicationKey(variant, options.message, options.details);

    // Check for existing toast within deduplication window
    const existingId = get().deduplicationMap.get(dedupeKey);
    if (existingId !== undefined) {
      const existingToast = get().toasts.get(existingId);
      if (existingToast !== undefined && now - existingToast.createdAt < DEDUPLICATION_WINDOW_MS) {
        // Update existing toast's count and timestamp
        set((state) => {
          const newToasts = new Map(state.toasts);
          const toast = newToasts.get(existingId);
          if (toast !== undefined) {
            newToasts.set(existingId, {
              ...toast,
              count: toast.count + 1,
              lastUpdatedAt: now,
            });
          }
          return { toasts: newToasts };
        });
        return existingId;
      }
    }

    // Create new toast
    const id = generateId();
    const duration = options.duration ?? DEFAULT_DURATIONS[variant];

    const newToast: ToastData = {
      id,
      variant,
      message: options.message,
      details: options.details,
      correlationId: options.correlationId,
      duration,
      testId: options.testId,
      createdAt: now,
      count: 1,
      lastUpdatedAt: now,
    };

    set((state) => {
      const newToasts = new Map(state.toasts);
      newToasts.set(id, newToast);

      const newDedupeMap = new Map(state.deduplicationMap);
      newDedupeMap.set(dedupeKey, id);

      return {
        toasts: newToasts,
        deduplicationMap: newDedupeMap,
      };
    });

    return id;
  },

  removeToast: (id: string): void => {
    set((state) => {
      const toast = state.toasts.get(id);
      if (toast === undefined) {
        return state;
      }

      const newToasts = new Map(state.toasts);
      newToasts.delete(id);

      // Remove from deduplication map
      const dedupeKey = getDeduplicationKey(toast.variant, toast.message, toast.details);
      const newDedupeMap = new Map(state.deduplicationMap);
      if (newDedupeMap.get(dedupeKey) === id) {
        newDedupeMap.delete(dedupeKey);
      }

      return {
        toasts: newToasts,
        deduplicationMap: newDedupeMap,
      };
    });
  },

  clearAll: (): void => {
    set({
      toasts: new Map(),
      deduplicationMap: new Map(),
    });
  },

  getToasts: (): ToastData[] => {
    return Array.from(get().toasts.values()).sort((a, b) => b.createdAt - a.createdAt);
  },

  getCount: (): number => {
    return get().toasts.size;
  },
}));

/**
 * Hook to get the count of active toasts.
 * Useful for the notification bell badge.
 */
export const useToastCount = (): number => {
  return useToastStore((state) => state.toasts.size);
};

/**
 * Public toast API for imperative toast creation.
 *
 * @example
 * ```tsx
 * import { toast } from '@/components/ui/Toast';
 *
 * toast.success({ message: 'Request sent successfully' });
 * toast.error({ message: 'Request failed', details: 'Network error' });
 * toast.warning({ message: 'Rate limit approaching' });
 * toast.info({ message: 'New version available' });
 * ```
 */
export const toast = {
  /**
   * Show a success toast.
   * Auto-dismisses after 3 seconds.
   */
  success: (options: ToastOptions): string => {
    return useToastStore.getState().addToast('success', options);
  },

  /**
   * Show an error toast.
   * Does NOT auto-dismiss - requires manual dismissal.
   */
  error: (options: ToastOptions): string => {
    return useToastStore.getState().addToast('error', options);
  },

  /**
   * Show a warning toast.
   * Auto-dismisses after 5 seconds.
   */
  warning: (options: ToastOptions): string => {
    return useToastStore.getState().addToast('warning', options);
  },

  /**
   * Show an info toast.
   * Auto-dismisses after 4 seconds.
   */
  info: (options: ToastOptions): string => {
    return useToastStore.getState().addToast('info', options);
  },

  /**
   * Dismiss a specific toast.
   */
  dismiss: (id: string): void => {
    useToastStore.getState().removeToast(id);
  },

  /**
   * Dismiss all toasts.
   */
  dismissAll: (): void => {
    useToastStore.getState().clearAll();
  },
};

/**
 * Set up the event bus bridge to listen for toast.show events.
 * Call this once when the ToastProvider mounts.
 *
 * @returns Cleanup function to unsubscribe
 */
export const setupToastEventBridge = (): (() => void) => {
  const unsubscribe = globalEventBus.on<ToastEventPayload>('toast.show', (event) => {
    const { type, message, details, correlationId, duration, testId } = event.payload;

    // Map event type to variant (they're the same values)
    const variant: ToastVariant = type;

    useToastStore.getState().addToast(variant, {
      message,
      details,
      correlationId,
      duration,
      testId,
    });
  });

  return unsubscribe;
};
