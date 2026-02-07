/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TitleBar } from './TitleBar';
import { globalEventBus } from '@/events/bus';
import * as platformUtils from '@/utils/platform';

// Mock Tauri window API
const mockMinimize = vi.fn().mockResolvedValue(undefined);
const mockMaximize = vi.fn().mockResolvedValue(undefined);
const mockUnmaximize = vi.fn().mockResolvedValue(undefined);
const mockClose = vi.fn().mockResolvedValue(undefined);
const mockIsMaximized = vi.fn().mockResolvedValue(false);
const mockListen = vi.fn().mockResolvedValue(() => {});
const mockSetFocus = vi.fn().mockResolvedValue(undefined);

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn(() => ({
    minimize: mockMinimize,
    maximize: mockMaximize,
    unmaximize: mockUnmaximize,
    close: mockClose,
    setFocus: mockSetFocus,
    isMaximized: mockIsMaximized,
    listen: mockListen,
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
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('platform-specific rendering', () => {
    it('renders custom controls on macOS for undecorated windows', () => {
      vi.mocked(platformUtils.isMacSync).mockReturnValue(true);

      render(<TitleBar />);

      const titlebar = screen.getByTestId('titlebar');
      expect(titlebar).toBeInTheDocument();

      expect(screen.getByTestId('titlebar-close')).toBeInTheDocument();
      expect(screen.getByTestId('titlebar-minimize')).toBeInTheDocument();
      expect(screen.getByTestId('titlebar-maximize')).toBeInTheDocument();
    });

    it('does not render macOS traffic-light controls when Tauri window is unavailable', async () => {
      vi.mocked(platformUtils.isMacSync).mockReturnValue(true);
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      vi.mocked(getCurrentWindow).mockImplementationOnce(() => {
        throw new Error('Not in Tauri context');
      });

      render(<TitleBar />);

      expect(screen.queryByTestId('titlebar-close')).not.toBeInTheDocument();
      expect(screen.queryByTestId('titlebar-minimize')).not.toBeInTheDocument();
      expect(screen.queryByTestId('titlebar-maximize')).not.toBeInTheDocument();
    });

    it('mutes macOS traffic light colors when window is unfocused', () => {
      const listeners = new Map<string, () => void>();
      mockListen.mockImplementation((event, handler) => {
        listeners.set(event as string, handler as () => void);
        return Promise.resolve(() => {});
      });
      vi.mocked(platformUtils.isMacSync).mockReturnValue(true);

      render(<TitleBar />);

      const closeButton = screen.getByTestId('titlebar-close');
      expect(closeButton).toHaveClass('bg-[#ff5f57]');

      const blurHandler = listeners.get('tauri://blur');
      expect(blurHandler).toBeDefined();

      act(() => {
        blurHandler?.();
      });

      expect(closeButton).toHaveClass('bg-[#8f8f8f]');
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

    it('displays default title "runi"', () => {
      render(<TitleBar />);

      expect(screen.getByTestId('titlebar-title')).toHaveTextContent('runi');
    });

    it('displays custom title when provided', () => {
      render(<TitleBar title="Custom Title" />);

      expect(screen.getByTestId('titlebar-title')).toHaveTextContent('Custom Title');
      expect(screen.getByTestId('titlebar-title')).not.toHaveTextContent('runi');
    });

    it('renders children when provided', () => {
      render(
        <TitleBar>
          <span data-test-id="custom-content">Custom Content</span>
        </TitleBar>
      );

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      expect(screen.queryByTestId('titlebar-title')).not.toBeInTheDocument();
    });

    it('treats null and false children as no custom content', () => {
      const { rerender } = render(<TitleBar>{null}</TitleBar>);

      expect(screen.getByTestId('titlebar-title')).toBeInTheDocument();
      expect(screen.getByTestId('titlebar')).toHaveClass('h-8');

      rerender(<TitleBar>{false}</TitleBar>);

      expect(screen.getByTestId('titlebar-title')).toBeInTheDocument();
      expect(screen.getByTestId('titlebar')).toHaveClass('h-8');
    });

    it('renders settings button when onSettingsClick is provided', () => {
      const onSettingsClick = vi.fn();
      render(<TitleBar onSettingsClick={onSettingsClick} />);

      expect(screen.getByTestId('titlebar-settings')).toBeInTheDocument();
    });

    it('groups settings in a compact right utility rail', () => {
      const onSettingsClick = vi.fn();
      render(<TitleBar onSettingsClick={onSettingsClick} />);

      const utilities = screen.getByTestId('titlebar-utilities');
      expect(utilities).toHaveClass('pl-1');
      expect(utilities).toHaveClass('pr-0.5');
    });

    it('does not render settings button when onSettingsClick is missing', () => {
      render(<TitleBar />);

      expect(screen.queryByTestId('titlebar-settings')).not.toBeInTheDocument();
    });
  });

  describe('window control actions', () => {
    it('renders custom minimize button on macOS', () => {
      vi.mocked(platformUtils.isMacSync).mockReturnValue(true);

      render(<TitleBar />);

      const minimizeButton = screen.getByTestId('titlebar-minimize');
      expect(minimizeButton).toBeInTheDocument();
    });

    it('calls minimize when minimize button is clicked on Windows/Linux', () => {
      vi.mocked(platformUtils.isMacSync).mockReturnValue(false);

      render(<TitleBar />);

      const minimizeButton = screen.getByTestId('titlebar-minimize');
      fireEvent.click(minimizeButton);

      expect(mockMinimize).toHaveBeenCalledTimes(1);
    });

    it('renders custom maximize button on Windows/Linux', async () => {
      vi.mocked(platformUtils.isMacSync).mockReturnValue(false);
      mockIsMaximized.mockResolvedValue(false);

      render(<TitleBar />);

      const maximizeButton = screen.getByTestId('titlebar-maximize');
      fireEvent.click(maximizeButton);

      // Wait for async handler to complete
      await waitFor(() => {
        expect(mockIsMaximized).toHaveBeenCalledTimes(1);
      });

      expect(mockMaximize).toHaveBeenCalledTimes(1);
      expect(mockUnmaximize).not.toHaveBeenCalled();
    });

    it('renders custom unmaximize button on Windows/Linux when maximized', async () => {
      vi.mocked(platformUtils.isMacSync).mockReturnValue(false);
      mockIsMaximized.mockResolvedValue(true);

      render(<TitleBar />);

      const maximizeButton = screen.getByTestId('titlebar-maximize');
      fireEvent.click(maximizeButton);

      // Wait for async handler to complete
      await waitFor(() => {
        expect(mockIsMaximized).toHaveBeenCalledTimes(1);
      });

      expect(mockUnmaximize).toHaveBeenCalledTimes(1);
      expect(mockMaximize).not.toHaveBeenCalled();
    });

    it('renders custom close button on Windows/Linux', () => {
      vi.mocked(platformUtils.isMacSync).mockReturnValue(false);

      render(<TitleBar />);

      const closeButton = screen.getByTestId('titlebar-close');
      fireEvent.click(closeButton);

      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('calls settings handler when settings button is clicked', () => {
      const onSettingsClick = vi.fn();
      render(<TitleBar onSettingsClick={onSettingsClick} />);

      fireEvent.click(screen.getByTestId('titlebar-settings'));
      expect(onSettingsClick).toHaveBeenCalledTimes(1);
    });

    it('uses first mac traffic-light click to focus an unfocused window', async () => {
      vi.mocked(platformUtils.isMacSync).mockReturnValue(true);
      vi.spyOn(document, 'hasFocus').mockReturnValue(false);

      render(<TitleBar />);

      fireEvent.click(screen.getByTestId('titlebar-close'));

      await waitFor(() => {
        expect(mockSetFocus).toHaveBeenCalledTimes(1);
      });
      expect(mockClose).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has proper aria-labels for window controls on Windows/Linux', () => {
      vi.mocked(platformUtils.isMacSync).mockReturnValue(false);

      render(<TitleBar />);

      const closeButton = screen.getByTestId('titlebar-close');
      const minimizeButton = screen.getByTestId('titlebar-minimize');
      const maximizeButton = screen.getByTestId('titlebar-maximize');

      expect(closeButton).toBeInTheDocument();
      expect(minimizeButton).toBeInTheDocument();
      expect(maximizeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('aria-label', 'Close window');
      expect(minimizeButton).toHaveAttribute('aria-label', 'Minimize window');
      expect(maximizeButton).toHaveAttribute('aria-label', 'Maximize window');
    });

    it('has data-test-id attributes for testing', () => {
      vi.mocked(platformUtils.isMacSync).mockReturnValue(false);
      render(<TitleBar onSettingsClick={vi.fn()} />);

      expect(screen.getByTestId('titlebar')).toBeInTheDocument();
      expect(screen.getByTestId('titlebar-settings')).toBeInTheDocument();
      // On Windows/Linux, controls should have testids
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
      vi.mocked(platformUtils.isMacSync).mockReturnValue(false);
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
      vi.mocked(platformUtils.isMacSync).mockReturnValue(false);
      mockMinimize.mockRejectedValueOnce(new Error('Window API error'));

      render(<TitleBar />);

      const minimizeButton = screen.getByTestId('titlebar-minimize');

      // Should not throw when window API call fails
      expect(() => {
        fireEvent.click(minimizeButton);
      }).not.toThrow();
    });

    it('emits toast errors when window commands fail', async () => {
      vi.mocked(platformUtils.isMacSync).mockReturnValue(false);
      mockMinimize.mockRejectedValueOnce(new Error('Window API error'));
      const emitSpy = vi.spyOn(globalEventBus, 'emit');

      render(<TitleBar />);

      fireEvent.click(screen.getByTestId('titlebar-minimize'));

      await waitFor(() => {
        expect(emitSpy).toHaveBeenCalledWith(
          'toast.show',
          expect.objectContaining({
            type: 'error',
            message: 'Failed to minimize window',
            details: 'Window API error',
          })
        );
      });
    });
  });

  describe('window instance caching', () => {
    it('caches window instance and does not call getCurrentWindow multiple times', async () => {
      vi.mocked(platformUtils.isMacSync).mockReturnValue(false);
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
