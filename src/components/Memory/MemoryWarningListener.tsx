/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect, useRef } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { globalEventBus, type ToastEventPayload } from '@/events/bus';
import { useMemoryWarning } from '@/hooks/useMemoryWarning';
import { getConsoleService } from '@/services/console-service';
import { useToastStore } from '@/stores/useToastStore';

/**
 * Props for MemoryWarningListener component.
 * No props needed - self-contained component.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MemoryWarningListenerProps {
  // No props needed - self-contained
}

/**
 * Memory warning listener component.
 *
 * Listens for Tauri events about memory usage and shows a dismissible toast
 * when memory threshold is exceeded. After dismissal, switches to console logging.
 */
export const MemoryWarningListener: React.FC<MemoryWarningListenerProps> = () => {
  const { isDismissed, dismiss } = useMemoryWarning();
  const toasts = useToastStore((state) => state.toasts);
  const previousMemoryWarningToastRef = useRef<string | null>(null);

  // Watch for memory warning toast dismissal
  useEffect(() => {
    const memoryWarningToast = toasts.find((toast) => toast.correlationId === 'memory-warning');

    // If we had a memory warning toast before and it's gone now, it was dismissed
    if (
      previousMemoryWarningToastRef.current !== null &&
      memoryWarningToast === undefined &&
      !isDismissed
    ) {
      // Toast was dismissed - call our dismiss function
      dismiss();
    }

    // Update ref for next render
    previousMemoryWarningToastRef.current = memoryWarningToast?.id ?? null;
  }, [toasts, isDismissed, dismiss]);

  useEffect(() => {
    // Only set up listener in Tauri environment
    if (typeof window === 'undefined' || !('__TAURI__' in (window as { __TAURI__?: unknown }))) {
      return;
    }

    let unlistenFn: UnlistenFn | null = null;

    const setupListener = async (): Promise<void> => {
      // Listen for memory threshold exceeded events
      unlistenFn = await listen<{
        current: number;
        threshold: number;
        thresholdPercent: number;
        totalRamGb: number;
      }>('memory:threshold-exceeded', (event) => {
        const { current, threshold, thresholdPercent, totalRamGb } = event.payload;

        if (isDismissed) {
          // After dismissal, log to console instead of showing toast
          const service = getConsoleService();
          service.addOrUpdateLog({
            id: 'memory-warning',
            level: 'warn',
            message: 'High Memory Usage Detected',
            args: [
              {
                current,
                threshold,
                thresholdPercent,
                totalRamGb,
              },
            ],
            isUpdating: true,
          });
        } else {
          // Show warning toast to user (first time only)
          globalEventBus.emit<ToastEventPayload>('toast.show', {
            type: 'warning',
            message: 'High Memory Usage Detected',
            details: `runi is using ${current.toFixed(1)}MB of RAM (threshold: ${threshold.toFixed(1)}MB). This may impact performance on systems with limited RAM.`,
            duration: 10000, // Show for 10 seconds
            correlationId: 'memory-warning', // Identify as memory warning toast
            testId: 'memory-warning-toast', // Test ID for testing
          });
        }
      });
    };

    void setupListener();

    // Cleanup function
    return (): void => {
      if (unlistenFn !== null) {
        unlistenFn();
      }
    };
  }, [isDismissed]);

  return (
    <div data-test-id="memory-warning-listener" style={{ display: 'none' }}>
      {/* Hidden component - only listens to events */}
    </div>
  );
};
