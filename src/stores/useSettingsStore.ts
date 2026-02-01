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
  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;
  setSidebarEdge: (edge: SidebarEdge) => void;
  setLogLevel: (level: LogLevel) => Promise<void>;
  toggleMetrics: () => void;
  setMetricsVisible: (visible: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  sidebarVisible: false, // Default collapsed since collections aren't supported yet
  sidebarEdge: 'left',
  logLevel: 'info',
  metricsVisible: false, // Default hidden to save space
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
}));
