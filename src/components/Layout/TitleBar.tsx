import React, { useMemo } from 'react';
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

export const TitleBar = ({ title = 'runi', children }: TitleBarProps): React.JSX.Element => {
  const isMac = isMacSync();

  return (
    <div
      className={cn(
        // Height matches standard title bar height (~48px) with overlay style
        'h-12 border-b border-border-subtle bg-bg-surface/80 backdrop-blur-sm flex items-center relative',
        'text-sm text-text-secondary select-none',
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
