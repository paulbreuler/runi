/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useMemo, useEffect, useState } from 'react';
import { getCurrentWindow, type Window } from '@tauri-apps/api/window';
import { Minimize2, Maximize2, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { isMacSync } from '@/utils/platform';

// macOS native traffic light controls are positioned at trafficLightPosition (x: 20, y: 20)
// Add padding to prevent content from overlapping native controls
const MACOS_TRAFFIC_LIGHT_OFFSET = 80; // Matches trafficLightPosition x:20 + native button width

const TitleBarControls = (): React.JSX.Element | null => {
  // Cache window instance to avoid repeated getCurrentWindow() calls
  const appWindow = useMemo<Window | null>(() => {
    try {
      return getCurrentWindow();
    } catch {
      // Not in Tauri context
      return null;
    }
  }, []);

  const handleMinimize = async (): Promise<void> => {
    if (appWindow === null) {
      return;
    }
    try {
      await appWindow.minimize();
    } catch {
      // Ignore errors
    }
  };

  const handleMaximize = async (): Promise<void> => {
    if (appWindow === null) {
      return;
    }
    try {
      const isMaximized = await appWindow.isMaximized();
      if (isMaximized) {
        await appWindow.unmaximize();
      } else {
        await appWindow.maximize();
      }
    } catch {
      // Ignore errors
    }
  };

  const handleClose = async (): Promise<void> => {
    if (appWindow === null) {
      return;
    }
    try {
      await appWindow.close();
    } catch {
      // Ignore errors
    }
  };

  // Track window focus state (must be before early return to follow Rules of Hooks)
  const [isFocused, setIsFocused] = useState(true);

  useEffect(() => {
    if (appWindow === null) {
      return;
    }

    const handleFocus = (): void => {
      setIsFocused(true);
    };

    const handleBlur = (): void => {
      setIsFocused(false);
    };

    // Listen to window focus/blur events using Tauri v2 event system
    let cleanupFocus: (() => void) | undefined;
    let cleanupBlur: (() => void) | undefined;

    void appWindow
      .listen('tauri://focus', handleFocus)
      .then((unsubscribe: () => void) => {
        cleanupFocus = unsubscribe;
      })
      .catch(() => {
        // Fallback to window focus event if Tauri event unavailable
        window.addEventListener('focus', handleFocus);
        cleanupFocus = (): void => {
          window.removeEventListener('focus', handleFocus);
        };
      });

    void appWindow
      .listen('tauri://blur', handleBlur)
      .then((unsubscribe: () => void) => {
        cleanupBlur = unsubscribe;
      })
      .catch(() => {
        // Fallback to window blur event if Tauri event unavailable
        window.addEventListener('blur', handleBlur);
        cleanupBlur = (): void => {
          window.removeEventListener('blur', handleBlur);
        };
      });

    return (): void => {
      // Cleanup listeners
      cleanupFocus?.();
      cleanupBlur?.();
    };
  }, [appWindow]);

  // macOS uses native traffic light controls (from titleBarStyle: Overlay)
  // Only render custom controls for Windows/Linux
  if (isMacSync()) {
    return null;
  }

  // Windows/Linux window controls (on the right)
  // Button size: ~30px to match native Windows titlebar buttons
  return (
    <div className={cn('flex items-center h-full gap-0', !isFocused && 'opacity-60')}>
      <button
        type="button"
        onClick={handleMinimize}
        className="w-[30px] h-[30px] flex items-center justify-center hover:bg-bg-raised/50 transition-colors"
        aria-label="Minimize window"
        data-testid="titlebar-minimize"
      >
        <Minimize2 size={12} className="text-text-muted" />
      </button>
      <button
        type="button"
        onClick={handleMaximize}
        className="w-[30px] h-[30px] flex items-center justify-center hover:bg-bg-raised/50 transition-colors"
        aria-label="Maximize window"
        data-testid="titlebar-maximize"
      >
        <Maximize2 size={12} className="text-text-muted" />
      </button>
      <button
        type="button"
        onClick={handleClose}
        className="w-[30px] h-[30px] flex items-center justify-center hover:bg-signal-error/20 hover:text-signal-error transition-colors"
        aria-label="Close window"
        data-testid="titlebar-close"
      >
        <X size={12} className="text-text-muted" />
      </button>
    </div>
  );
};

interface TitleBarProps {
  title?: string;
  children?: React.ReactNode;
}

export const TitleBar = ({ title = 'runi', children }: TitleBarProps): React.JSX.Element => {
  const isMac = isMacSync();

  return (
    <div
      className={cn(
        // Height matches VS Code title bar (~32px) with overlay style
        'h-8 border-b border-border-subtle bg-bg-surface/80 backdrop-blur-sm flex items-center relative',
        'text-xs text-text-secondary select-none',
        // Windows/Linux: Controls on right, so add left padding
        !isMac && 'pl-4'
      )}
      style={isMac ? { paddingLeft: `${MACOS_TRAFFIC_LIGHT_OFFSET.toString()}px` } : undefined}
      data-testid="titlebar"
      data-tauri-drag-region
    >
      {/* Title/content area - centered and draggable on all platforms */}
      <div
        className="absolute left-1/2 top-0 h-full flex items-center -translate-x-1/2"
        data-tauri-drag-region
      >
        {children ?? <span className="font-medium">{title}</span>}
      </div>

      {/* Custom controls - only on Windows/Linux (macOS uses native traffic lights) */}
      <div className="ml-auto">
        <TitleBarControls />
      </div>
    </div>
  );
};
