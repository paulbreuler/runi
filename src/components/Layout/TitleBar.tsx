/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useMemo } from 'react';
import { getCurrentWindow, type Window } from '@tauri-apps/api/window';
import { Minimize2, Maximize2, Settings, X } from 'lucide-react';
import { globalEventBus, type ToastEventPayload } from '@/events/bus';
import { focusRingClasses } from '@/utils/accessibility';
import { useWindowFocus } from '@/hooks/useWindowFocus';
import { cn } from '@/utils/cn';
import { isMacSync } from '@/utils/platform';

interface TitleBarControlsProps {
  isMac: boolean;
  isFocused: boolean;
}

const TitleBarControls = ({ isMac, isFocused }: TitleBarControlsProps): React.JSX.Element => {
  // Cache window instance to avoid repeated getCurrentWindow() calls
  const appWindow = useMemo<Window | null>(() => {
    try {
      return getCurrentWindow();
    } catch {
      // Not in Tauri context
      return null;
    }
  }, []);

  const emitWindowControlError = (message: string, error: unknown): void => {
    globalEventBus.emit<ToastEventPayload>('toast.show', {
      type: 'error',
      message,
      details: error instanceof Error ? error.message : String(error),
    });
  };

  const handleMinimize = async (): Promise<void> => {
    if (appWindow === null) {
      return;
    }
    try {
      await appWindow.minimize();
    } catch (error) {
      emitWindowControlError('Failed to minimize window', error);
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
    } catch (error) {
      emitWindowControlError('Failed to maximize window', error);
    }
  };

  const handleClose = async (): Promise<void> => {
    if (appWindow === null) {
      return;
    }
    try {
      await appWindow.close();
    } catch (error) {
      emitWindowControlError('Failed to close window', error);
    }
  };

  if (isMac) {
    if (appWindow === null) {
      return <div className="ml-2 h-full w-[58px]" data-tauri-drag-region />;
    }

    const runMacControlAction = async (action: () => Promise<void>): Promise<void> => {
      // Standard window controls are always available, even when the window isn't active.
      // We perform the action immediately and ensure the window is focused.
      if (!isFocused) {
        try {
          await appWindow.setFocus();
        } catch (_error) {
          // Ignore focus errors during action execution
        }
      }
      await action();
    };

    return (
      <div className="group ml-2 flex h-full items-center gap-2">
        <button
          type="button"
          onClick={() => {
            void runMacControlAction(handleClose);
          }}
          className={cn(
            focusRingClasses,
            'flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-colors',
            isFocused
              ? 'border-black/10 bg-[#FF5F56] hover:brightness-90'
              : 'border-black/5 bg-[#4D4D4D]/20 group-hover:border-black/10 group-hover:bg-[#FF5F56] group-hover:hover:brightness-90'
          )}
          aria-label="Close window"
          data-test-id="titlebar-close"
        >
          <svg
            width="6"
            height="6"
            viewBox="0 0 6 6"
            fill="none"
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            <path
              d="M1.17188 1.17188L4.82812 4.82812"
              stroke="black"
              strokeOpacity="0.8"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M4.82812 1.17188L1.17188 4.82812"
              stroke="black"
              strokeOpacity="0.8"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => {
            void runMacControlAction(handleMinimize);
          }}
          className={cn(
            focusRingClasses,
            'flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-colors',
            isFocused
              ? 'border-black/10 bg-[#FFBD2E] hover:brightness-90'
              : 'border-black/5 bg-[#4D4D4D]/20 group-hover:border-black/10 group-hover:bg-[#FFBD2E] group-hover:hover:brightness-90'
          )}
          aria-label="Minimize window"
          data-test-id="titlebar-minimize"
        >
          <svg
            width="6"
            height="1"
            viewBox="0 0 6 1"
            fill="none"
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            <path
              d="M0 0.5H6"
              stroke="black"
              strokeOpacity="0.8"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => {
            void runMacControlAction(handleMaximize);
          }}
          className={cn(
            focusRingClasses,
            'flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-colors',
            isFocused
              ? 'border-black/10 bg-[#27C93F] hover:brightness-90'
              : 'border-black/5 bg-[#4D4D4D]/20 group-hover:border-black/10 group-hover:bg-[#27C93F] group-hover:hover:brightness-90'
          )}
          aria-label="Maximize window"
          data-test-id="titlebar-maximize"
        >
          <svg
            width="6"
            height="6"
            viewBox="0 0 6 6"
            fill="none"
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            <path
              d="M3.5 1H5V2.5"
              stroke="black"
              strokeOpacity="0.8"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2.5 5H1V3.5"
              stroke="black"
              strokeOpacity="0.8"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
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
  /** Optional action buttons to display in the right utility rail */
  actionButtons?: React.ReactNode;
}

export const TitleBar = ({
  title = 'runi',
  children,
  onSettingsClick,
  actionButtons,
}: TitleBarProps): React.JSX.Element => {
  const isMac = isMacSync();
  const isFocused = useWindowFocus();
  const showSettingsButton = onSettingsClick !== undefined;
  const hasCustomContent = React.Children.toArray(children).length > 0;
  const showRightActions = showSettingsButton || !isMac || actionButtons !== undefined;

  return (
    <div
      className={cn(
        'border-b border-border-subtle bg-bg-surface flex items-center gap-2',
        'text-xs text-text-secondary select-none px-2 transition-colors duration-200',
        hasCustomContent ? 'h-12' : 'h-7'
      )}
      data-test-id="titlebar"
      data-tauri-drag-region
    >
      {isMac && <TitleBarControls isMac isFocused={isFocused} />}

      {/* Keep explicit drag handle visible even with custom header content */}
      <div className="h-full w-4 shrink-0" data-tauri-drag-region />

      <div
        className={cn('flex-1 min-w-0 flex items-center', !hasCustomContent && 'justify-center')}
      >
        {hasCustomContent ? (
          <div className="flex h-full w-full min-w-0 items-center">{children}</div>
        ) : (
          <span className="font-medium" data-tauri-drag-region data-test-id="titlebar-title">
            {title}
          </span>
        )}
      </div>

      {hasCustomContent && <div className="h-full w-1 shrink-0" data-tauri-drag-region />}

      {/* Right utility rail */}
      {showRightActions && (
        <div
          className="ml-auto flex h-full items-center gap-1 pl-1 pr-0.5"
          data-test-id="titlebar-utilities"
        >
          {actionButtons}
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
          {!isMac && <TitleBarControls isMac={false} isFocused={isFocused} />}
        </div>
      )}
    </div>
  );
};
