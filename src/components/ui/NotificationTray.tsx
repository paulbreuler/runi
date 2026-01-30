/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { cn } from '@/utils/cn';

export interface NotificationTrayProps {
  /** Whether the notification tray is open */
  isOpen: boolean;
  /** Callback when notification tray should close */
  onClose: () => void;
  /** Ref to button for alignment (left edge aligns with button) */
  buttonRef?: React.RefObject<HTMLElement | null>;
  /** Header component (NotificationTrayHeader) */
  header: React.ReactNode;
  /** Content component (NotificationTrayContent) */
  content: React.ReactNode;
  /** Optional footer component (NotificationTrayFooter) */
  footer?: React.ReactNode;
  /** Optional test ID */
  'data-test-id'?: string;
}

/**
 * NotificationTray - Slide-up panel for notifications and system status.
 *
 * Displays:
 * - Notification history (past toasts)
 * - Active notifications with dismiss actions
 * - System status (background tasks, connection state)
 *
 * Features:
 * - Slides up from bottom (36px above status bar)
 * - Left edge aligns with trigger button
 * - No full-screen overlay (doesn't block the screen)
 * - Click outside to close (ignores interactive elements)
 * - Escape key to close
 * - Smooth enter/exit animations
 * - Respects prefers-reduced-motion
 *
 * Uses composition pattern: accepts header and content as separate props.
 * Reusable for metrics panel, notifications panel, any slide-up tray.
 */
export const NotificationTray: React.FC<NotificationTrayProps> = ({
  isOpen,
  onClose,
  buttonRef,
  header,
  content,
  footer,
  'data-test-id': testId = 'notification-tray',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [leftOffset, setLeftOffset] = useState<number>(20); // Default to px-5 (20px)

  // Calculate left offset from button ref
  useEffect(() => {
    if (buttonRef !== undefined && buttonRef.current !== null) {
      const rect = buttonRef.current.getBoundingClientRect();
      setLeftOffset(rect.left);
    } else {
      // Fallback: status bar has px-5 (20px), approximate button position
      setLeftOffset(20);
    }
  }, [buttonRef, isOpen]);

  // Click outside to close (but not when clicking on interactive elements inside)
  useClickOutside(
    panelRef,
    (event) => {
      // Don't close if clicking on a button or interactive element
      const target = event.target as HTMLElement;
      if (target.closest('button, [role="button"], input, [role="switch"]') !== null) {
        return;
      }
      onClose();
    },
    isOpen
  );

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return (): void => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Animation variants
  const contentVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const contentTransition = prefersReducedMotion
    ? { duration: 0.1 }
    : { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed bottom-[36px] z-50 pointer-events-none"
          style={{ left: `${String(leftOffset)}px` }}
          data-test-id={testId}
        >
          <motion.div
            ref={panelRef}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={contentTransition}
            className={cn(
              'bg-bg-elevated border border-border-default rounded-t-lg shadow-lg pointer-events-auto',
              'w-[320px] relative'
            )}
            data-test-id={`${testId}-panel`}
          >
            {/* Header */}
            {header}

            {/* Content */}
            {content}

            {/* Footer */}
            {footer}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
