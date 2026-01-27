/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { useMemoryWarning } from '@/hooks/useMemoryWarning';
import { getConsoleService } from '@/services/console-service';
import { showToast } from '@/components/ui/Toaster';

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

  useEffect(() => {
    // Only set up listener in Tauri environment
    if (typeof window === 'undefined' || !('__TAURI__' in (window as { __TAURI__?: unknown }))) {
      return;
    }

    let unlistenFn: UnlistenFn | null = null;
    let isMounted = true;

    const setupListener = async (): Promise<void> => {
      try {
        // Listen for memory threshold exceeded events
        const fn = await listen<{
          current: number;
          threshold: number;
          thresholdPercent: number;
          totalRamGb: number;
        }>('memory:threshold-exceeded', (event) => {
          // Only process events if component is still mounted
          if (!isMounted) {
            return;
          }

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
            // Use showToast directly with onDismiss callback for dismiss tracking
            showToast(
              {
                type: 'warning',
                message: 'High Memory Usage Detected',
                details: `runi is using ${current.toFixed(1)}MB of RAM (threshold: ${threshold.toFixed(1)}MB). This may impact performance on systems with limited RAM.`,
                duration: 10000, // Show for 10 seconds
                correlationId: 'memory-warning', // Identify as memory warning toast
                testId: 'memory-warning-toast', // Test ID for testing
              },
              {
                onDismiss: dismiss, // Call dismiss when toast is closed
              }
            );
          }
        });

        // Only store unlistenFn if component is still mounted
        if (isMounted) {
          unlistenFn = fn;
        } else {
          // Component unmounted before listener was set up, clean up immediately
          fn();
        }
      } catch (_error) {
        // Silently fail - memory monitoring is optional and non-critical
        // Don't log errors to avoid interfering with E2E tests and console output
        // The error typically occurs when Tauri is not fully available (e.g., in E2E test environments)
        // No action needed - the app continues to function without memory monitoring
      }
    };

    void setupListener();

    // Cleanup function
    return (): void => {
      isMounted = false;
      if (unlistenFn !== null) {
        unlistenFn();
      }
    };
  }, [isDismissed, dismiss]);

  return (
    <div data-test-id="memory-warning-listener" style={{ display: 'none' }}>
      {/* Hidden component - only listens to events */}
    </div>
  );
};
