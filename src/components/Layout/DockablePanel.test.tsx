import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

    it('still shows title when collapsed', () => {
      usePanelStore.setState({ isCollapsed: true });

      render(
        <DockablePanel title="Test Panel">
          <div>Content</div>
        </DockablePanel>
      );

      expect(screen.getByText('Test Panel')).toBeInTheDocument();
    });

    it('expands when clicking collapsed bar', () => {
      usePanelStore.setState({ isCollapsed: true });

      render(
        <DockablePanel title="Test Panel">
          <div>Content</div>
        </DockablePanel>
      );

      const header = screen.getByTestId('panel-header');
      fireEvent.click(header);

      expect(usePanelStore.getState().isCollapsed).toBe(false);
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
});
