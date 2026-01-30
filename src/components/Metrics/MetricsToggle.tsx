/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { cn } from '@/utils/cn';

export interface MetricsToggleProps {
  /** Whether toggle is checked */
  checked: boolean;
  /** Callback when toggle changes */
  onChange: (checked: boolean) => void;
  /** Toggle label */
  label: string;
  /** Optional test ID */
  'data-test-id'?: string;
}

/**
 * Metrics toggle component that pairs Label with Switch.
 *
 * Prevents tray close when toggled (stopPropagation handled by Switch).
 * Used within NotificationTrayHeader actions, not in content.
 */
export const MetricsToggle: React.FC<MetricsToggleProps> = ({
  checked,
  onChange,
  label,
  'data-test-id': testId = 'metrics-toggle',
}) => {
  const toggleId = `${testId}-toggle`;

  return (
    <div className={cn('flex items-center')} data-test-id={testId}>
      {label !== '' ? (
        <Label
          htmlFor={toggleId}
          onClick={(e): void => {
            e.stopPropagation();
            onChange(!checked);
          }}
        >
          {label}
        </Label>
      ) : null}
      <Switch
        id={toggleId}
        checked={checked}
        onCheckedChange={onChange}
        data-test-id="switch"
        aria-label={label !== '' ? label : 'Toggle metrics'}
      />
    </div>
  );
};
