import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

export type ViewMode = 'builder' | 'history';
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

interface SettingsState {
  sidebarVisible: boolean;
  viewMode: ViewMode;
  logLevel: LogLevel;
  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  setLogLevel: (level: LogLevel) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  sidebarVisible: true,
  viewMode: 'builder',
  logLevel: 'info',
  toggleSidebar: (): void => {
    set((state) => ({ sidebarVisible: !state.sidebarVisible }));
  },
  setSidebarVisible: (visible): void => {
    set({ sidebarVisible: visible });
  },
  setViewMode: (mode): void => {
    set({ viewMode: mode });
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
}));
