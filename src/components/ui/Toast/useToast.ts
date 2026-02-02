/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { globalEventBus, type ToastEventPayload } from '@/events/bus';
import { Toast as BaseUIToast } from '@base-ui/react/toast';
import {
  type ToastVariant,
  type ToastOptions,
  DEFAULT_DURATIONS,
  DEDUPLICATION_WINDOW_MS,
} from './toast.types';

/**
 * Generate a deduplication key from variant, message, and details.
 */
const getDeduplicationKey = (variant: ToastVariant, message: string, details?: string): string => {
  return `${variant}|${message}|${details ?? ''}`;
};

export interface ToastManagerData {
  testId?: string;
  correlationId?: string;
  count: number;
  dedupeKey: string;
  lastUpdatedAt: number;
}

export const toastManager = BaseUIToast.createToastManager();
const deduplicationMap = new Map<string, { id: string; count: number; lastUpdatedAt: number }>();
const activeToastIds = new Set<string>();

const removeDedupeEntry = (dedupeKey: string): void => {
  deduplicationMap.delete(dedupeKey);
};

const updateToast = (
  id: string,
  variant: ToastVariant,
  options: ToastOptions,
  data: ToastManagerData
): void => {
  const duration = options.duration ?? DEFAULT_DURATIONS[variant];
  toastManager.update(id, {
    type: variant,
    title: options.message,
    description: options.details,
    timeout: Number.isFinite(duration) ? duration : 0,
    data,
    onRemove: () => {
      removeDedupeEntry(data.dedupeKey);
      activeToastIds.delete(id);
    },
  });
};

const addToast = (variant: ToastVariant, options: ToastOptions): string => {
  const now = Date.now();
  const dedupeKey = getDeduplicationKey(variant, options.message, options.details);
  const existing = deduplicationMap.get(dedupeKey);

  if (existing !== undefined && now - existing.lastUpdatedAt < DEDUPLICATION_WINDOW_MS) {
    const nextCount = existing.count + 1;
    deduplicationMap.set(dedupeKey, { ...existing, count: nextCount, lastUpdatedAt: now });
    updateToast(existing.id, variant, options, {
      testId: options.testId,
      correlationId: options.correlationId,
      count: nextCount,
      dedupeKey,
      lastUpdatedAt: now,
    });
    return existing.id;
  }

  const duration = options.duration ?? DEFAULT_DURATIONS[variant];
  const id = toastManager.add({
    type: variant,
    title: options.message,
    description: options.details,
    timeout: Number.isFinite(duration) ? duration : 0,
    data: {
      testId: options.testId,
      correlationId: options.correlationId,
      count: 1,
      dedupeKey,
      lastUpdatedAt: now,
    },
    onRemove: () => {
      removeDedupeEntry(dedupeKey);
      activeToastIds.delete(id);
    },
  });

  deduplicationMap.set(dedupeKey, { id, count: 1, lastUpdatedAt: now });
  activeToastIds.add(id);
  return id;
};

/**
 * Hook to get the count of active toasts.
 * Useful for the notification bell badge.
 */
export const useToastCount = (): number => {
  return BaseUIToast.useToastManager().toasts.length;
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
    return addToast('success', options);
  },

  /**
   * Show an error toast.
   * Does NOT auto-dismiss - requires manual dismissal.
   */
  error: (options: ToastOptions): string => {
    return addToast('error', options);
  },

  /**
   * Show a warning toast.
   * Auto-dismisses after 5 seconds.
   */
  warning: (options: ToastOptions): string => {
    return addToast('warning', options);
  },

  /**
   * Show an info toast.
   * Auto-dismisses after 4 seconds.
   */
  info: (options: ToastOptions): string => {
    return addToast('info', options);
  },

  /**
   * Dismiss a specific toast.
   */
  dismiss: (id: string): void => {
    toastManager.close(id);
    activeToastIds.delete(id);
  },

  /**
   * Dismiss all toasts.
   */
  dismissAll: (): void => {
    activeToastIds.forEach((id) => {
      toastManager.close(id);
    });
    activeToastIds.clear();
    deduplicationMap.clear();
  },
};

/**
 * Event bus bridge handler function.
 * Extracted to allow testing and reuse.
 */
const handleToastEvent = (event: { payload: ToastEventPayload }): void => {
  const { type, message, details, correlationId, duration, testId } = event.payload;

  // Map event type to variant (they're the same values)
  const variant: ToastVariant = type;

  addToast(variant, {
    message,
    details,
    correlationId,
    duration,
    testId,
  });
};

/**
 * Track if event bridge is already set up to prevent duplicate listeners.
 */
let eventBridgeSetup = false;

/**
 * Store the cleanup function for the event bridge.
 * Used internally for proper cleanup in tests.
 */
let eventBridgeCleanup: (() => void) | null = null;

/**
 * Set up the event bus bridge to listen for toast.show events.
 * Safe to call multiple times - only sets up once.
 *
 * @returns Cleanup function to unsubscribe
 */
/** No-op cleanup function for when bridge is already set up */
const noopCleanup = (): void => {
  // No-op: bridge already set up, cleanup handled by original setup
};

export const setupToastEventBridge = (): (() => void) => {
  if (eventBridgeSetup) {
    // Already set up, return the existing cleanup function or no-op
    return eventBridgeCleanup ?? noopCleanup;
  }

  eventBridgeSetup = true;
  const unsubscribe = globalEventBus.on<ToastEventPayload>('toast.show', handleToastEvent);

  const cleanup = (): void => {
    unsubscribe();
    eventBridgeSetup = false;
    eventBridgeCleanup = null;
  };

  eventBridgeCleanup = cleanup;

  return cleanup;
};

/**
 * Reset the event bridge state for testing purposes.
 * This allows tests to properly clean up and re-initialize the bridge.
 *
 * @internal Only for use in tests
 */
export const __resetEventBridgeForTesting = (): void => {
  if (eventBridgeCleanup !== null) {
    eventBridgeCleanup();
  }
  eventBridgeSetup = false;
  eventBridgeCleanup = null;
  activeToastIds.clear();
  deduplicationMap.clear();
};

/**
 * Initialize the event bridge immediately at module load time.
 * This ensures toast events are captured even before React renders.
 *
 * Note: In test environments, the mock may not be ready yet, so we
 * wrap this in a try-catch. The bridge can be manually set up in tests.
 */
try {
  setupToastEventBridge();
} catch {
  // Initialization may fail in test environments where mocks aren't ready.
  // Tests should call setupToastEventBridge() after setting up mocks.
}
