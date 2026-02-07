/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useMemo, useEffect, useState } from 'react';
import { getCurrentWindow, type Window } from '@tauri-apps/api/window';
import { Minimize2, Maximize2, Settings, X } from 'lucide-react';
import { focusRingClasses } from '@/utils/accessibility';
import { cn } from '@/utils/cn';
import { isMacSync } from '@/utils/platform';

interface TitleBarControlsProps {
  isMac: boolean;
}

const TitleBarControls = ({ isMac }: TitleBarControlsProps): React.JSX.Element => {
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

  if (isMac) {
    return (
      <div className={cn('ml-2 flex items-center h-full gap-1', !isFocused && 'opacity-60')}>
        <button
          type="button"
          onClick={handleClose}
          className={cn(
            focusRingClasses,
            'h-3.5 w-3.5 rounded-full border border-black/20 bg-[#ff5f57] hover:brightness-95 transition-[filter]'
          )}
          aria-label="Close window"
          data-test-id="titlebar-close"
        />
        <button
          type="button"
          onClick={handleMinimize}
          className={cn(
            focusRingClasses,
            'h-3.5 w-3.5 rounded-full border border-black/20 bg-[#febc2e] hover:brightness-95 transition-[filter]'
          )}
          aria-label="Minimize window"
          data-test-id="titlebar-minimize"
        />
        <button
          type="button"
          onClick={handleMaximize}
          className={cn(
            focusRingClasses,
            'h-3.5 w-3.5 rounded-full border border-black/20 bg-[#28c840] hover:brightness-95 transition-[filter]'
          )}
          aria-label="Maximize window"
          data-test-id="titlebar-maximize"
        />
      </div>
    );
  }

  // Windows/Linux window controls (on the right)
  // Button size: ~30px to match native Windows titlebar buttons
  return (
    <div className={cn('flex items-center h-full gap-0', !isFocused && 'opacity-60')}>
      <button
        type="button"
        onClick={handleMinimize}
        className={cn(
          focusRingClasses,
          'w-[30px] h-[30px] flex items-center justify-center hover:bg-bg-raised/50 transition-colors'
        )}
        aria-label="Minimize window"
        data-test-id="titlebar-minimize"
      >
        <Minimize2 size={12} className="text-text-muted" />
      </button>
      <button
        type="button"
        onClick={handleMaximize}
        className={cn(
          focusRingClasses,
          'w-[30px] h-[30px] flex items-center justify-center hover:bg-bg-raised/50 transition-colors'
        )}
        aria-label="Maximize window"
        data-test-id="titlebar-maximize"
      >
        <Maximize2 size={12} className="text-text-muted" />
      </button>
      <button
        type="button"
        onClick={handleClose}
        className={cn(
          focusRingClasses,
          'w-[30px] h-[30px] flex items-center justify-center hover:bg-signal-error/20 hover:text-signal-error transition-colors'
        )}
        aria-label="Close window"
        data-test-id="titlebar-close"
      >
        <X size={12} className="text-text-muted" />
      </button>
    </div>
  );
};

interface TitleBarProps {
  title?: string;
  children?: React.ReactNode;
  onSettingsClick?: () => void;
}

export const TitleBar = ({
  title = 'runi',
  children,
  onSettingsClick,
}: TitleBarProps): React.JSX.Element => {
  const isMac = isMacSync();
  const showSettingsButton = onSettingsClick !== undefined;
  const hasCustomContent = children !== undefined;

  return (
    <div
      className={cn(
        'border-b border-border-subtle bg-bg-raised/80 backdrop-blur-sm flex items-center gap-2',
        'text-xs text-text-secondary select-none px-2',
        hasCustomContent ? 'h-14' : 'h-8'
      )}
      data-test-id="titlebar"
      data-tauri-drag-region
    >
      {isMac && <TitleBarControls isMac />}

      {/* Keep explicit drag handle visible even with custom header content */}
      <div className="h-full w-4 shrink-0" data-tauri-drag-region />

      <div
        className={cn('flex-1 min-w-0 flex items-center', !hasCustomContent && 'justify-center')}
      >
        {hasCustomContent ? (
          <div className="w-full min-w-0">{children}</div>
        ) : (
          <span className="font-medium" data-tauri-drag-region>
            {title}
          </span>
        )}
      </div>

      <div className="h-full w-4 shrink-0" data-tauri-drag-region />

      {/* Right actions (all platforms) */}
      <div className="ml-auto flex items-center h-full gap-1">
        {showSettingsButton && (
          <button
            type="button"
            onClick={onSettingsClick}
            className={cn(
              focusRingClasses,
              'flex h-[34px] w-[34px] items-center justify-center hover:bg-bg-raised/50 transition-colors'
            )}
            aria-label="Open settings"
            data-test-id="titlebar-settings"
          >
            <Settings size={16} className="text-text-muted" />
          </button>
        )}
        {!isMac && <TitleBarControls isMac={false} />}
      </div>
    </div>
  );
};
