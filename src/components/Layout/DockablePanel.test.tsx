import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DockablePanel } from './DockablePanel';
import { usePanelStore, DEFAULT_PANEL_SIZES } from '@/stores/usePanelStore';

// Mock motion/react to avoid animation-related issues in tests
vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
      [key: string]: unknown;
    }): React.JSX.Element => (
      <div data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }): React.ReactNode => (
    <>{children}</>
  ),
  useReducedMotion: (): boolean => false,
  useSpring: (value: number): { get: () => number; set: () => void } => ({
    get: (): number => value,
    set: (): void => {},
  }),
  useMotionValue: (value: number): { get: () => number; set: () => void } => ({
    get: (): number => value,
    set: (): void => {},
  }),
  useTransform: (
    mv: { get: () => number },
    fn: (v: number) => number
  ): { get: () => number; set: () => void } => ({
    get: (): number => fn(mv.get()),
    set: (): void => {},
  }),
}));

describe('DockablePanel', () => {
  beforeEach(() => {
    // Reset store to initial state
    usePanelStore.setState({
      position: 'bottom',
      isVisible: true,
      isCollapsed: false,
      sizes: { ...DEFAULT_PANEL_SIZES },
      isPopout: false,
    });
  });

  describe('rendering', () => {
    it('renders with title', () => {
      render(
        <DockablePanel title="Network History">
          <div>Content</div>
        </DockablePanel>
      );

      expect(screen.getByText('Network History')).toBeInTheDocument();
    });

    it('renders children content', () => {
      render(
        <DockablePanel title="Test Panel">
          <div data-testid="panel-content">Panel Content</div>
        </DockablePanel>
      );

      expect(screen.getByTestId('panel-content')).toBeInTheDocument();
      expect(screen.getByText('Panel Content')).toBeInTheDocument();
    });

    it('does not render when isVisible is false', () => {
      usePanelStore.setState({ isVisible: false });

      render(
        <DockablePanel title="Hidden Panel">
          <div>Content</div>
        </DockablePanel>
      );

      expect(screen.queryByText('Hidden Panel')).not.toBeInTheDocument();
    });

    it('renders when isVisible is true', () => {
      usePanelStore.setState({ isVisible: true });

      render(
        <DockablePanel title="Visible Panel">
          <div>Content</div>
        </DockablePanel>
      );

      expect(screen.getByText('Visible Panel')).toBeInTheDocument();
    });
  });

  describe('panel header', () => {
    it('renders close button', () => {
      render(
        <DockablePanel title="Test Panel">
          <div>Content</div>
        </DockablePanel>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('closes panel when close button is clicked', () => {
      render(
        <DockablePanel title="Test Panel">
          <div>Content</div>
        </DockablePanel>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(usePanelStore.getState().isVisible).toBe(false);
    });

    it('renders minimize button', () => {
      render(
        <DockablePanel title="Test Panel">
          <div>Content</div>
        </DockablePanel>
      );

      const minimizeButton = screen.getByRole('button', { name: /minimize|collapse/i });
      expect(minimizeButton).toBeInTheDocument();
    });

    it('collapses panel when minimize button is clicked', () => {
      render(
        <DockablePanel title="Test Panel">
          <div>Content</div>
        </DockablePanel>
      );

      const minimizeButton = screen.getByRole('button', { name: /minimize|collapse/i });
      fireEvent.click(minimizeButton);

      expect(usePanelStore.getState().isCollapsed).toBe(true);
    });
  });

  describe('resize handle', () => {
    it('renders resize handle', () => {
      render(
        <DockablePanel title="Test Panel">
          <div>Content</div>
        </DockablePanel>
      );

      const resizer = screen.getByTestId('panel-resizer');
      expect(resizer).toBeInTheDocument();
    });

    it('has correct aria attributes on resize handle', () => {
      render(
        <DockablePanel title="Test Panel">
          <div>Content</div>
        </DockablePanel>
      );

      const resizer = screen.getByTestId('panel-resizer');
      expect(resizer).toHaveAttribute('role', 'separator');
      expect(resizer).toHaveAttribute('aria-orientation');
    });
  });

  describe('collapsed state', () => {
    it('hides content when collapsed', () => {
      usePanelStore.setState({ isCollapsed: true });

      render(
        <DockablePanel title="Test Panel">
          <div data-testid="panel-content">Content</div>
        </DockablePanel>
      );

      // Content should not be visible when collapsed
      expect(screen.queryByTestId('panel-content')).not.toBeInTheDocument();
    });

    it('shows Tray label with grip icon when collapsed', () => {
      usePanelStore.setState({ isCollapsed: true });

      render(
        <DockablePanel title="Test Panel">
          <div>Content</div>
        </DockablePanel>
      );

      // Header should NOT be visible when collapsed (minimal design)
      expect(screen.queryByTestId('panel-header')).not.toBeInTheDocument();
      // Collapsed edge should be visible with "Tray" label
      expect(screen.getByTestId('panel-collapsed-edge')).toBeInTheDocument();
      expect(screen.getByText('Tray')).toBeInTheDocument();
    });

    it('expands when clicking collapsed edge', () => {
      usePanelStore.setState({ isCollapsed: true });

      render(
        <DockablePanel title="Test Panel">
          <div>Content</div>
        </DockablePanel>
      );

      const collapsedEdge = screen.getByTestId('panel-collapsed-edge');
      fireEvent.click(collapsedEdge);

      expect(usePanelStore.getState().isCollapsed).toBe(false);
    });

    it('toggles collapse on double-click of resizer', () => {
      usePanelStore.setState({ isCollapsed: false });

      render(
        <DockablePanel title="Test Panel">
          <div>Content</div>
        </DockablePanel>
      );

      const resizer = screen.getByTestId('panel-resizer');
      fireEvent.doubleClick(resizer);

      expect(usePanelStore.getState().isCollapsed).toBe(true);

      // Double-click again to expand
      fireEvent.doubleClick(resizer);
      expect(usePanelStore.getState().isCollapsed).toBe(false);
    });

    it('collapsed edge has cursor-pointer', () => {
      usePanelStore.setState({ isCollapsed: true });

      render(
        <DockablePanel title="Test Panel">
          <div>Content</div>
        </DockablePanel>
      );

      const collapsedEdge = screen.getByTestId('panel-collapsed-edge');
      expect(collapsedEdge).toHaveClass('cursor-pointer');
    });
  });

  describe('bottom dock position', () => {
    it('applies bottom dock styles', () => {
      usePanelStore.setState({ position: 'bottom' });

      render(
        <DockablePanel title="Test Panel">
          <div>Content</div>
        </DockablePanel>
      );

      const panel = screen.getByTestId('dockable-panel');
      // Bottom dock should have border-top
      expect(panel).toHaveClass('border-t');
    });

    it('resize handle is at top for bottom dock', () => {
      usePanelStore.setState({ position: 'bottom' });

      render(
        <DockablePanel title="Test Panel">
          <div>Content</div>
        </DockablePanel>
      );

      const resizer = screen.getByTestId('panel-resizer');
      expect(resizer).toHaveAttribute('aria-orientation', 'horizontal');
    });
  });

  describe('left dock position', () => {
    it('applies left dock styles', () => {
      usePanelStore.setState({ position: 'left' });

      render(
        <DockablePanel title="Test Panel">
          <div>Content</div>
        </DockablePanel>
      );

      const panel = screen.getByTestId('dockable-panel');
      // Left dock should have border-right
      expect(panel).toHaveClass('border-r');
    });

    it('resize handle has vertical orientation for left dock', () => {
      usePanelStore.setState({ position: 'left' });

      render(
        <DockablePanel title="Test Panel">
          <div>Content</div>
        </DockablePanel>
      );

      const resizer = screen.getByTestId('panel-resizer');
      expect(resizer).toHaveAttribute('aria-orientation', 'vertical');
    });
  });

  describe('right dock position', () => {
    it('applies right dock styles', () => {
      usePanelStore.setState({ position: 'right' });

      render(
        <DockablePanel title="Test Panel">
          <div>Content</div>
        </DockablePanel>
      );

      const panel = screen.getByTestId('dockable-panel');
      // Right dock should have border-left
      expect(panel).toHaveClass('border-l');
    });

    it('resize handle has vertical orientation for right dock', () => {
      usePanelStore.setState({ position: 'right' });

      render(
        <DockablePanel title="Test Panel">
          <div>Content</div>
        </DockablePanel>
      );

      const resizer = screen.getByTestId('panel-resizer');
      expect(resizer).toHaveAttribute('aria-orientation', 'vertical');
    });

    it('expands when clicking collapsed panel on right dock', async () => {
      const user = userEvent.setup();
      usePanelStore.setState({ position: 'right', isCollapsed: true });

      render(
        <DockablePanel title="Test Panel">
          <div data-testid="panel-content">Content</div>
        </DockablePanel>
      );

      // Content should be hidden when collapsed
      expect(screen.queryByTestId('panel-content')).not.toBeInTheDocument();

      // Click the panel to expand
      const panel = screen.getByTestId('dockable-panel');
      await user.click(panel);

      // Content should now be visible
      expect(screen.getByTestId('panel-content')).toBeInTheDocument();
      expect(usePanelStore.getState().isCollapsed).toBe(false);
    });

    it('expands when clicking resizer on collapsed right dock', async () => {
      const user = userEvent.setup();
      usePanelStore.setState({ position: 'right', isCollapsed: true });

      render(
        <DockablePanel title="Test Panel">
          <div data-testid="panel-content">Content</div>
        </DockablePanel>
      );

      // Content should be hidden when collapsed
      expect(screen.queryByTestId('panel-content')).not.toBeInTheDocument();

      // Click the resizer to expand
      const resizer = screen.getByTestId('panel-resizer');
      await user.click(resizer);

      // Content should now be visible
      expect(screen.getByTestId('panel-content')).toBeInTheDocument();
      expect(usePanelStore.getState().isCollapsed).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('has accessible panel structure', () => {
      render(
        <DockablePanel title="Network History">
          <div>Content</div>
        </DockablePanel>
      );

      // Panel should be a region or have appropriate landmark
      const panel = screen.getByTestId('dockable-panel');
      expect(panel).toBeInTheDocument();
    });

    it('buttons have accessible names', () => {
      render(
        <DockablePanel title="Test Panel">
          <div>Content</div>
        </DockablePanel>
      );

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /minimize|collapse/i })).toBeInTheDocument();
    });
  });

  describe('resize behavior', () => {
    it('allows shrinking panel without collapsing when staying above minimum', () => {
      // Start with an expanded panel at 400px
      usePanelStore.setState({
        position: 'bottom',
        isCollapsed: false,
        sizes: { bottom: 400, left: 300, right: 300 },
      });

      render(
        <DockablePanel title="Test Panel">
          <div data-testid="panel-content">Content</div>
        </DockablePanel>
      );

      const resizer = screen.getByTestId('panel-resizer');

      // Simulate drag from 400px to 300px (shrinking but still above minimum 180px)
      fireEvent.pointerDown(resizer, { clientY: 0 });
      fireEvent.pointerMove(resizer, { clientY: 100 }); // Move down = shrink (delta = -100)
      fireEvent.pointerUp(resizer, { clientY: 100 });

      // Panel should NOT collapse - it should resize to 300px
      expect(usePanelStore.getState().isCollapsed).toBe(false);
      // Content should still be visible
      expect(screen.getByTestId('panel-content')).toBeInTheDocument();
    });

    it('collapses panel when dragged below minimum size', () => {
      // Start with an expanded panel at 200px (just above minimum 180px)
      usePanelStore.setState({
        position: 'bottom',
        isCollapsed: false,
        sizes: { bottom: 200, left: 300, right: 300 },
      });

      render(
        <DockablePanel title="Test Panel">
          <div data-testid="panel-content">Content</div>
        </DockablePanel>
      );

      const resizer = screen.getByTestId('panel-resizer');

      // Simulate drag that would result in size below minimum (200 - delta = below 180)
      // Since bottom dock: drag down decreases height
      // startPos=0, currentPos=100 means delta = 0 - 100 = -100
      // finalSize = 200 + (-100) = 100 (below min 180)
      fireEvent.pointerDown(resizer, { clientY: 0 });
      fireEvent.pointerMove(resizer, { clientY: 100 }); // results in ~100px
      fireEvent.pointerUp(resizer, { clientY: 100 });

      // Panel SHOULD collapse when below minimum
      expect(usePanelStore.getState().isCollapsed).toBe(true);
    });

    it('allows growing panel from current size', () => {
      // Start with an expanded panel at 300px
      usePanelStore.setState({
        position: 'bottom',
        isCollapsed: false,
        sizes: { bottom: 300, left: 300, right: 300 },
      });

      render(
        <DockablePanel title="Test Panel">
          <div data-testid="panel-content">Content</div>
        </DockablePanel>
      );

      const resizer = screen.getByTestId('panel-resizer');

      // Simulate drag upward to grow (for bottom dock: drag up = grow)
      // startPos=0, currentPos=-100 means delta = 0 - (-100) = 100
      // finalSize = 300 + 100 = 400
      fireEvent.pointerDown(resizer, { clientY: 0 });
      fireEvent.pointerMove(resizer, { clientY: -100 }); // drag up = grow
      fireEvent.pointerUp(resizer, { clientY: -100 });

      // Panel should remain expanded and size should increase
      expect(usePanelStore.getState().isCollapsed).toBe(false);
      expect(usePanelStore.getState().sizes.bottom).toBe(400);
    });
  });
});
