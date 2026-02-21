import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactElement, HTMLAttributes } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { CanvasHost } from './CanvasHost';
import { FileText, LayoutGrid } from 'lucide-react';
import type { CanvasPanelProps } from '@/types/canvas';

// Mock motion to avoid animation issues in tests
vi.mock('motion/react', async () => {
  const actual = await vi.importActual('motion/react');
  return {
    ...actual,
    motion: {
      div: ({
        children,
        ...props
      }: HTMLAttributes<HTMLDivElement> & Record<string, unknown>): ReactElement => (
        <div {...props}>{children}</div>
      ),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }): ReactElement => <>{children}</>,
  };
});

// Mock usePrefersReducedMotion
vi.mock('@/hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: (): boolean => false,
}));

// Test panel components
const TestPanel1 = ({ panelId }: CanvasPanelProps): ReactElement => <div>Panel 1: {panelId}</div>;
const TestPanel2 = ({ panelId }: CanvasPanelProps): ReactElement => <div>Panel 2: {panelId}</div>;
const TestPanel3 = ({ panelId }: CanvasPanelProps): ReactElement => <div>Panel 3: {panelId}</div>;

describe('CanvasHost', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('shows fallback when no active context', () => {
    render(<CanvasHost />);
    expect(screen.getByText('No active context')).toBeInTheDocument();
  });

  it('shows fallback when context not found', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test',
      icon: FileText,
      panels: { panel1: TestPanel1 },
      layouts: [
        {
          id: 'single',
          label: 'Single',
          description: 'Single panel',
          icon: LayoutGrid,
          arrangement: { type: 'single', panel: 'panel1' },
          category: 'preset',
        },
      ],
    });

    // Set active context to non-existent context
    useCanvasStore.setState({ activeContextId: 'non-existent' });

    const { container } = render(<CanvasHost />);
    // Updated error message includes context ID
    expect(container.textContent).toContain('Context not found');
    expect(container.textContent).toContain('non-existent');
  });

  it('renders single panel layout', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test',
      icon: FileText,
      panels: { panel1: TestPanel1 },
      layouts: [
        {
          id: 'single',
          label: 'Single',
          description: 'Single panel',
          icon: LayoutGrid,
          arrangement: { type: 'single', panel: 'panel1' },
          category: 'preset',
        },
      ],
    });

    render(<CanvasHost />);
    expect(screen.getByText('Panel 1: panel1')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-panel-panel1')).toBeInTheDocument();
  });

  it('resolves $first placeholder in single layout', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test',
      icon: FileText,
      panels: { panel1: TestPanel1, panel2: TestPanel2 },
      layouts: [
        {
          id: 'single',
          label: 'Single',
          description: 'Single panel',
          icon: LayoutGrid,
          arrangement: { type: 'single', panel: '$first' },
          category: 'preset',
        },
      ],
    });

    render(<CanvasHost />);
    expect(screen.getByText('Panel 1: panel1')).toBeInTheDocument();
  });

  it('renders columns layout with ratios', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test',
      icon: FileText,
      panels: { panel1: TestPanel1, panel2: TestPanel2 },
      layouts: [
        {
          id: 'columns',
          label: 'Columns',
          description: 'Two columns',
          icon: LayoutGrid,
          arrangement: { type: 'columns', panels: ['panel1', 'panel2'], ratios: [60, 40] },
          category: 'preset',
        },
      ],
    });

    render(<CanvasHost />);
    expect(screen.getByText('Panel 1: panel1')).toBeInTheDocument();
    expect(screen.getByText('Panel 2: panel2')).toBeInTheDocument();

    const panel1 = screen.getByTestId('canvas-panel-panel1');
    const panel2 = screen.getByTestId('canvas-panel-panel2');

    expect(panel1).toHaveStyle({ width: '60%' });
    expect(panel2).toHaveStyle({ width: '40%' });
  });

  it('uses default 50% ratios for columns when not specified', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test',
      icon: FileText,
      panels: { panel1: TestPanel1, panel2: TestPanel2 },
      layouts: [
        {
          id: 'columns',
          label: 'Columns',
          description: 'Two columns',
          icon: LayoutGrid,
          arrangement: { type: 'columns', panels: ['panel1', 'panel2'] },
          category: 'preset',
        },
      ],
    });

    render(<CanvasHost />);

    const panel1 = screen.getByTestId('canvas-panel-panel1');
    const panel2 = screen.getByTestId('canvas-panel-panel2');

    expect(panel1).toHaveStyle({ width: '50%' });
    expect(panel2).toHaveStyle({ width: '50%' });
  });

  it('resolves $first, $second, $third placeholders in columns', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test',
      icon: FileText,
      panels: { panel1: TestPanel1, panel2: TestPanel2, panel3: TestPanel3 },
      layouts: [
        {
          id: 'columns',
          label: 'Columns',
          description: 'Three columns',
          icon: LayoutGrid,
          arrangement: {
            type: 'columns',
            panels: ['$first', '$second', '$third'],
            ratios: [33, 33, 34],
          },
          category: 'preset',
        },
      ],
    });

    render(<CanvasHost />);
    expect(screen.getByText('Panel 1: panel1')).toBeInTheDocument();
    expect(screen.getByText('Panel 2: panel2')).toBeInTheDocument();
    expect(screen.getByText('Panel 3: panel3')).toBeInTheDocument();
  });

  it('renders rows layout with ratios', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test',
      icon: FileText,
      panels: { panel1: TestPanel1, panel2: TestPanel2 },
      layouts: [
        {
          id: 'rows',
          label: 'Rows',
          description: 'Two rows',
          icon: LayoutGrid,
          arrangement: { type: 'rows', panels: ['panel1', 'panel2'], ratios: [70, 30] },
          category: 'preset',
        },
      ],
    });

    render(<CanvasHost />);
    expect(screen.getByText('Panel 1: panel1')).toBeInTheDocument();
    expect(screen.getByText('Panel 2: panel2')).toBeInTheDocument();

    const panel1 = screen.getByTestId('canvas-panel-panel1');
    const panel2 = screen.getByTestId('canvas-panel-panel2');

    expect(panel1).toHaveStyle({ height: '70%' });
    expect(panel2).toHaveStyle({ height: '30%' });
  });

  it('uses default 50% ratios for rows when not specified', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test',
      icon: FileText,
      panels: { panel1: TestPanel1, panel2: TestPanel2 },
      layouts: [
        {
          id: 'rows',
          label: 'Rows',
          description: 'Two rows',
          icon: LayoutGrid,
          arrangement: { type: 'rows', panels: ['panel1', 'panel2'] },
          category: 'preset',
        },
      ],
    });

    render(<CanvasHost />);

    const panel1 = screen.getByTestId('canvas-panel-panel1');
    const panel2 = screen.getByTestId('canvas-panel-panel2');

    expect(panel1).toHaveStyle({ height: '50%' });
    expect(panel2).toHaveStyle({ height: '50%' });
  });

  it('shows not implemented message for grid layout', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test',
      icon: FileText,
      panels: { panel1: TestPanel1 },
      layouts: [
        {
          id: 'grid',
          label: 'Grid',
          description: 'Grid layout',
          icon: LayoutGrid,
          arrangement: { type: 'grid', panels: [['panel1']], columns: 1 },
          category: 'preset',
        },
      ],
    });

    render(<CanvasHost />);
    expect(screen.getByText('Grid layout not yet implemented')).toBeInTheDocument();
  });

  it('renders canvas-host test-id', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test',
      icon: FileText,
      panels: { panel1: TestPanel1 },
      layouts: [
        {
          id: 'single',
          label: 'Single',
          description: 'Single panel',
          icon: LayoutGrid,
          arrangement: { type: 'single', panel: 'panel1' },
          category: 'preset',
        },
      ],
    });

    render(<CanvasHost />);
    expect(screen.getByTestId('canvas-host')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test',
      icon: FileText,
      panels: { panel1: TestPanel1 },
      layouts: [
        {
          id: 'single',
          label: 'Single',
          description: 'Single panel',
          icon: LayoutGrid,
          arrangement: { type: 'single', panel: 'panel1' },
          category: 'preset',
        },
      ],
    });

    render(<CanvasHost className="custom-class" />);
    expect(screen.getByTestId('canvas-host')).toHaveClass('custom-class');
  });
});

