/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { initializeConsoleService, getConsoleService } from '@/services/console-service';
// Import Toast module early to ensure event bridge is set up before any components can emit events
import '@/components/ui/Toast/useToast';
import { App } from './App';
import './app.css';

// Initialize console service BEFORE React mounts
// This ensures all logs are captured, including those before React initialization
initializeConsoleService();

// In development, set minimum log level to 'debug' to see all logs
// In production, default is 'info' (only shows info, warn, error)
const isDev = (import.meta as { env?: { DEV?: boolean } }).env?.DEV ?? false;
if (isDev) {
  getConsoleService().setMinLogLevel('debug');
}

// Note: Dark mode class is managed by ThemeProvider wrapper component
// The ThemeProvider sets the appropriate theme class on its wrapper div

// Measure startup time
// Note: performance.now() is already relative to navigation start (timeOrigin).
const navigationTiming = performance.getEntriesByType('navigation')[0] as
  | PerformanceNavigationTiming
  | undefined;
const getNavigationTime = (value: number | undefined): number =>
  typeof value === 'number' && value > 0 ? value : performance.now();
let processStartupTime = 0; // Time from process start until JS execution (measured via Tauri)
const startupTiming = {
  processStartup: 0, // Time from process start until JS execution
  domContentLoaded: 0,
  windowLoaded: 0,
  reactMounted: 0,
  total: 0, // Total from process start to React mount
};

// Track DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    startupTiming.domContentLoaded = getNavigationTime(navigationTiming?.domContentLoadedEventEnd);
  });
} else {
  startupTiming.domContentLoaded = getNavigationTime(navigationTiming?.domContentLoadedEventEnd);
}

// Track window load
if (document.readyState !== 'complete') {
  window.addEventListener('load', () => {
    startupTiming.windowLoaded = getNavigationTime(navigationTiming?.loadEventEnd);
  });
} else {
  startupTiming.windowLoaded = getNavigationTime(navigationTiming?.loadEventEnd);
}

const rootElement = document.getElementById('root');
if (rootElement !== null) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Track React mount (after first render)
  requestAnimationFrame(() => {
    void (async (): Promise<void> => {
      const frontendStartupTime = performance.now();
      startupTiming.reactMounted = frontendStartupTime;

      // Get process startup time from Rust (time from process start until JS execution)
      if (typeof window !== 'undefined' && '__TAURI__' in (window as { __TAURI__?: unknown })) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          processStartupTime = await invoke<number>('get_process_startup_time');
          startupTiming.processStartup = processStartupTime;
        } catch {
          // If we can't get process startup time, use 0 (frontend-only measurement)
          startupTiming.processStartup = 0;
        }
      }

      // Total time = process startup + frontend startup
      startupTiming.total = processStartupTime + frontendStartupTime;

      // Log startup timing (only in development or when '?measure-startup' is present in the URL)
      if (isDev || window.location.search.includes('measure-startup')) {
        // eslint-disable-next-line no-console
        console.log('🚀 Startup Timing', {
          buildMode: isDev ? 'dev' : 'release',
          totalMs: Number(startupTiming.total.toFixed(2)),
          processMs: processStartupTime > 0 ? Number(processStartupTime.toFixed(2)) : 'N/A',
          frontendMs: Number(frontendStartupTime.toFixed(2)),
          domContentLoadedMs: Number(startupTiming.domContentLoaded.toFixed(2)),
          windowLoadMs: Number(startupTiming.windowLoaded.toFixed(2)),
          reactMountedMs: Number(startupTiming.reactMounted.toFixed(2)),
        });
      }

      // Write startup timing to file (always in production, for basestate.io metrics)
      if (typeof window !== 'undefined' && '__TAURI__' in (window as { __TAURI__?: unknown })) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');

          // Get system specs from Rust (includes CPU model, RAM, architecture, build mode, platform)
          let systemSpecs;
          try {
            systemSpecs = await invoke<{
              cpuModel: string;
              cpuCores: number;
              totalMemoryGb: number;
              platform: string;
              architecture: string;
              buildMode: string;
              bundleSizeMb: number;
            }>('get_system_specs');
          } catch {
            // Fallback if system specs can't be retrieved
            const userAgentData = (
              navigator as { userAgentData?: { platform?: string; architecture?: string } }
            ).userAgentData;
            let architecture = 'unknown';
            if (userAgentData !== undefined) {
              const arch = userAgentData.architecture;
              if (typeof arch === 'string' && arch.length > 0) {
                architecture = arch;
              }
            }
            if (architecture === 'unknown') {
              const ua = navigator.userAgent.toLowerCase();
              if (ua.includes('arm') || ua.includes('aarch64')) {
                architecture = 'arm64';
              } else if (ua.includes('x64') || ua.includes('x86_64')) {
                architecture = 'x64';
              } else if (ua.includes('x86') || ua.includes('ia32')) {
                architecture = 'x86';
              }
            }
            const hardwareConcurrency = navigator.hardwareConcurrency;
            // Get platform info (always use Tauri command in Tauri environment)
            let platform = 'unknown';
            try {
              const tauriPlatform = await invoke<string>('get_platform');
              platform = tauriPlatform;
            } catch {
              // If Tauri command fails, use 'unknown' (we're in Tauri env, so this shouldn't happen)
              platform = 'unknown';
            }
            systemSpecs = {
              cpuModel: 'Unknown',
              cpuCores: hardwareConcurrency > 0 ? hardwareConcurrency : 0,
              totalMemoryGb: 0,
              platform,
              architecture,
              buildMode: isDev ? 'dev' : 'release',
              bundleSizeMb: 0,
            };
          }

          await invoke('write_startup_timing', {
            timing: {
              timestamp: new Date().toISOString(),
              platform: systemSpecs.platform,
              architecture: systemSpecs.architecture,
              buildMode: systemSpecs.buildMode,
              systemSpecs: {
                cpuModel: systemSpecs.cpuModel,
                cpuCores: systemSpecs.cpuCores,
                totalMemoryGb: systemSpecs.totalMemoryGb,
                platform: systemSpecs.platform,
                architecture: systemSpecs.architecture,
                buildMode: systemSpecs.buildMode,
                bundleSizeMb: systemSpecs.bundleSizeMb,
              },
              timing: {
                processStartup: startupTiming.processStartup,
                domContentLoaded: startupTiming.domContentLoaded,
                windowLoaded: startupTiming.windowLoaded,
                reactMounted: startupTiming.reactMounted,
                total: startupTiming.total,
              },
              unit: 'ms',
            },
          });
        } catch (error) {
          // Silently fail - don't break the app if file write fails
          if (isDev) {
            console.warn('Failed to write startup timing:', error);
          }
        }
      }
    })();
  });
}
