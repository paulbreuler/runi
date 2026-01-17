import React, { useMemo } from 'react';
import { getCurrentWindow, type Window } from '@tauri-apps/api/window';
import { Minimize2, Maximize2, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { isMacSync } from '@/utils/platform';

// Width of macOS traffic light controls: gap-2 (8px) + px-4 padding (32px) + 3 buttons @ w-3 (36px) = 76px
// Using 72px to match visual balance with title bar content
const MACOS_CONTROLS_WIDTH = 72;

const TitleBarControls = (): React.JSX.Element => {
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

  if (isMacSync()) {
    // macOS window controls (colored circles on the left)
    // Using design tokens: signal-error (red), signal-warning (yellow), signal-success (green)
    return (
      <div className="flex items-center gap-2 px-4 h-full">
        <button
          type="button"
          onClick={handleClose}
          className="w-3 h-3 rounded-full bg-signal-error hover:bg-signal-error/80 transition-colors border border-signal-error/50"
          aria-label="Close window"
          data-testid="titlebar-close"
        />
        <button
          type="button"
          onClick={handleMinimize}
          className="w-3 h-3 rounded-full bg-signal-warning hover:bg-signal-warning/80 transition-colors border border-signal-warning/50"
          aria-label="Minimize window"
          data-testid="titlebar-minimize"
        />
        <button
          type="button"
          onClick={handleMaximize}
          className="w-3 h-3 rounded-full bg-signal-success hover:bg-signal-success/80 transition-colors border border-signal-success/50"
          aria-label="Maximize window"
          data-testid="titlebar-maximize"
        />
      </div>
    );
  }

  // Windows/Linux window controls (on the right)
  return (
    <div className="flex items-center h-full">
      <button
        type="button"
        onClick={handleMinimize}
        className="h-full px-4 hover:bg-bg-raised/50 transition-colors"
        aria-label="Minimize window"
        data-testid="titlebar-minimize"
      >
        <Minimize2 size={14} className="text-text-muted" />
      </button>
      <button
        type="button"
        onClick={handleMaximize}
        className="h-full px-4 hover:bg-bg-raised/50 transition-colors"
        aria-label="Maximize window"
        data-testid="titlebar-maximize"
      >
        <Maximize2 size={14} className="text-text-muted" />
      </button>
      <button
        type="button"
        onClick={handleClose}
        className="h-full px-4 hover:bg-signal-error/20 hover:text-signal-error transition-colors"
        aria-label="Close window"
        data-testid="titlebar-close"
      >
        <X size={14} className="text-text-muted" />
      </button>
    </div>
  );
};

interface TitleBarProps {
  title?: string;
  children?: React.ReactNode;
}

export const TitleBar = ({ title = 'Runi', children }: TitleBarProps): React.JSX.Element => {
  const isMac = isMacSync();

  return (
    <div
      className={cn(
        'h-8 border-b border-border-subtle bg-bg-surface flex items-center justify-between',
        'text-xs text-text-secondary select-none',
        !isMac && 'pl-4' // Add left padding on Windows/Linux where controls are on right
      )}
      data-testid="titlebar"
      data-tauri-drag-region
    >
      {isMac ? (
        <>
          <TitleBarControls />
          <div className="flex-1 flex items-center justify-center" data-tauri-drag-region>
            {children ?? <span className="font-medium">{title}</span>}
          </div>
          <div style={{ width: `${MACOS_CONTROLS_WIDTH.toString()}px` }} />{' '}
          {/* Spacer to balance macOS controls */}
        </>
      ) : (
        <>
          <div className="flex-1 flex items-center" data-tauri-drag-region>
            {children ?? <span className="font-medium">{title}</span>}
          </div>
          <TitleBarControls />
        </>
      )}
    </div>
  );
};
