import React, { useMemo } from 'react';
import { getCurrentWindow, type Window } from '@tauri-apps/api/window';
import { Minimize2, Maximize2, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { isMacSync } from '@/utils/platform';

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

  // macOS uses native traffic light controls (from titleBarStyle: Overlay)
  // Only render custom controls for Windows/Linux
  if (isMacSync()) {
    return null;
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
        // Height matches macOS title bar (~28px) with overlay style
        'h-7 border-b border-border-subtle bg-bg-surface/80 backdrop-blur-sm flex items-center justify-between',
        'text-xs text-text-secondary select-none',
        // macOS: Native traffic lights at x:20, so add left padding
        // Windows/Linux: Controls on right, so add left padding
        isMac ? 'pl-[80px]' : 'pl-4'
      )}
      data-testid="titlebar"
      data-tauri-drag-region
    >
      {/* Title/content area - draggable on all platforms */}
      <div className="flex-1 flex items-center" data-tauri-drag-region>
        {children ?? <span className="font-medium">{title}</span>}
      </div>

      {/* Custom controls - only on Windows/Linux (macOS uses native traffic lights) */}
      <TitleBarControls />
    </div>
  );
};
