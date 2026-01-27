/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { cn } from '@/utils/cn';

export interface NotificationTrayFooterProps {
  /** Footer content */
  children: React.ReactNode;
  /** Optional test ID */
  'data-testid'?: string;
}

/**
 * NotificationTray footer component matching NotificationTrayHeader style.
 *
 * Layout:
 * - Same padding and border styling as header
 * - Content can be flex/grid as needed
 *
 * All items are aligned center (same height).
 */
export const NotificationTrayFooter: React.FC<NotificationTrayFooterProps> = ({
  children,
  'data-testid': testId = 'notification-tray-footer',
}) => {
  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_auto_auto] items-center gap-2 px-2.5 py-1.5',
        'border-t border-border-subtle'
      )}
      data-testid={testId}
    >
      {children}
    </div>
  );
};
