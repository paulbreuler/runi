/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';

export interface NotificationTrayHeaderProps {
  /** Header title */
  title: string;
  /** Callback when close button is clicked */
  onClose: () => void;
  /** Optional actions to display (center/right) */
  actions?: React.ReactNode;
  /** Optional test ID */
  'data-testid'?: string;
}

/**
 * NotificationTray header component with 3-column grid layout.
 *
 * Layout:
 * - Title on left
 * - Optional actions in center/right
 * - Close button on rightmost
 *
 * All items are aligned center (same height).
 */
export const NotificationTrayHeader: React.FC<NotificationTrayHeaderProps> = ({
  title,
  onClose,
  actions,
  'data-testid': testId = 'notification-tray-header',
}) => {
  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_auto_auto] items-center gap-2 px-2.5 py-1.5',
        'border-b border-border-subtle'
      )}
      data-testid={testId}
    >
      {/* Title on left */}
      <h3 className="text-xs font-medium text-text-primary">{title}</h3>

      {/* Optional actions in center/right */}
      {actions !== undefined && <div className="flex items-center">{actions}</div>}

      {/* Close button on rightmost */}
      <button
        type="button"
        onClick={onClose}
        className={cn(
          'p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-raised transition-colors',
          focusRingClasses
        )}
        aria-label="Close notification tray"
        data-testid="notification-tray-close-button"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