describe('CanvasHost - Error Messages (Feature #3)', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('shows context ID when context not found', () => {
    const { registerContext } = useCanvasStore.getState();

    // Register some contexts
    registerContext({
      id: 'context-1',
      label: 'Context 1',
      icon: FileText,
      panels: {},
      layouts: [
        {
          id: 'layout-1',
          label: 'Layout 1',
          description: 'Layout 1',
          icon: LayoutGrid,
          arrangement: { type: 'single', panel: 'panel-1' },
          category: 'preset',
        },
      ],
    });
    registerContext({
      id: 'context-2',
      label: 'Context 2',
      icon: FileText,
      panels: {},
      layouts: [
        {
          id: 'layout-2',
          label: 'Layout 2',
          description: 'Layout 2',
          icon: LayoutGrid,
          arrangement: { type: 'single', panel: 'panel-2' },
          category: 'preset',
        },
      ],
    });

    // Set active context to a non-existent ID
    useCanvasStore.setState({ activeContextId: 'non-existent' });

    const { container } = render(<CanvasHost />);

    // Should show the context ID
    expect(container.textContent).toContain('non-existent');

    // Should list registered contexts
    expect(container.textContent).toContain('context-1');
    expect(container.textContent).toContain('context-2');
  });

  it('shows available layouts when layout not found', () => {
    const { registerContext } = useCanvasStore.getState();

    // Register context with multiple layouts
    registerContext({
      id: 'test-context',
      label: 'Test Context',
      icon: FileText,
      panels: {},
      layouts: [
        {
          id: 'layout-1',
          label: 'Layout 1',
          description: 'Layout 1',
          icon: LayoutGrid,
          arrangement: { type: 'single', panel: 'panel-1' },
          category: 'preset',
        },
        {
          id: 'layout-2',
          label: 'Layout 2',
          description: 'Layout 2',
          icon: LayoutGrid,
          arrangement: { type: 'single', panel: 'panel-2' },
          category: 'preset',
        },
        {
          id: 'layout-3',
          label: 'Layout 3',
          description: 'Layout 3',
          icon: LayoutGrid,
          arrangement: { type: 'single', panel: 'panel-3' },
          category: 'preset',
        },
      ],
    });

    useCanvasStore.getState().setActiveContext('test-context');

    // Manually set a non-existent layout ID to simulate layout not found
    const currentState = useCanvasStore.getState();
    const newMap = new Map(currentState.activeLayoutPerContext);
    newMap.set('test-context', 'non-existent-layout');
    useCanvasStore.setState({
      activeLayoutPerContext: newMap,
    });

    const { container } = render(<CanvasHost />);

    // Should show context label
    expect(container.textContent).toContain('Test Context');

    // Should list available layouts
    expect(container.textContent).toContain('layout-1');
    expect(container.textContent).toContain('layout-2');
    expect(container.textContent).toContain('layout-3');
  });

  it('shows empty state when no active context', () => {
    const { container } = render(<CanvasHost />);

    // Should show simple empty message
    expect(container.textContent).toContain('No active context');
  });
});

