import { create } from 'zustand';

interface SettingsState {
  sidebarVisible: boolean;
  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  sidebarVisible: true,
  toggleSidebar: (): void => {
    set((state) => ({ sidebarVisible: !state.sidebarVisible }));
  },
  setSidebarVisible: (visible): void => {
    set({ sidebarVisible: visible });
  },
}));
