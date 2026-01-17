import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TitleBar } from './TitleBar';
import * as platformUtils from '@/utils/platform';

// Mock Tauri window API
const mockMinimize = vi.fn().mockResolvedValue(undefined);
const mockMaximize = vi.fn().mockResolvedValue(undefined);
const mockUnmaximize = vi.fn().mockResolvedValue(undefined);
const mockClose = vi.fn().mockResolvedValue(undefined);
const mockIsMaximized = vi.fn().mockResolvedValue(false);

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn(() => ({
    minimize: mockMinimize,
    maximize: mockMaximize,
    unmaximize: mockUnmaximize,
    close: mockClose,
    isMaximized: mockIsMaximized,
  })),
}));

// Mock platform utilities
vi.mock('@/utils/platform', () => ({
  isMacSync: vi.fn(),
}));

describe('TitleBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to macOS for most tests
    vi.mocked(platformUtils.isMacSync).mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('platform-specific rendering', () => {
    it('renders macOS-style traffic light controls on macOS', () => {
      vi.mocked(platformUtils.isMacSync).mockReturnValue(true);

      render(<TitleBar />);

      const titlebar = screen.getByTestId('titlebar');
      expect(titlebar).toBeInTheDocument();

      // macOS controls are circles (no icon children)
      const closeButton = screen.getByTestId('titlebar-close');
      const minimizeButton = screen.getByTestId('titlebar-minimize');
      const maximizeButton = screen.getByTestId('titlebar-maximize');

      expect(closeButton).toBeInTheDocument();
      expect(minimizeButton).toBeInTheDocument();
      expect(maximizeButton).toBeInTheDocument();

      // macOS controls should not have icons (they're colored circles)
      expect(closeButton.children.length).toBe(0);
      expect(minimizeButton.children.length).toBe(0);
      expect(maximizeButton.children.length).toBe(0);
    });

    it('renders Windows/Linux-style window controls on non-macOS', () => {
      vi.mocked(platformUtils.isMacSync).mockReturnValue(false);

      render(<TitleBar />);

      const titlebar = screen.getByTestId('titlebar');
      expect(titlebar).toBeInTheDocument();

      // Windows/Linux controls have icons
      const closeButton = screen.getByTestId('titlebar-close');
      const minimizeButton = screen.getByTestId('titlebar-minimize');
      const maximizeButton = screen.getByTestId('titlebar-maximize');

      expect(closeButton).toBeInTheDocument();
      expect(minimizeButton).toBeInTheDocument();
      expect(maximizeButton).toBeInTheDocument();

      // Windows/Linux controls should have icon children (Minimize2, Maximize2, X)
      expect(closeButton.children.length).toBeGreaterThan(0);
      expect(minimizeButton.children.length).toBeGreaterThan(0);
      expect(maximizeButton.children.length).toBeGreaterThan(0);
    });

    it('displays default title "Runi"', () => {
      render(<TitleBar />);

      expect(screen.getByText('Runi')).toBeInTheDocument();
    });

    it('displays custom title when provided', () => {
      render(<TitleBar title="Custom Title" />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.queryByText('Runi')).not.toBeInTheDocument();
    });

    it('renders children when provided', () => {
      render(
        <TitleBar>
          <span data-testid="custom-content">Custom Content</span>
        </TitleBar>
      );

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      expect(screen.queryByText('Runi')).not.toBeInTheDocument();
    });
  });

  describe('window control actions', () => {
    it('calls minimize when minimize button is clicked on macOS', () => {
      vi.mocked(platformUtils.isMacSync).mockReturnValue(true);

      render(<TitleBar />);

      const minimizeButton = screen.getByTestId('titlebar-minimize');
      fireEvent.click(minimizeButton);

      expect(mockMinimize).toHaveBeenCalledTimes(1);
    });

    it('calls minimize when minimize button is clicked on Windows/Linux', () => {
      vi.mocked(platformUtils.isMacSync).mockReturnValue(false);

      render(<TitleBar />);

      const minimizeButton = screen.getByTestId('titlebar-minimize');
      fireEvent.click(minimizeButton);

      expect(mockMinimize).toHaveBeenCalledTimes(1);
    });

    it('calls maximize when maximize button is clicked and window is not maximized', () => {
      vi.mocked(platformUtils.isMacSync).mockReturnValue(true);
      mockIsMaximized.mockResolvedValue(false);

      render(<TitleBar />);

      const maximizeButton = screen.getByTestId('titlebar-maximize');
      fireEvent.click(maximizeButton);

      expect(mockIsMaximized).toHaveBeenCalledTimes(1);
      expect(mockMaximize).toHaveBeenCalledTimes(1);
      expect(mockUnmaximize).not.toHaveBeenCalled();
    });

    it('calls unmaximize when maximize button is clicked and window is maximized', () => {
      vi.mocked(platformUtils.isMacSync).mockReturnValue(true);
      mockIsMaximized.mockResolvedValue(true);

      render(<TitleBar />);

      const maximizeButton = screen.getByTestId('titlebar-maximize');
      fireEvent.click(maximizeButton);

      expect(mockIsMaximized).toHaveBeenCalledTimes(1);
      expect(mockUnmaximize).toHaveBeenCalledTimes(1);
      expect(mockMaximize).not.toHaveBeenCalled();
    });

    it('calls close when close button is clicked', () => {
      vi.mocked(platformUtils.isMacSync).mockReturnValue(true);

      render(<TitleBar />);

      const closeButton = screen.getByTestId('titlebar-close');
      fireEvent.click(closeButton);

      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has proper aria-labels for all window controls', () => {
      render(<TitleBar />);

      const closeButton = screen.getByLabelText('Close window');
      const minimizeButton = screen.getByLabelText('Minimize window');
      const maximizeButton = screen.getByLabelText('Maximize window');

      expect(closeButton).toBeInTheDocument();
      expect(minimizeButton).toBeInTheDocument();
      expect(maximizeButton).toBeInTheDocument();
    });

    it('has data-testid attributes for testing', () => {
      render(<TitleBar />);

      expect(screen.getByTestId('titlebar')).toBeInTheDocument();
      expect(screen.getByTestId('titlebar-close')).toBeInTheDocument();
      expect(screen.getByTestId('titlebar-minimize')).toBeInTheDocument();
      expect(screen.getByTestId('titlebar-maximize')).toBeInTheDocument();
    });

    it('has data-tauri-drag-region attribute for window dragging', () => {
      render(<TitleBar />);

      const titlebar = screen.getByTestId('titlebar');
      expect(titlebar).toHaveAttribute('data-tauri-drag-region');
    });
  });

  describe('error handling', () => {
    it('handles missing Tauri context gracefully - component renders when getCurrentWindow throws', async () => {
      vi.mocked(platformUtils.isMacSync).mockReturnValue(true);
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      vi.mocked(getCurrentWindow).mockImplementationOnce(() => {
        throw new Error('Not in Tauri context');
      });

      // Should render without throwing
      expect(() => render(<TitleBar />)).not.toThrow();

      const titlebar = screen.getByTestId('titlebar');
      expect(titlebar).toBeInTheDocument();
    });

    it('handles missing Tauri context gracefully - buttons are clickable when window is null', async () => {
      vi.mocked(platformUtils.isMacSync).mockReturnValue(true);
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      vi.mocked(getCurrentWindow).mockImplementationOnce(() => {
        throw new Error('Not in Tauri context');
      });

      render(<TitleBar />);

      const minimizeButton = screen.getByTestId('titlebar-minimize');

      // Should not throw when clicking (appWindow is null, so handler returns early)
      expect(() => {
        fireEvent.click(minimizeButton);
      }).not.toThrow();

      // No window methods should be called
      expect(mockMinimize).not.toHaveBeenCalled();
    });

    it('handles window API errors gracefully', async () => {
      vi.mocked(platformUtils.isMacSync).mockReturnValue(true);
      mockMinimize.mockRejectedValueOnce(new Error('Window API error'));

      render(<TitleBar />);

      const minimizeButton = screen.getByTestId('titlebar-minimize');

      // Should not throw when window API call fails
      expect(() => {
        fireEvent.click(minimizeButton);
      }).not.toThrow();
    });
  });

  describe('window instance caching', () => {
    it('caches window instance and does not call getCurrentWindow multiple times', async () => {
      vi.mocked(platformUtils.isMacSync).mockReturnValue(true);
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      vi.mocked(getCurrentWindow).mockClear();

      const { rerender } = render(<TitleBar />);

      // Initial render should call getCurrentWindow once (in useMemo)
      expect(getCurrentWindow).toHaveBeenCalledTimes(1);

      // Rerender should not call getCurrentWindow again (cached by useMemo)
      rerender(<TitleBar title="New Title" />);
      expect(getCurrentWindow).toHaveBeenCalledTimes(1);

      // Clicking controls should use cached instance, not call getCurrentWindow again
      const minimizeButton = screen.getByTestId('titlebar-minimize');
      fireEvent.click(minimizeButton);
      expect(getCurrentWindow).toHaveBeenCalledTimes(1);
    });
  });
});