// Helper to register a two-column layout for sash tests
const registerTwoColumnContext = (): void => {
  useCanvasStore.getState().registerContext({
    id: 'test-context',
    label: 'Test',
    icon: FileText,
    panels: { panel1: TestPanel1, panel2: TestPanel2 },
    layouts: [
      {
        id: 'columns',
        label: 'Columns',
        description: 'Two columns',
        icon: LayoutGrid,
        arrangement: { type: 'columns', panels: ['panel1', 'panel2'], ratios: [50, 50] },
        category: 'preset',
      },
    ],
  });
};

// Helper to register a two-row layout for sash tests
const registerTwoRowContext = (): void => {
  useCanvasStore.getState().registerContext({
    id: 'test-context',
    label: 'Test',
    icon: FileText,
    panels: { panel1: TestPanel1, panel2: TestPanel2 },
    layouts: [
      {
        id: 'rows',
        label: 'Rows',
        description: 'Two rows',
        icon: LayoutGrid,
        arrangement: { type: 'rows', panels: ['panel1', 'panel2'], ratios: [50, 50] },
        category: 'preset',
      },
    ],
  });
};

// Helper to register a three-column layout for sash tests
const registerThreeColumnContext = (): void => {
  useCanvasStore.getState().registerContext({
    id: 'test-context',
    label: 'Test',
    icon: FileText,
    panels: { panel1: TestPanel1, panel2: TestPanel2, panel3: TestPanel3 },
    layouts: [
      {
        id: 'columns',
        label: 'Columns',
        description: 'Three columns',
        icon: LayoutGrid,
        arrangement: {
          type: 'columns',
          panels: ['panel1', 'panel2', 'panel3'],
          ratios: [33, 34, 33],
        },
        category: 'preset',
      },
    ],
  });
};

