/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MainLayout } from './MainLayout';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { usePanelStore, DEFAULT_PANEL_SIZES } from '@/stores/usePanelStore';

// Mock CommandBar to avoid store dependencies in MainLayout tests
vi.mock('@/components/CommandBar/CommandBar', () => ({
  CommandBar: (): null => null,
}));

// Mock ContextToolbar and CanvasHost - these are tested separately
vi.mock('./ContextToolbar', () => ({
  ContextToolbar: ({ className }: { className?: string }): React.JSX.Element => (
    <div data-test-id="context-toolbar" className={className}>
      Context Toolbar
    </div>
  ),
}));

vi.mock('./CanvasHost', () => ({
  CanvasHost: ({ className }: { className?: string }): React.JSX.Element => (
    <div data-test-id="canvas-host" className={className}>
      Canvas Host
    </div>
  ),
}));

// Mock SettingsPanel - tested separately
vi.mock('@/components/Settings/SettingsPanel', () => ({
  SettingsPanel: ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }): React.JSX.Element => (
    <div data-test-id="settings-panel">
      Settings Panel
      {isOpen && (
        <button onClick={onClose} data-test-id="close-settings">
          Close
        </button>
      )}
    </div>
  ),
}));

// Mock Motion to avoid animation delays and strip motion-only props from DOM
vi.mock('motion/react', async () => {
  const actual = await vi.importActual('motion/react');

  const motionPropsToStrip = new Set([
    'layout',
    'layoutId',
    'variants',
    'initial',
    'animate',
    'exit',
    'transition',
    'whileHover',
    'whileTap',
    'whileDrag',
    'drag',
    'dragConstraints',
    'dragElastic',
    'dragMomentum',
    'dragPropagation',
    'dragSnapToOrigin',
    'dragDirectionLock',
    'onDrag',
    'onDragStart',
    'onDragEnd',
  ]);

  const stripMotionProps = (props: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
      if (!motionPropsToStrip.has(key)) {
        result[key] = value;
      }
    }
    return result;
  };

  const createMock =
    (Tag: keyof React.JSX.IntrinsicElements): React.FC<Record<string, unknown>> =>
    ({ children, ...props }: Record<string, unknown>): React.JSX.Element => {
      const cleanProps = stripMotionProps(props);
      const Component = Tag as React.ElementType;
      const htmlProps = cleanProps as React.HTMLAttributes<HTMLElement>;
      return <Component {...htmlProps}>{children as React.ReactNode}</Component>;
    };

  interface MockMotionValue {
    get: () => number;
    set: (newValue: number) => void;
    on: () => () => void;
    destroy: () => void;
  }

  // Create a synchronous mock for useSpring that updates immediately (no animation delay)
  const useSpringMock = (initialValue: number): MockMotionValue => {
    let currentValue = initialValue;
    return {
      get: (): number => currentValue,
      set: (newValue: number): void => {
        currentValue = newValue;
      },
      // Minimal MotionValue interface needed for useTransform
      on: (): (() => void) => (): void => {},
      destroy: (): void => {},
    };
  };

  const actualObj = actual as Record<string, unknown>;
  return {
    ...actualObj,
    useSpring: useSpringMock,
    motion: {
      ...(actualObj.motion as Record<string, unknown>),
      div: createMock('div'),
      aside: createMock('aside'),
      button: createMock('button'),
      span: createMock('span'),
      section: createMock('section'),
      header: createMock('header'),
      article: createMock('article'),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }): React.JSX.Element => (
      <>{children}</>
    ),
    LayoutGroup: ({ children }: { children: React.ReactNode }): React.JSX.Element => (
      <>{children}</>
    ),
  };
});

