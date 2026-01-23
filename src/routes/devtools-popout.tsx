/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect, useCallback } from 'react';
import { NetworkHistoryPanel } from '@/components/History/NetworkHistoryPanel';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { usePanelStore } from '@/stores/usePanelStore';
import { generateCurlCommand } from '@/utils/curl';
import type { NetworkHistoryEntry } from '@/types/history';

/**
 * DevTools popout window route.
 *
 * This component is rendered in a separate window when the user
 * pops out the DevTools panel.
 */
export const DevToolsPopout = (): React.JSX.Element => {
  const { entries, loadHistory } = useHistoryStore();
  const { setPopout } = usePanelStore();

  // Mark as popout on mount, clear on unmount
  useEffect(() => {
    setPopout(true);
    void loadHistory();

    return (): void => {
      setPopout(false);
    };
  }, [setPopout, loadHistory]);

  // Handle replay - communicate back to main window via Tauri events
  // In popout mode, we can't directly interact with the main window's request builder
  // Cross-window communication could be added via Tauri events in the future
  const handleReplay = useCallback((_entry: NetworkHistoryEntry): void => {
    // Placeholder - will be implemented via Tauri events when cross-window
    // communication is added
  }, []);

  // Handle copy as cURL
  const handleCopyCurl = useCallback(async (entry: NetworkHistoryEntry): Promise<void> => {
    const curl = generateCurlCommand(entry);
    await navigator.clipboard.writeText(curl);
  }, []);

  return (
    <div className="h-screen w-full bg-bg-app flex flex-col">
      <div className="h-8 border-b border-border-default bg-bg-surface flex items-center px-3">
        <span className="text-sm font-medium text-text-primary">Network History</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <NetworkHistoryPanel
          entries={entries}
          onReplay={handleReplay}
          onCopyCurl={handleCopyCurl}
        />
      </div>
    </div>
  );
};
