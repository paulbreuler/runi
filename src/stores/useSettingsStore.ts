import { create } from 'zustand';

export type ViewMode = 'builder' | 'history';

interface SettingsState {
  sidebarVisible: boolean;
  viewMode: ViewMode;
  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  sidebarVisible: true,
  viewMode: 'builder',
  toggleSidebar: (): void => {
    set((state) => ({ sidebarVisible: !state.sidebarVisible }));
  },
  setSidebarVisible: (visible): void => {
    set({ sidebarVisible: visible });
  },
  setViewMode: (mode): void => {
    set({ viewMode: mode });
  },
}));
