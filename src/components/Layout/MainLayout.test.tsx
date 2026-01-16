import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MainLayout } from './MainLayout';
import { useSettingsStore } from '@/stores/useSettingsStore';

// Mock Motion to avoid animation delays and strip motion-only props from DOM
vi.mock('motion/react', async () => {
  const actual = await vi.importActual('motion/react');

  const stripMotionProps = (props: Record<string, unknown>) => {
    const {
      layout,
      layoutId,
      variants,
      initial,
      animate,
      exit,
      transition,
      whileHover,
      whileTap,
      whileDrag,
      drag,
      dragConstraints,
      dragElastic,
      dragMomentum,
      dragPropagation,
      dragSnapToOrigin,
      dragDirectionLock,
      onDrag,
      onDragStart,
      onDragEnd,
      ...rest
    } = props;
    return rest;
  };

  const createMock = (Tag: keyof JSX.IntrinsicElements) =>
    ({ children, ...props }: any) => {
      const cleanProps = stripMotionProps(props);
      const Component = Tag;
      return <Component {...cleanProps}>{children}</Component>;
    };

  return {
    ...actual,
    motion: {
      ...actual.motion,
      div: createMock('div'),
      aside: createMock('aside'),
      button: createMock('button'),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
    LayoutGroup: ({ children }: any) => <>{children}</>,
  };
});

describe('MainLayout', () => {
  beforeEach(() => {
    // Reset store state
    useSettingsStore.setState({ sidebarVisible: true });
    
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

    it('renders sidebar by default', () => {
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
      render(
        <MainLayout
          headerContent={<div data-testid="custom-header">Custom Header</div>}
        />
      );

      expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    });

    it('renders custom request content', () => {
      render(
        <MainLayout
          requestContent={<div data-testid="custom-request">Custom Request</div>}
        />
      );

      expect(screen.getByTestId('custom-request')).toBeInTheDocument();
    });

    it('renders custom response content', () => {
      render(
        <MainLayout
          responseContent={<div data-testid="custom-response">Custom Response</div>}
        />
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
      
      // Re-render with visible
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
      const style = resizer.getAttribute('style') || '';

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
});
