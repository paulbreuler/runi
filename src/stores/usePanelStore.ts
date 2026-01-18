import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Valid positions for the dockable panel.
 */
export type PanelPosition = 'bottom' | 'left' | 'right' | 'floating';

/**
 * Size configuration for each panel position.
 */
export interface PanelSizes {
  /** Height in pixels when docked at bottom */
  bottom: number;
  /** Width in pixels when docked at left */
  left: number;
  /** Width in pixels when docked at right */
  right: number;
}

/**
 * Default sizes for panel positions.
 */
export const DEFAULT_PANEL_SIZES: PanelSizes = {
  bottom: 250,
  left: 350,
  right: 350,
};

/**
 * Minimum sizes for panel positions.
 */
export const MIN_PANEL_SIZES: PanelSizes = {
  bottom: 180, // 32px header + ~148px content = 3-4 visible rows
  left: 280, // Fits "Network History" without text wrapping
  right: 280, // Fits "Network History" without text wrapping
};

/**
 * Maximum sizes for panel positions (as percentages of viewport).
 */
export const MAX_PANEL_PERCENTAGES: PanelSizes = {
  bottom: 60, // 60% of viewport height
  left: 50, // 50% of viewport width
  right: 50, // 50% of viewport width
};

/**
 * Collapsed panel height (thin bar) - 28px for "book page edge" feel.
 */
export const COLLAPSED_PANEL_HEIGHT = 28;

interface PanelState {
  /** Current dock position */
  position: PanelPosition;
  /** Whether panel is visible */
  isVisible: boolean;
  /** Whether panel is collapsed to thin bar */
  isCollapsed: boolean;
  /** Size settings per position */
  sizes: PanelSizes;
  /** Whether panel is popped out to separate window */
  isPopout: boolean;
}

interface PanelActions {
  /** Set dock position */
  setPosition: (position: PanelPosition) => void;
  /** Toggle panel visibility */
  toggleVisibility: () => void;
  /** Set panel visibility explicitly */
  setVisible: (visible: boolean) => void;
  /** Set collapsed state */
  setCollapsed: (collapsed: boolean) => void;
  /** Toggle collapsed state */
  toggleCollapsed: () => void;
  /** Set size for a specific position */
  setSize: (position: keyof PanelSizes, size: number) => void;
  /** Set popout state */
  setPopout: (isPopout: boolean) => void;
  /** Reset all state to defaults */
  reset: () => void;
}

interface PanelStore extends PanelState, PanelActions {
  /** Get current size based on position */
  getCurrentSize: () => number;
}

const initialState: PanelState = {
  position: 'bottom',
  isVisible: false,
  isCollapsed: false,
  sizes: { ...DEFAULT_PANEL_SIZES },
  isPopout: false,
};

export const usePanelStore = create<PanelStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      getCurrentSize: (): number => {
        const state = get();
        const { position, sizes } = state;
        if (position === 'floating') {
          return sizes.bottom; // Use bottom size for floating
        }
        return sizes[position];
      },

      setPosition: (position): void => {
        set({ position });
      },

      toggleVisibility: (): void => {
        set((state) => ({ isVisible: !state.isVisible }));
      },

      setVisible: (visible): void => {
        set({ isVisible: visible });
      },

      setCollapsed: (collapsed): void => {
        set({ isCollapsed: collapsed });
      },

      toggleCollapsed: (): void => {
        set((state) => ({ isCollapsed: !state.isCollapsed }));
      },

      setSize: (position, size): void => {
        set((state) => ({
          sizes: {
            ...state.sizes,
            [position]: size,
          },
        }));
      },

      setPopout: (isPopout): void => {
        set({ isPopout });
      },

      reset: (): void => {
        set({ ...initialState, sizes: { ...DEFAULT_PANEL_SIZES } });
      },
    }),
    {
      name: 'runi-panel-state',
      partialize: (state) => ({
        position: state.position,
        isVisible: state.isVisible,
        isCollapsed: state.isCollapsed,
        sizes: state.sizes,
        // Don't persist isPopout - it's window-specific
      }),
    }
  )
);
