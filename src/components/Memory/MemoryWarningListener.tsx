/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { getConsoleService } from '@/services/console-service';

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
 * Listens for Tauri events about memory usage and logs warnings
 * to the console when memory threshold is exceeded.
 */
export const MemoryWarningListener: React.FC<MemoryWarningListenerProps> = () => {
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

          // Log to console
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
  }, []);

  return (
    <div data-test-id="memory-warning-listener" style={{ display: 'none' }}>
      {/* Hidden component - only listens to events */}
    </div>
  );
};
