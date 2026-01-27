/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { Bell, X, Trash2, CheckCheck } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';
import { Button } from '@/components/ui/button';
import { useNotificationStore, type NotificationEntry } from '@/stores/useNotificationStore';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import type { ToastType } from '@/events/bus';

/**
 * Signal colors matching the toast design system.
 */
const signalColors: Record<ToastType, { border: string; bg: string; text: string }> = {
  error: { border: 'border-l-signal-error', bg: 'bg-signal-error/4', text: 'text-signal-error' },
  warning: {
    border: 'border-l-signal-warning',
    bg: 'bg-signal-warning/4',
    text: 'text-signal-warning',
  },
  success: {
    border: 'border-l-signal-success',
    bg: 'bg-signal-success/4',
    text: 'text-signal-success',
  },
  info: { border: 'border-l-accent-blue', bg: 'bg-accent-blue/4', text: 'text-accent-blue' },
};

/**
 * Format timestamp to relative time (e.g., "2m ago", "1h ago").
 */
const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return 'just now';
  }
  if (minutes < 60) {
    return `${String(minutes)}m ago`;
  }
  if (hours < 24) {
    return `${String(hours)}h ago`;
  }
  return `${String(days)}d ago`;
};

/**
 * Individual notification item in the list.
 */
const NotificationItem: React.FC<{
  notification: NotificationEntry;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
}> = ({ notification, onMarkAsRead, onRemove }) => {
  const { type } = notification;
  const colors = signalColors[type];

  const handleClick = (): void => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative border-l-2 p-3 cursor-pointer transition-colors',
        'hover:bg-bg-elevated/50',
        colors.border,
        !notification.read && colors.bg
      )}
      data-test-id="notification-item"
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent-blue" />
      )}

      {/* Type badge + time */}
      <div className="flex items-center justify-between mb-1">
        <span className={cn('text-[10px] font-medium uppercase tracking-wide', colors.text)}>
          {notification.type}
        </span>
        <span className="text-[10px] text-text-muted">
          {formatRelativeTime(notification.timestamp)}
        </span>
      </div>

      {/* Message */}
      <p className="text-sm text-text-primary line-clamp-2 pr-6">{notification.message}</p>

      {/* Details (if any) */}
      {notification.details !== undefined && (
        <p className="text-xs text-text-muted mt-1 line-clamp-1">{notification.details}</p>
      )}

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(notification.id);
        }}
        className={cn(
          'absolute bottom-3 right-3 p-1 rounded opacity-0 group-hover:opacity-100',
          'hover:bg-bg-raised/50 text-text-muted hover:text-text-secondary transition-all',
          focusRingClasses
        )}
        aria-label="Remove notification"
      >
        <X size={12} />
      </button>
    </div>
  );
};

/**
 * NotificationCenter component.
 * Displays a bell icon with badge showing unread count,
 * and a popover with notification history.
 */
export const NotificationCenter: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } =
    useNotificationStore();
  const [isOpen, setIsOpen] = React.useState(false);

  // Mark all as read when opening
  const handleOpenChange = (open: boolean): void => {
    setIsOpen(open);
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          className={cn('gap-1.5 relative', isOpen && 'bg-bg-raised text-text-primary')}
          data-testid="notification-center-button"
          aria-label={`Notifications${unreadCount > 0 ? ` (${String(unreadCount)} unread)` : ''}`}
        >
          <Bell className="w-3 h-3" />
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full bg-signal-error text-white text-[9px] font-medium flex items-center justify-center px-1"
              data-testid="notification-unread-badge"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        sideOffset={8}
        className="w-[320px] p-0"
        data-testid="notification-center-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle">
          <span className="text-sm font-medium text-text-primary">Notifications</span>
          <div className="flex items-center gap-1">
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className={cn(
                  'p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-bg-raised transition-colors',
                  focusRingClasses
                )}
                aria-label="Mark all as read"
                title="Mark all as read"
              >
                <CheckCheck size={14} />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className={cn(
                  'p-1.5 rounded text-text-muted hover:text-signal-error hover:bg-bg-raised transition-colors',
                  focusRingClasses
                )}
                aria-label="Clear all notifications"
                title="Clear all"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Notification list */}
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-sm">No notifications</div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onRemove={removeNotification}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