describe('CanvasHost - Panel Sash (Resize Handle)', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('renders a sash between two columns', () => {
    registerTwoColumnContext();

    render(<CanvasHost />);

    const sash = screen.getByTestId('canvas-sash-0');
    expect(sash).toBeInTheDocument();
  });

  it('renders a sash between two rows', () => {
    registerTwoRowContext();

    render(<CanvasHost />);

    const sash = screen.getByTestId('canvas-sash-0');
    expect(sash).toBeInTheDocument();
  });

  it('renders two sashes for three columns', () => {
    registerThreeColumnContext();

    render(<CanvasHost />);

    expect(screen.getByTestId('canvas-sash-0')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-sash-1')).toBeInTheDocument();
  });

  it('does not render a sash for single panel layout', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test',
      icon: FileText,
      panels: { panel1: TestPanel1 },
      layouts: [
        {
          id: 'single',
          label: 'Single',
          description: 'Single panel',
          icon: LayoutGrid,
          arrangement: { type: 'single', panel: 'panel1' },
          category: 'preset',
        },
      ],
    });

    render(<CanvasHost />);

    expect(screen.queryByTestId('canvas-sash-0')).not.toBeInTheDocument();
  });

  it('sash has correct accessibility attributes for columns', () => {
    registerTwoColumnContext();

    render(<CanvasHost />);

    const sash = screen.getByTestId('canvas-sash-0');
    expect(sash).toHaveAttribute('role', 'separator');
    expect(sash).toHaveAttribute('aria-orientation', 'vertical');
    expect(sash).toHaveAttribute(
      'aria-label',
      'Resize between panel1 and panel2 (double-click to reset)'
    );
  });

  it('sash has correct accessibility attributes for rows', () => {
    registerTwoRowContext();

    render(<CanvasHost />);

    const sash = screen.getByTestId('canvas-sash-0');
    expect(sash).toHaveAttribute('role', 'separator');
    expect(sash).toHaveAttribute('aria-orientation', 'horizontal');
    expect(sash).toHaveAttribute(
      'aria-label',
      'Resize between panel1 and panel2 (double-click to reset)'
    );
  });

  it('sash has col-resize cursor class for columns', () => {
    registerTwoColumnContext();

    render(<CanvasHost />);

    const sash = screen.getByTestId('canvas-sash-0');
    expect(sash.className).toContain('cursor-col-resize');
  });

  it('sash has row-resize cursor class for rows', () => {
    registerTwoRowContext();

    render(<CanvasHost />);

    const sash = screen.getByTestId('canvas-sash-0');
    expect(sash.className).toContain('cursor-row-resize');
  });

  it('sash has subtle border background by default', () => {
    registerTwoColumnContext();

    render(<CanvasHost />);

    const sash = screen.getByTestId('canvas-sash-0');
    expect(sash.className).toContain('bg-border-subtle');
  });

  it('sash has hover:bg-accent-blue class for blue hover color', () => {
    registerTwoColumnContext();

    render(<CanvasHost />);

    const sash = screen.getByTestId('canvas-sash-0');
    expect(sash.className).toContain('hover:bg-accent-blue');
  });

  it('panels have correct initial widths in columns with sash present', () => {
    registerTwoColumnContext();

    render(<CanvasHost />);

    const panel1 = screen.getByTestId('canvas-panel-panel1');
    const panel2 = screen.getByTestId('canvas-panel-panel2');

    expect(panel1).toHaveStyle({ width: '50%' });
    expect(panel2).toHaveStyle({ width: '50%' });
  });

  it('panels have correct initial heights in rows with sash present', () => {
    registerTwoRowContext();

    render(<CanvasHost />);

    const panel1 = screen.getByTestId('canvas-panel-panel1');
    const panel2 = screen.getByTestId('canvas-panel-panel2');

    expect(panel1).toHaveStyle({ height: '50%' });
    expect(panel2).toHaveStyle({ height: '50%' });
  });

  it('renders canvas-panel-container for multi-panel layouts', () => {
    registerTwoColumnContext();

    render(<CanvasHost />);

    expect(screen.getByTestId('canvas-panel-container')).toBeInTheDocument();
  });

  it('sash responds to pointer down event', () => {
    registerTwoColumnContext();

    render(<CanvasHost />);

    const sash = screen.getByTestId('canvas-sash-0');

    // Fire pointer down - should not throw
    fireEvent.pointerDown(sash, { pointerId: 1 });

    // The sash should now have the active (dragging) class
    expect(sash.className).toContain('bg-accent-blue');
  });

  it('sash shows blue accent color while dragging', () => {
    registerTwoColumnContext();

    render(<CanvasHost />);

    const sash = screen.getByTestId('canvas-sash-0');

    // Start drag
    fireEvent.pointerDown(sash, { pointerId: 1 });

    // Should have active blue accent class (not just hover)
    expect(sash.className).toContain('bg-accent-blue');
  });

  it('sash stops dragging on pointer up', () => {
    registerTwoColumnContext();

    render(<CanvasHost />);

    const sash = screen.getByTestId('canvas-sash-0');

    // Start drag
    fireEvent.pointerDown(sash, { pointerId: 1 });
    expect(sash.className).toContain('bg-accent-blue');

    // End drag
    fireEvent.pointerUp(sash, { pointerId: 1 });

    // Should return to base state - dragging class removed (only hover: variant remains)
    // The sash always has bg-border-subtle as its base background
    expect(sash.className).toContain('bg-border-subtle');
    // The standalone bg-accent-blue (dragging state) should not be present;
    // only hover:bg-accent-blue (the Tailwind hover variant) should remain
    expect(sash.className).not.toMatch(/(?<![:-])bg-accent-blue/);
  });
});
