import { create } from 'zustand';

/**
 * Notification type for status bar display.
 */
export type NotificationType = 'error' | 'warning' | 'info' | 'success';

/**
 * Notification displayed in the status bar.
 */
export interface Notification {
  /** Unique identifier for the notification */
  id: string;
  /** Type of notification (determines styling) */
  type: NotificationType;
  /** Notification message */
  message: string;
  /** Optional detailed description (shown on hover or click) */
  details?: string;
  /** Timestamp when notification was created */
  timestamp: number;
  /** Optional correlation ID for error tracing */
  correlationId?: string;
}

interface NotificationState {
  /** Current active notifications */
  notifications: Notification[];

  /** Maximum number of notifications to show (default: 1 for status bar) */
  maxNotifications: number;

  // Actions
  /** Show a new notification */
  show: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  /** Dismiss a notification by ID */
  dismiss: (id: string) => void;
  /** Clear all notifications */
  clear: () => void;
}

/**
 * Zustand store for managing status bar notifications.
 *
 * Provides a clean way to display errors, warnings, and info messages
 * in the status bar (like Cursor/VS Code) instead of inline panels.
 */
export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  maxNotifications: 1, // Status bar typically shows one notification at a time

  show: (notification): void => {
    const id = `notification-${String(Date.now())}-${Math.random().toString(36).slice(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
    };

    set((state) => {
      // If maxNotifications is 1, replace existing notification
      // Otherwise, add to array and trim to maxNotifications
      const notifications =
        state.maxNotifications === 1
          ? [newNotification]
          : [...state.notifications, newNotification].slice(-state.maxNotifications);

      return { notifications };
    });
  },

  dismiss: (id): void => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clear: (): void => {
    set({ notifications: [] });
  },
}));
