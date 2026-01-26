/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { cn } from '@/utils/cn';

export interface NotificationTrayContentProps {
  /** Content children */
  children: React.ReactNode;
  /** Optional test ID */
  'data-testid'?: string;
}

/**
 * NotificationTray content container component.
 *
 * Simple wrapper with padding only (no grid layout).
 * Used for metrics grid, notifications list, or any notification tray content.
 */
export const NotificationTrayContent: React.FC<NotificationTrayContentProps> = ({
  children,
  'data-testid': testId = 'notification-tray-content',
}) => {
  return (
    <div className={cn('p-2.5')} data-testid={testId}>
      {children}
    </div>
  );
};
