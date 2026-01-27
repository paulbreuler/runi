/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { create } from 'zustand';
import type { ToastType } from '@/events/bus';

/**
 * A notification entry stored in the notification center.
 */
export interface NotificationEntry {
  /** Unique identifier */
  id: string;
  /** Notification type */
  type: ToastType;
  /** Main message */
  message: string;
  /** Optional details */
  details?: string;
  /** Optional correlation ID for linking to console logs */
  correlationId?: string;
  /** Timestamp when notification was created */
  timestamp: number;
  /** Whether the notification has been read/seen */
  read: boolean;
}

interface NotificationState {
  /** List of notifications, newest first */
  notifications: NotificationEntry[];
  /** Count of unread notifications */
  unreadCount: number;

  /** Add a new notification */
  addNotification: (notification: Omit<NotificationEntry, 'id' | 'timestamp' | 'read'>) => void;
  /** Mark a notification as read */
  markAsRead: (id: string) => void;
  /** Mark all notifications as read */
  markAllAsRead: () => void;
  /** Remove a notification */
  removeNotification: (id: string) => void;
  /** Clear all notifications */
  clearAll: () => void;
}

/** Maximum notifications to keep */
const MAX_NOTIFICATIONS = 50;

/** Generate a unique ID */
const generateId = (): string =>
  `notif-${String(Date.now())}-${Math.random().toString(36).slice(2, 9)}`;

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification): void => {
    set((state) => {
      const newNotification: NotificationEntry = {
        ...notification,
        id: generateId(),
        timestamp: Date.now(),
        read: false,
      };

      // Add to front, keep max limit
      const notifications = [newNotification, ...state.notifications].slice(0, MAX_NOTIFICATIONS);
      const unreadCount = notifications.filter((n) => !n.read).length;

      return { notifications, unreadCount };
    });
  },

  markAsRead: (id): void => {
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      const unreadCount = notifications.filter((n) => !n.read).length;
      return { notifications, unreadCount };
    });
  },

  markAllAsRead: (): void => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  removeNotification: (id): void => {
    set((state) => {
      const notifications = state.notifications.filter((n) => n.id !== id);
      const unreadCount = notifications.filter((n) => !n.read).length;
      return { notifications, unreadCount };
    });
  },

  clearAll: (): void => {
    set({ notifications: [], unreadCount: 0 });
  },
}));
