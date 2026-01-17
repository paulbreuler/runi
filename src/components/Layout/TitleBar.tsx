import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minimize2, Maximize2, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { isMacSync } from '@/utils/platform';

const TitleBarControls = (): React.JSX.Element => {
  const handleMinimize = async (): Promise<void> => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch {
      // Ignore if not in Tauri context
    }
  };

  const handleMaximize = async (): Promise<void> => {
    try {
      const appWindow = getCurrentWindow();
      const isMaximized = await appWindow.isMaximized();
      if (isMaximized) {
        await appWindow.unmaximize();
      } else {
        await appWindow.maximize();
      }
    } catch {
      // Ignore if not in Tauri context
    }
  };

  const handleClose = async (): Promise<void> => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch {
      // Ignore if not in Tauri context
    }
  };

  if (isMacSync()) {
    // macOS window controls (colored circles on the left)
    return (
      <div className="flex items-center gap-2 px-4 h-full">
        <button
          type="button"
          onClick={handleClose}
          className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff3f36] transition-colors border border-[#e0443e]/50"
          aria-label="Close window"
          data-testid="titlebar-close"
        />
        <button
          type="button"
          onClick={handleMinimize}
          className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffa502] transition-colors border border-[#dea123]/50"
          aria-label="Minimize window"
          data-testid="titlebar-minimize"
        />
        <button
          type="button"
          onClick={handleMaximize}
          className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#1aad29] transition-colors border border-[#1aab29]/50"
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
          <div className="w-[72px]" /> {/* Spacer to balance macOS controls */}
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
