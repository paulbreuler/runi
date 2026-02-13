/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';
export type SidebarEdge = 'left' | 'right' | 'bottom';

interface SettingsState {
  sidebarVisible: boolean;
  sidebarEdge: SidebarEdge;
  logLevel: LogLevel;
  metricsVisible: boolean;
  /** When true, auto-focus AI-created/modified items in the UI. */
  followAiMode: boolean;
  /** Ratio of sidebar height allocated to Open Items (0.1–0.9, default 0.35). */
  openItemsRatio: number;
  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;
  setSidebarEdge: (edge: SidebarEdge) => void;
  setLogLevel: (level: LogLevel) => Promise<void>;
  toggleMetrics: () => void;
  setMetricsVisible: (visible: boolean) => void;
  toggleFollowAiMode: () => void;
  setFollowAiMode: (enabled: boolean) => void;
  setOpenItemsRatio: (ratio: number) => void;
}

interface RuniE2EConfig {
  sidebarVisible?: boolean;
}

const getInitialSidebarVisible = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  const config = (window as { __RUNI_E2E__?: RuniE2EConfig }).__RUNI_E2E__;
  if (config?.sidebarVisible !== undefined) {
    return config.sidebarVisible;
  }
  return true; // Default to open
};

export const useSettingsStore = create<SettingsState>((set) => ({
  sidebarVisible: getInitialSidebarVisible(), // Default visible now that collections are supported
  sidebarEdge: 'left',
  logLevel: 'info',
  metricsVisible: false, // Default hidden to save space
  followAiMode: true, // Default on to showcase AI integration
  openItemsRatio: 0.35,
  toggleSidebar: (): void => {
    set((state) => ({ sidebarVisible: !state.sidebarVisible }));
  },
  setSidebarVisible: (visible): void => {
    set({ sidebarVisible: visible });
  },
  setSidebarEdge: (edge): void => {
    set({ sidebarEdge: edge });
  },
  setLogLevel: async (level: LogLevel): Promise<void> => {
    try {
      await invoke('set_log_level', { level });
      set({ logLevel: level });
    } catch (error) {
      console.error('Failed to set log level:', error);
      throw error;
    }
  },
  toggleMetrics: (): void => {
    set((state) => ({ metricsVisible: !state.metricsVisible }));
  },
  setMetricsVisible: (visible: boolean): void => {
    set({ metricsVisible: visible });
  },
  toggleFollowAiMode: (): void => {
    set((state) => ({ followAiMode: !state.followAiMode }));
  },
  setFollowAiMode: (enabled: boolean): void => {
    set({ followAiMode: enabled });
  },
  setOpenItemsRatio: (ratio: number): void => {
    set({ openItemsRatio: Math.max(0.1, Math.min(0.9, ratio)) });
  },
}));