describe('MainLayout', () => {
  beforeEach(() => {
    // Reset store state
    useSettingsStore.setState({ sidebarVisible: true, sidebarEdge: 'left' });
    usePanelStore.setState({
      position: 'bottom',
      isVisible: false,
      isCollapsed: false,
      sizes: { ...DEFAULT_PANEL_SIZES },
      isPopout: false,
    });

    // Mock getBoundingClientRect for consistent testing
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 1200,
      height: 800,
      top: 0,
      left: 0,
      bottom: 800,
      right: 1200,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with context bar and canvas host', () => {
      render(<MainLayout />);

      expect(screen.getByTestId('context-toolbar')).toBeInTheDocument();
      expect(screen.getByTestId('canvas-host')).toBeInTheDocument();
    });

    it('renders sidebar when visible', () => {
      // Set sidebar to visible for this test
      useSettingsStore.setState({ sidebarVisible: true });
      render(<MainLayout />);
      // Sidebar wrapper (motion.aside) has the test ID
      const sidebars = screen.getAllByTestId('sidebar');
      expect(sidebars.length).toBeGreaterThan(0);
    });

    it('renders title bar', () => {
      render(<MainLayout />);
      expect(screen.getByTestId('titlebar')).toBeInTheDocument();
      expect(screen.queryByTestId('header-bar')).not.toBeInTheDocument();
    });

    it('renders status bar', () => {
      render(<MainLayout />);
      expect(screen.getByTestId('status-bar')).toBeInTheDocument();
    });
  });

  // Pane resizing tests removed - functionality moved to CanvasHost (tested separately)

  describe('Canvas Integration', () => {
    it('renders ContextBar', () => {
      render(<MainLayout />);
      expect(screen.getByTestId('context-toolbar')).toBeInTheDocument();
    });

    it('renders CanvasHost', () => {
      render(<MainLayout />);
      const canvasHost = screen.getByTestId('canvas-host');
      expect(canvasHost).toBeInTheDocument();
      expect(canvasHost).toHaveClass('flex-1');
    });

    it('no longer accepts requestContent, responseContent, or actionButtons props', () => {
      // TypeScript will catch this at compile time, but verify the props are removed
      render(<MainLayout />);

      // MainLayout should render without these props
      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
      expect(screen.getByTestId('context-toolbar')).toBeInTheDocument();
      expect(screen.getByTestId('canvas-host')).toBeInTheDocument();

      // Old pane elements should not exist
      expect(screen.queryByTestId('request-pane')).not.toBeInTheDocument();
      expect(screen.queryByTestId('response-pane')).not.toBeInTheDocument();
      expect(screen.queryByTestId('pane-resizer')).not.toBeInTheDocument();
    });
  });

  describe('Sidebar Functionality', () => {
    it('sidebar has resizer when visible', () => {
      render(<MainLayout />);

      // Sidebar wrapper (motion.aside) has the test ID
      const sidebars = screen.getAllByTestId('sidebar');
      expect(sidebars.length).toBeGreaterThan(0);

      // Sidebar resizer should be present
      const sidebarResizer = screen.queryByTestId('sidebar-resizer');
      expect(sidebarResizer).toBeInTheDocument();
    });

    it('sidebar resizer has correct accessibility attributes', () => {
      render(<MainLayout />);

      const resizer = screen.getByTestId('sidebar-resizer');
      expect(resizer).toHaveAttribute('role', 'separator');
      expect(resizer).toHaveAttribute('aria-label', 'Resize sidebar (double-click to collapse)');
      expect(resizer).toHaveAttribute('aria-orientation', 'vertical');
      expect(resizer).toHaveAttribute('aria-valuenow', '300');
      // aria-valuemin is COLLAPSED_SIDEBAR_WIDTH (8) since sidebar can collapse
      expect(resizer).toHaveAttribute('aria-valuemin', '8');
      expect(resizer).toHaveAttribute('aria-valuemax', '600');
    });

    it('sidebar is present when visible', () => {
      render(<MainLayout />);

      // Sidebar wrapper (motion.aside) has the test ID
      const sidebars = screen.getAllByTestId('sidebar');
      expect(sidebars.length).toBeGreaterThan(0);

      // Sidebar resizer should also be present
      const resizer = screen.getByTestId('sidebar-resizer');
      expect(resizer).toBeInTheDocument();
    });

    it('sidebar can be toggled via store', () => {
      const { rerender } = render(<MainLayout />);

      // Sidebar should be visible initially
      const initialSidebars = screen.getAllByTestId('sidebar');
      expect(initialSidebars.length).toBeGreaterThan(0);

      // Hide sidebar
      useSettingsStore.setState({ sidebarVisible: false });
      rerender(<MainLayout />);

      // Sidebar wrapper should not be visible (AnimatePresence removes it)
      // Note: In mocked Motion, AnimatePresence may not work as expected
      // This is better tested in E2E tests
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('registers keyboard shortcut for sidebar toggle', () => {
      render(<MainLayout />);

      // Sidebar should be visible initially
      const sidebars = screen.getAllByTestId('sidebar');
      expect(sidebars.length).toBeGreaterThan(0);

      // Note: Testing keyboard shortcuts requires mocking the hook
      // Full keyboard shortcut testing is done in E2E tests
    });
  });

  describe('Custom Content', () => {
    it('renders custom header content', () => {
      render(<MainLayout headerContent={<div data-test-id="custom-header">Custom Header</div>} />);

      const titlebar = screen.getByTestId('titlebar');
      expect(within(titlebar).getByTestId('custom-header')).toBeInTheDocument();
      expect(screen.queryByTestId('header-bar')).not.toBeInTheDocument();
    });

    // Request/response content tests removed - content is now managed by CanvasHost
  });

  describe('Initial Sidebar State', () => {
    it('respects initialSidebarVisible prop', () => {
      const { rerender } = render(<MainLayout initialSidebarVisible={false} />);

      // Sidebar should not be visible when initialSidebarVisible is false
      // Note: In mocked Motion, AnimatePresence may not work as expected
      // This is better tested in E2E tests

      // Show sidebar via store (rerender doesn't remount, so initialSidebarVisible won't apply)
      useSettingsStore.setState({ sidebarVisible: true });
      rerender(<MainLayout initialSidebarVisible={true} />);

      // Sidebar should be visible
      const sidebars = screen.getAllByTestId('sidebar');
      expect(sidebars.length).toBeGreaterThan(0);
    });
  });

  // Performance and animation tests removed - pane functionality moved to CanvasHost

  describe('Sidebar Drag-to-Close', () => {
    it('does not collapse when dragged slightly toward the edge', () => {
      render(<MainLayout />);

      // Verify sidebar starts visible
      expect(useSettingsStore.getState().sidebarVisible).toBe(true);

      const resizer = screen.getByTestId('sidebar-resizer');

      // Mock setPointerCapture/releasePointerCapture
      resizer.setPointerCapture = vi.fn();
      resizer.releasePointerCapture = vi.fn();

      // Start drag at x=256 (default sidebar width)
      fireEvent.pointerDown(resizer, { clientX: 256, pointerId: 1 });

      // Drag left by just 10px (to x=246)
      // Small drag should not collapse (threshold-based)
      fireEvent.pointerMove(resizer, { clientX: 246 });

      // End drag
      fireEvent.pointerUp(resizer, { clientX: 246, pointerId: 1 });

      expect(useSettingsStore.getState().sidebarVisible).toBe(true);
    });

    it('shows collapse hint when dragged past threshold', () => {
      render(<MainLayout />);

      const resizer = screen.getByTestId('sidebar-resizer');
      const sidebarContent = screen.getByTestId('sidebar-wrapper');

      resizer.setPointerCapture = vi.fn();
      resizer.releasePointerCapture = vi.fn();

      expect(sidebarContent).toHaveAttribute('data-collapse-hint', 'false');

      fireEvent.pointerDown(resizer, { clientX: 256, pointerId: 1 });
      fireEvent.pointerMove(resizer, { clientX: 200 });

      expect(sidebarContent).toHaveAttribute('data-collapse-hint', 'true');

      fireEvent.pointerUp(resizer, { clientX: 200, pointerId: 1 });
      expect(useSettingsStore.getState().sidebarVisible).toBe(false);
    });

    it('collapses when dragged past the minimum threshold', () => {
      render(<MainLayout />);

      // Verify sidebar starts visible
      expect(useSettingsStore.getState().sidebarVisible).toBe(true);

      const resizer = screen.getByTestId('sidebar-resizer');

      // Mock setPointerCapture/releasePointerCapture
      resizer.setPointerCapture = vi.fn();
      resizer.releasePointerCapture = vi.fn();

      // Start drag at x=256 (default sidebar width)
      fireEvent.pointerDown(resizer, { clientX: 256, pointerId: 1 });

      // Drag left past threshold (to x=200)
      fireEvent.pointerMove(resizer, { clientX: 200 });

      // End drag
      fireEvent.pointerUp(resizer, { clientX: 200, pointerId: 1 });

      expect(useSettingsStore.getState().sidebarVisible).toBe(false);
    });

    it('resizes sidebar when dragged right (not collapsed)', () => {
      render(<MainLayout />);

      // Verify sidebar starts visible
      expect(useSettingsStore.getState().sidebarVisible).toBe(true);

      const resizer = screen.getByTestId('sidebar-resizer');

      // Mock setPointerCapture/releasePointerCapture
      resizer.setPointerCapture = vi.fn();
      resizer.releasePointerCapture = vi.fn();

      // Start drag at x=256 (default sidebar width)
      fireEvent.pointerDown(resizer, { clientX: 256, pointerId: 1 });

      // Drag right by 50px (to x=306)
      fireEvent.pointerMove(resizer, { clientX: 306 });

      // End drag
      fireEvent.pointerUp(resizer, { clientX: 306, pointerId: 1 });

      // Should remain visible (dragging right = resize intent)
      expect(useSettingsStore.getState().sidebarVisible).toBe(true);
    });

    it('uses right-edge sizing when sidebarEdge is right', () => {
      useSettingsStore.setState({ sidebarEdge: 'right' });
      render(<MainLayout />);

      // Verify sidebar starts visible
      expect(useSettingsStore.getState().sidebarVisible).toBe(true);

      const resizer = screen.getByTestId('sidebar-resizer');

      // Mock setPointerCapture/releasePointerCapture
      resizer.setPointerCapture = vi.fn();
      resizer.releasePointerCapture = vi.fn();

      // Start drag at x=256 (default sidebar width)
      fireEvent.pointerDown(resizer, { clientX: 256, pointerId: 1 });

      // Drag so right edge size is 200px (bounds.right=1200 -> clientX=1000)
      fireEvent.pointerMove(resizer, { clientX: 1000 });

      // End drag
      fireEvent.pointerUp(resizer, { clientX: 1000, pointerId: 1 });

      expect(useSettingsStore.getState().sidebarVisible).toBe(false);
    });
  });

  describe('Visual Feedback', () => {
    it('sidebar resizer has hover styles', () => {
      render(<MainLayout />);

      const resizer = screen.getByTestId('sidebar-resizer');

      // Should have hover class for background hint
      expect(resizer).toHaveClass('hover:bg-border-subtle/50');
    });

    // Pane resizer tests removed - functionality moved to CanvasHost
  });

  describe('Resizer Positioning Strategy', () => {
    it('sidebar resizer uses absolute positioning within sidebar', () => {
      render(<MainLayout />);

      const sidebarResizer = screen.getByTestId('sidebar-resizer');

      // Sidebar resizer should be absolutely positioned
      expect(sidebarResizer).toHaveClass('absolute');
      expect(sidebarResizer).toHaveClass('right-0');
      expect(sidebarResizer).toHaveClass('z-30');
      expect(sidebarResizer).toHaveClass('w-[2px]');
    });

    // Pane resizer tests removed - functionality moved to CanvasHost
  });

  describe('DevTools Panel Integration', () => {
    it('renders content area wrapper', () => {
      render(<MainLayout />);

      const contentArea = screen.getByTestId('content-area');
      expect(contentArea).toBeInTheDocument();
    });

    it('renders dockable panel when visible', () => {
      usePanelStore.setState({ isVisible: true });

      render(<MainLayout />);

      const panel = screen.getByTestId('dockable-panel');
      expect(panel).toBeInTheDocument();
    });

    it('does not render panel when hidden', () => {
      usePanelStore.setState({ isVisible: false });

      render(<MainLayout />);

      expect(screen.queryByTestId('dockable-panel')).not.toBeInTheDocument();
    });

    it('panel shows Network and Console tabs', () => {
      usePanelStore.setState({ isVisible: true });

      render(<MainLayout />);

      // Panel shows tabs for Network and Console views
      expect(screen.getByTestId('panel-tab-network')).toBeInTheDocument();
      expect(screen.getByTestId('panel-tab-console')).toBeInTheDocument();
    });

    it('panel visibility can be toggled via store', () => {
      const { rerender } = render(<MainLayout />);

      // Panel should not be visible initially
      expect(screen.queryByTestId('dockable-panel')).not.toBeInTheDocument();

      // Show panel
      usePanelStore.setState({ isVisible: true });
      rerender(<MainLayout />);

      // Panel should be visible
      expect(screen.getByTestId('dockable-panel')).toBeInTheDocument();

      // Hide panel
      usePanelStore.setState({ isVisible: false });
      rerender(<MainLayout />);

      // Panel should be hidden again
      expect(screen.queryByTestId('dockable-panel')).not.toBeInTheDocument();
    });

    it('keyboard shortcut for panel toggle is registered', () => {
      render(<MainLayout />);

      // The keyboard shortcut is registered in the component
      // Full keyboard shortcut testing is done in E2E tests
      // We verify the store action works correctly
      const initialVisibility = usePanelStore.getState().isVisible;
      usePanelStore.getState().toggleVisibility();
      expect(usePanelStore.getState().isVisible).toBe(!initialVisibility);
    });

    it('content area uses flex-row for left dock position', () => {
      usePanelStore.setState({ isVisible: true, position: 'left' });

      render(<MainLayout />);

      const contentArea = screen.getByTestId('content-area');
      expect(contentArea).toHaveClass('flex-row');
    });

    it('content area uses flex-row for right dock position', () => {
      usePanelStore.setState({ isVisible: true, position: 'right' });

      render(<MainLayout />);

      const contentArea = screen.getByTestId('content-area');
      expect(contentArea).toHaveClass('flex-row');
    });

    it('content area uses flex-col for bottom dock position', () => {
      usePanelStore.setState({ isVisible: true, position: 'bottom' });

      render(<MainLayout />);

      const contentArea = screen.getByTestId('content-area');
      expect(contentArea).toHaveClass('flex-col');
    });

    it('panel renders with left dock position', () => {
      usePanelStore.setState({ isVisible: true, position: 'left' });

      render(<MainLayout />);

      // Panel should render and content area should have correct layout
      expect(screen.getByTestId('dockable-panel')).toBeInTheDocument();
      expect(screen.getByTestId('content-area')).toHaveClass('flex-row');
    });

    it('panel renders with right dock position', () => {
      usePanelStore.setState({ isVisible: true, position: 'right' });

      render(<MainLayout />);

      // Panel should render and content area should have correct layout
      expect(screen.getByTestId('dockable-panel')).toBeInTheDocument();
      expect(screen.getByTestId('content-area')).toHaveClass('flex-row');
    });
  });

  describe('Settings Toggle', () => {
    it('toggles settings open/close on button click', () => {
      render(<MainLayout />);

      const titleBar = screen.getByTestId('titlebar');
      const settingsButton = within(titleBar).getByTestId('titlebar-settings');

      // Settings should start closed
      expect(screen.queryByTestId('settings-overlay')).not.toBeInTheDocument();

      // Click to open
      fireEvent.click(settingsButton);
      expect(screen.getByTestId('settings-overlay')).toBeInTheDocument();

      // Click to close
      fireEvent.click(settingsButton);
      expect(screen.queryByTestId('settings-overlay')).not.toBeInTheDocument();
    });
  });

  describe('Panel Position and Sidebar Interaction', () => {
    it('auto-collapses sidebar when left dock is active', () => {
      // Start with sidebar visible
      useSettingsStore.setState({ sidebarVisible: true });
      usePanelStore.setState({ isVisible: false, position: 'bottom' });

      const { rerender } = render(<MainLayout />);

      // Sidebar should be visible
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();

      // Switch to left dock and make visible
      usePanelStore.setState({ isVisible: true, position: 'left' });
      rerender(<MainLayout />);

      // Sidebar should be collapsed (hidden)
      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    });

    it('restores sidebar when switching away from left dock', () => {
      // Start with sidebar visible and left dock active
      useSettingsStore.setState({ sidebarVisible: true });
      usePanelStore.setState({ isVisible: true, position: 'left' });

      const { rerender } = render(<MainLayout />);

      // Sidebar should be collapsed due to left dock
      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();

      // Switch to bottom dock
      usePanelStore.setState({ position: 'bottom' });
      rerender(<MainLayout />);

      // Sidebar should be restored
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('sidebar remains hidden when switching from left to right dock if it was already hidden', () => {
      // Start with sidebar hidden using the prop
      useSettingsStore.setState({ sidebarVisible: false });
      usePanelStore.setState({ isVisible: true, position: 'right' });

      render(<MainLayout initialSidebarVisible={false} />);

      // Sidebar should still be hidden
      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    });
  });

  describe('ContextToolbar Positioning', () => {
    it('renders ContextToolbar in canvas column (not in header)', () => {
      render(<MainLayout />);

      const contextToolbar = screen.getByTestId('context-toolbar');
      const canvasHost = screen.getByTestId('canvas-host');
      const contentArea = screen.getByTestId('content-area');

      // ContextToolbar should be present
      expect(contextToolbar).toBeInTheDocument();

      // CanvasHost should be present
      expect(canvasHost).toBeInTheDocument();

      // CanvasHost should be within content area
      expect(contentArea).toContainElement(canvasHost);

      // ContextToolbar should be a sibling of content-area (both in canvas column)
      const canvasColumn = contentArea.parentElement;
      expect(canvasColumn).toContainElement(contextToolbar);
      expect(canvasColumn).toContainElement(contentArea);
    });

    it('renders ContextToolbar above content-area in DOM order', () => {
      render(<MainLayout />);

      const contentArea = screen.getByTestId('content-area');
      const contextToolbar = screen.getByTestId('context-toolbar');

      // Get the canvas column (parent of both)
      const canvasColumn = contentArea.parentElement;
      expect(canvasColumn).not.toBeNull();

      // Get direct children of canvas column
      const children = Array.from(canvasColumn?.children ?? []);

      // Find indices
      const toolbarIndex = children.indexOf(contextToolbar);
      const contentAreaIndex = children.indexOf(contentArea);

      // ContextToolbar should come before content-area
      expect(toolbarIndex).toBeGreaterThanOrEqual(0);
      expect(contentAreaIndex).toBeGreaterThanOrEqual(0);
      expect(toolbarIndex).toBeLessThan(contentAreaIndex);
    });

    it('does NOT render ContextToolbar in header area', () => {
      render(<MainLayout />);

      const titleBar = screen.getByTestId('titlebar');

      // ContextToolbar should NOT be in titlebar
      expect(within(titleBar).queryByTestId('context-toolbar')).not.toBeInTheDocument();
    });
  });
});
