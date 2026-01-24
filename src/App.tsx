/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './routes/index';
import { DevToolsPopout } from './routes/devtools-popout';
import { ToastProvider } from './components/ui/Toast';
import { globalEventBus, type ToastEventPayload } from '@/events/bus';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

/**
 * Memory monitoring listener component.
 * Listens for Tauri events about memory usage and shows alerts when threshold is exceeded.
 */
const MemoryMonitorListener = (): null => {
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
        const { current, threshold } = event.payload;

        // Show warning toast to user
        globalEventBus.emit<ToastEventPayload>('toast.show', {
          type: 'warning',
          message: 'High Memory Usage Detected',
          details: `runi is using ${current.toFixed(1)}MB of RAM (threshold: ${threshold.toFixed(1)}MB). This may impact performance on systems with limited RAM.`,
          duration: 10000, // Show for 10 seconds
        });
      });
    };

    void setupListener();

    // Cleanup function
    return (): void => {
      if (unlistenFn !== null) {
        unlistenFn();
      }
    };
  }, []);

  return null;
};

export const App = (): React.JSX.Element => {
  return (
    <ToastProvider>
      <MemoryMonitorListener />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/devtools-popout" element={<DevToolsPopout />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};
