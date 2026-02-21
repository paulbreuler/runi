/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { initializeConsoleService, getConsoleService } from '@/services/console-service';
// Import Toast module early to ensure event bridge is set up before any components can emit events
import '@/components/ui/Toast/useToast';
import { createCrashReport, type FrontendCrashReport } from '@/types/errors';
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

  // Expose store state on window for dev-time inspection (e.g. devtools console, agent checks)
  void Promise.all([
    import('@/stores/useSuggestionStore'),
    import('@/stores/useProjectContextStore'),
    import('@/stores/useHistoryStore'),
  ]).then(([suggestionMod, contextMod, historyMod]) => {
    (
      window as unknown as {
        __runi_debug: {
          suggestions: () => unknown;
          context: () => unknown;
          history: () => unknown;
        };
      }
    ).__runi_debug = {
      suggestions: (): unknown => suggestionMod.useSuggestionStore.getState(),
      context: (): unknown => contextMod.useProjectContextStore.getState(),
      history: (): unknown => historyMod.useHistoryStore.getState(),
    };
  });
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
let root: ReactDOM.Root | null = null;
let hasCrashed = false;

const renderApp = (): void => {
  if (root === null || hasCrashed) {
    return;
  }
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

const logCrashReport = async (report: FrontendCrashReport): Promise<void> => {
  if (typeof window === 'undefined' || !('__TAURI__' in window)) {
    return;
  }
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const reportJson = JSON.stringify(report);
    await invoke('cmd_log_frontend_error', { reportJson });
  } catch (error) {
    if (isDev) {
      console.warn('Failed to log frontend crash report:', error);
    }
  }
};

const CrashScreen = ({ report }: { report: FrontendCrashReport }): React.JSX.Element => {
  const pickSavePath = async (): Promise<string | null> => {
    const module: unknown = await import('@tauri-apps/plugin-dialog');
    const dialogModule = module as {
      save?: (options?: {
        defaultPath?: string;
        filters?: Array<{ name: string; extensions: string[] }>;
      }) => Promise<unknown>;
    };
    if (typeof dialogModule.save !== 'function') {
      return null;
    }
    const result = await dialogModule.save({
      defaultPath: 'runi-crash-report.json',
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    return typeof result === 'string' ? result : null;
  };

  const handleSaveReport = async (): Promise<void> => {
    if (typeof window === 'undefined' || !('__TAURI__' in window)) {
      return;
    }
    const reportJson = JSON.stringify(report, null, 2);
    try {
      const path = await pickSavePath();
      if (path === null || path.length === 0) {
        return;
      }
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('cmd_write_frontend_error_report', { path, reportJson });
    } catch (error) {
      if (isDev) {
        console.warn('Failed to save crash report:', error);
      }
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-bg-app text-text-primary">
      <div className="max-w-xl rounded-lg border border-border-subtle bg-bg-surface p-6">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-text-secondary">
          runi ran into a crash. You can save a report and share it with the team for analysis.
        </p>
        <div className="mt-4 rounded-md bg-bg-raised p-3 text-xs text-text-muted">
          <div>Message: {report.message}</div>
          <div>Path: {report.pathname}</div>
          <div>Time: {report.timestamp}</div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="rounded-md bg-accent-blue px-3 py-2 text-sm text-accent-contrast"
            onClick={() => {
              void handleSaveReport();
            }}
          >
            Save report
          </button>
          <button
            type="button"
            className="rounded-md border border-border-subtle px-3 py-2 text-sm text-text-secondary"
            onClick={() => {
              window.location.reload();
            }}
          >
            Reload app
          </button>
        </div>
      </div>
    </div>
  );
};

const handleCrash = async (error: Error, componentStack?: string): Promise<void> => {
  if (hasCrashed) {
    return;
  }
  hasCrashed = true;
  const report = createCrashReport({
    message: error.message,
    stack: error.stack,
    componentStack,
    pathname: window.location.pathname,
    buildMode: isDev ? 'dev' : 'release',
  });
  await logCrashReport(report);
  if (root !== null) {
    root.render(<CrashScreen report={report} />);
  }
};

const installCrashHandlers = (): void => {
  window.addEventListener('error', (event) => {
    // ResizeObserver loop errors are benign browser warnings, not application crashes.
    // All major browsers treat them as non-fatal and they should not trigger a crash screen.
    if (event.message.includes('ResizeObserver loop')) {
      event.stopImmediatePropagation();
      return;
    }
    const error = event.error instanceof Error ? event.error : new Error(event.message);
    void handleCrash(error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason: unknown = event.reason;
    const error =
      reason instanceof Error
        ? reason
        : new Error(typeof reason === 'string' ? reason : 'Unhandled rejection');
    void handleCrash(error);
  });
};

if (rootElement !== null) {
  root = ReactDOM.createRoot(rootElement);
  installCrashHandlers();
  renderApp();

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
