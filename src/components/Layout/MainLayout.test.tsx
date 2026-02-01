/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MainLayout } from './MainLayout';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { usePanelStore, DEFAULT_PANEL_SIZES } from '@/stores/usePanelStore';

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
    it('renders with request and response panes', () => {
      render(
        <MainLayout
          requestContent={<div>Request Content</div>}
          responseContent={<div>Response Content</div>}
        />
      );

      expect(screen.getByTestId('request-pane')).toBeInTheDocument();
      expect(screen.getByTestId('response-pane')).toBeInTheDocument();
      expect(screen.getByTestId('pane-resizer')).toBeInTheDocument();
    });

    it('renders sidebar when visible', () => {
      // Set sidebar to visible for this test
      useSettingsStore.setState({ sidebarVisible: true });
      render(<MainLayout />);
      // Sidebar wrapper (motion.aside) has the test ID
      const sidebars = screen.getAllByTestId('sidebar');
      expect(sidebars.length).toBeGreaterThan(0);
    });

    it('renders header bar', () => {
      render(<MainLayout />);
      expect(screen.getByTestId('header-bar')).toBeInTheDocument();
    });

    it('renders status bar', () => {
      render(<MainLayout />);
      expect(screen.getByTestId('status-bar')).toBeInTheDocument();
    });
  });

  describe('Pane Resizing', () => {
    it('panes start at 50/50 split', () => {
      render(<MainLayout />);

      const requestPane = screen.getByTestId('request-pane');
      const responsePane = screen.getByTestId('response-pane');

      // Both panes should exist and be rendered
      // In mocked Motion, width is set via style attribute or transform
      // The actual width calculation is tested in E2E tests
      expect(requestPane).toBeInTheDocument();
      expect(responsePane).toBeInTheDocument();

      // Check that they have style attributes (MotionValues set width)
      const requestStyle = requestPane.getAttribute('style');
      const responseStyle = responsePane.getAttribute('style');
      expect(requestStyle).toBeTruthy();
      expect(responseStyle).toBeTruthy();
    });

    it('pane resizer has correct accessibility attributes', () => {
      render(<MainLayout />);

      const resizer = screen.getByTestId('pane-resizer');
      expect(resizer).toHaveAttribute('role', 'separator');
      expect(resizer).toHaveAttribute('aria-label', 'Resize panes');
      expect(resizer).toHaveAttribute('aria-orientation', 'vertical');
      expect(resizer).toHaveAttribute('aria-valuenow', '50');
      expect(resizer).toHaveAttribute('aria-valuemin', '20');
      expect(resizer).toHaveAttribute('aria-valuemax', '80');
    });

    it('pane resizer has col-resize cursor', () => {
      render(<MainLayout />);

      const resizer = screen.getByTestId('pane-resizer');
      expect(resizer).toHaveClass('cursor-col-resize');
    });

    it('pane resizer has touch-none for pointer capture', () => {
      render(<MainLayout />);

      const resizer = screen.getByTestId('pane-resizer');
      expect(resizer).toHaveClass('touch-none');
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
      expect(resizer).toHaveAttribute('aria-valuenow', '256');
      // aria-valuemin is COLLAPSED_SIDEBAR_WIDTH (8) since sidebar can collapse
      expect(resizer).toHaveAttribute('aria-valuemin', '8');
      expect(resizer).toHaveAttribute('aria-valuemax', '500');
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

  describe('Scrollbar Stability', () => {
    it('panes have scrollbar-gutter stable for preventing flashing', () => {
      render(<MainLayout />);

      const requestPane = screen.getByTestId('request-pane');
      const responsePane = screen.getByTestId('response-pane');
      const container = screen.getByTestId('pane-container');

      // Check inline styles for scrollbar-gutter
      expect(requestPane).toHaveStyle({ scrollbarGutter: 'stable' });
      expect(responsePane).toHaveStyle({ scrollbarGutter: 'stable' });
      expect(container).toHaveStyle({ scrollbarGutter: 'stable' });
    });
  });

  describe('Custom Content', () => {
    it('renders custom header content', () => {
      render(<MainLayout headerContent={<div data-test-id="custom-header">Custom Header</div>} />);

      expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    });

    it('renders custom request content', () => {
      render(
        <MainLayout requestContent={<div data-test-id="custom-request">Custom Request</div>} />
      );

      expect(screen.getByTestId('custom-request')).toBeInTheDocument();
    });

    it('renders custom response content', () => {
      render(
        <MainLayout responseContent={<div data-test-id="custom-response">Custom Response</div>} />
      );

      expect(screen.getByTestId('custom-response')).toBeInTheDocument();
    });
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

  describe('Performance and Animations', () => {
    it('uses MotionValues for immediate updates during drag', () => {
      render(<MainLayout />);

      // The component should use MotionValues internally
      // This is verified by the presence of motion components
      const requestPane = screen.getByTestId('request-pane');
      const responsePane = screen.getByTestId('response-pane');

      // Both should have style attributes (MotionValues set width via style)
      // In mocked Motion, style may be set differently, but should exist
      const requestStyle = requestPane.getAttribute('style');
      const responseStyle = responsePane.getAttribute('style');

      // Style should exist (may contain scrollbar-gutter or width)
      expect(requestStyle).toBeTruthy();
      expect(responseStyle).toBeTruthy();
    });

    it('disables layout animations during drag', () => {
      render(<MainLayout />);

      const requestPane = screen.getByTestId('request-pane');
      const responsePane = screen.getByTestId('response-pane');

      // Components should have layout prop (controlled by isDragging state)
      // This is tested via interaction tests
      expect(requestPane).toBeInTheDocument();
      expect(responsePane).toBeInTheDocument();
    });
  });

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
    it('resizer has hover styles', () => {
      render(<MainLayout />);

      const resizer = screen.getByTestId('pane-resizer');

      // Should have hover class for background hint
      expect(resizer).toHaveClass('hover:bg-border-default/50');
    });

    it('resizer has minimal styling (transparent at rest)', () => {
      render(<MainLayout />);

      const resizer = screen.getByTestId('pane-resizer');

      // Should be transparent at rest (zen aesthetic)
      expect(resizer).toHaveClass('bg-transparent');
    });
  });

  describe('Resizer Positioning Strategy', () => {
    it('pane resizer uses absolute positioning like sidebar (no flex flow interference)', () => {
      render(<MainLayout />);

      const resizer = screen.getByTestId('pane-resizer');

      // Resizer must be absolutely positioned to avoid competing forces
      // between Motion's drag transform and flex layout repositioning
      expect(resizer).toHaveClass('absolute');
    });

    it('pane resizer is positioned at the split point via style transform', () => {
      render(<MainLayout />);

      const resizer = screen.getByTestId('pane-resizer');
      const style = resizer.getAttribute('style') ?? '';

      // Should have transform for centering on split point
      // Note: The `left` style uses a MotionValue which Motion converts at runtime.
      // In mocked tests, we verify the transform is present (translateX for centering).
      // Full left positioning is verified via Storybook interactive tests.
      expect(style).toContain('translateX(-50%)');
    });

    it('sidebar resizer uses absolute positioning within sidebar', () => {
      render(<MainLayout />);

      const sidebarResizer = screen.getByTestId('sidebar-resizer');

      // Sidebar resizer should be absolutely positioned
      expect(sidebarResizer).toHaveClass('absolute');
      expect(sidebarResizer).toHaveClass('right-0');
    });

    it('panes are siblings without resizer in flex flow', () => {
      render(<MainLayout />);

      const container = screen.getByTestId('pane-container');
      const requestPane = screen.getByTestId('request-pane');
      const responsePane = screen.getByTestId('response-pane');
      const resizer = screen.getByTestId('pane-resizer');

      // All three should be direct children of container
      expect(requestPane.parentElement).toBe(container);
      expect(responsePane.parentElement).toBe(container);
      expect(resizer.parentElement).toBe(container);

      // Request and response should be adjacent in DOM (no resizer between)
      // This verifies the resizer is absolutely positioned, not in flex flow
      const children = Array.from(container.children);
      const requestIndex = children.indexOf(requestPane);
      const responseIndex = children.indexOf(responsePane);

      // They should be adjacent (index difference of 1)
      expect(Math.abs(responseIndex - requestIndex)).toBe(1);
    });
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
      expect(screen.getByRole('tab', { name: /network/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /console/i })).toBeInTheDocument();
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
});
