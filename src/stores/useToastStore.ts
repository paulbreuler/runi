import { create } from 'zustand';

/**
 * Toast notification type.
 */
export type ToastType = 'error' | 'warning' | 'info' | 'success';

/**
 * Toast notification item.
 */
export interface ToastItem {
  /** Unique identifier for the toast */
  id: string;
  /** Type of toast (determines styling) */
  type: ToastType;
  /** Toast message */
  message: string;
  /** Optional detailed description (shown on hover or in expanded view) */
  details?: string;
  /** Timestamp when toast was created */
  timestamp: number;
  /** Optional correlation ID for error tracing */
  correlationId?: string;
  /** Auto-dismiss duration in milliseconds (default: 5000ms, errors: never) */
  duration?: number;
  /** Number of duplicate occurrences (default: 1) */
  count: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Deduplication Cache (module-level to avoid Zustand serialization)
// ─────────────────────────────────────────────────────────────────────────────

interface DedupEntry {
  toastId: string;
  expiresAt: number;
}

/** Module-level cache for deduplication (outside store to avoid serialization) */
const dedupCache = new Map<string, DedupEntry>();

/** Window in milliseconds during which duplicate toasts are aggregated */
const DEDUPE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/** Maximum cache entries to prevent memory leaks */
const MAX_CACHE_SIZE = 200;

/**
 * Generate deduplication key from toast content.
 * Key format: "type:message" - catches identical errors regardless of correlation ID.
 */
const getDedupKey = (toast: { message: string; type: ToastType }): string => {
  return `${toast.type}:${toast.message}`;
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

interface ToastState {
  /** Current active toasts */
  toasts: ToastItem[];

  /** Maximum number of toasts to show (default: 3) */
  maxNotifications: number;

  // Actions
  /** Enqueue a new toast notification */
  enqueue: (toast: Omit<ToastItem, 'id' | 'timestamp' | 'count'>) => void;
  /** Dismiss a toast by ID */
  dismiss: (id: string) => void;
  /** Clear all toasts */
  clear: () => void;
}

/**
 * Zustand store for managing toast notifications.
 *
 * Provides a global API for showing transient toast notifications
 * using Radix Toast + Motion animations.
 */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  maxNotifications: 3,

  enqueue: (toast): void => {
    cleanExpired();

    const dedupKey = getDedupKey(toast);
    const existing = dedupCache.get(dedupKey);

    if (existing !== undefined && existing.expiresAt > Date.now()) {
      // Duplicate found - increment count on existing toast
      set((state) => ({
        toasts: state.toasts.map((t) =>
          t.id === existing.toastId ? { ...t, count: t.count + 1, timestamp: Date.now() } : t
        ),
      }));
      // Refresh expiration
      dedupCache.set(dedupKey, {
        toastId: existing.toastId,
        expiresAt: Date.now() + DEDUPE_WINDOW_MS,
      });
      return;
    }

    // New toast - create and cache
    const id = `toast-${String(Date.now())}-${Math.random().toString(36).slice(2, 11)}`;
    const newToast: ToastItem = {
      ...toast,
      id,
      timestamp: Date.now(),
      count: 1,
      // Default duration: 5000ms for non-error toasts, never for errors
      duration: toast.duration ?? (toast.type === 'error' ? undefined : 5000),
    };

    // Add to cache (with LRU eviction if needed)
    if (dedupCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = dedupCache.keys().next().value;
      if (oldestKey !== undefined) {
        dedupCache.delete(oldestKey);
      }
    }
    dedupCache.set(dedupKey, {
      toastId: id,
      expiresAt: Date.now() + DEDUPE_WINDOW_MS,
    });

    set((state) => {
      // Add to array and trim to maxNotifications (keep newest)
      const updatedToasts = [...state.toasts, newToast].slice(-state.maxNotifications);

      return { toasts: updatedToasts };
    });
  },

  dismiss: (id): void => {
    // Remove from dedupe cache when toast is dismissed
    for (const [key, entry] of dedupCache) {
      if (entry.toastId === id) {
        dedupCache.delete(key);
        break;
      }
    }
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clear: (): void => {
    // Clear dedup cache to avoid stale entries referencing non-existent toasts
    clearDedupCache();
    set({ toasts: [] });
  },
}));
