/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

interface SettingsState {
  sidebarVisible: boolean;
  logLevel: LogLevel;
  metricsVisible: boolean;
  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;
  setLogLevel: (level: LogLevel) => Promise<void>;
  toggleMetrics: () => void;
  setMetricsVisible: (visible: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  sidebarVisible: false, // Default collapsed since collections aren't supported yet
  logLevel: 'info',
  metricsVisible: false, // Default hidden to save space
  toggleSidebar: (): void => {
    set((state) => ({ sidebarVisible: !state.sidebarVisible }));
  },
  setSidebarVisible: (visible): void => {
    set({ sidebarVisible: visible });
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
  setMetricsVisible: (visible): void => {
    set({ metricsVisible: visible });
  },
}));
