/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Bell } from 'lucide-react';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import { useToastCount } from './useToast';

export interface ToastBellProps {
  /** Additional class name */
  className?: string;
  /** Click handler (for future notification tray) */
  onClick?: () => void;
}

/**
 * Notification bell component for the StatusBar.
 *
 * Displays a bell icon with an animated badge showing the count
 * of active toast notifications. The badge uses a red pill style
 * and shows "99+" for counts above 99.
 *
 * @example
 * ```tsx
 * <ToastBell onClick={() => openNotificationTray()} />
 * ```
 */
export const ToastBell: React.FC<ToastBellProps> = ({ className, onClick }) => {
  const count = useToastCount();
  const shouldReduceMotion = useReducedMotion();

  // Format count for display (max "99+")
  const displayCount = count > 99 ? '99+' : String(count);

  // Badge animation variants
  const badgeVariants = {
    initial: shouldReduceMotion === true ? { opacity: 0 } : { opacity: 0, scale: 0 },
    animate:
      shouldReduceMotion === true
        ? { opacity: 1, transition: { duration: 0.1 } }
        : {
            opacity: 1,
            scale: 1,
            transition: {
              type: 'spring' as const,
              stiffness: 500,
              damping: 25,
            },
          },
    exit:
      shouldReduceMotion === true
        ? { opacity: 0, transition: { duration: 0.1 } }
        : {
            opacity: 0,
            scale: 0,
            transition: { duration: 0.15 },
          },
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative p-1 rounded',
        'text-text-muted hover:text-text-primary',
        'transition-colors',
        focusRingClasses,
        className
      )}
      aria-label={
        count > 0
          ? `${String(count)} ${count === 1 ? 'notification' : 'notifications'}`
          : 'No notifications'
      }
      data-test-id="toast-bell"
    >
      <Bell className="h-3.5 w-3.5" />

      {/* Animated badge */}
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            variants={badgeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'absolute -top-1 -right-1 min-w-[16px] h-4 px-1',
              'flex items-center justify-center',
              'text-xs font-medium text-accent-contrast',
              'bg-signal-error rounded-full'
            )}
            data-test-id="toast-bell-badge"
          >
            {displayCount}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};
