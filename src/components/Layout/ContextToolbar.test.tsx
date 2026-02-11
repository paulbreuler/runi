import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { ContextToolbar } from './ContextToolbar';
import { FileText, LayoutGrid } from 'lucide-react';
import type { CanvasPanelProps, CanvasToolbarProps } from '@/types/canvas';
import * as useCanvasPopoutModule from '@/hooks/useCanvasPopout';

// Mock panel and toolbar components
const TestPanel = ({ panelId }: CanvasPanelProps): ReactElement => <div>Panel: {panelId}</div>;
const TestToolbar = ({ contextId }: CanvasToolbarProps): ReactElement => (
  <div data-test-id={`toolbar-${contextId}`}>Toolbar for {contextId}</div>
);

// Mock useCanvasPopout hook
vi.mock('@/hooks/useCanvasPopout');

describe('ContextToolbar', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
    vi.clearAllMocks();

    // Default mock for useCanvasPopout
    vi.mocked(useCanvasPopoutModule.useCanvasPopout).mockReturnValue({
      openPopout: vi.fn(),
      isSupported: true,
    });
  });

  it('returns null when no active context', () => {
    const { container } = render(<ContextToolbar />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when active context not found', () => {
    useCanvasStore.getState().setActiveContext('non-existent');
    const { container } = render(<ContextToolbar />);
    expect(container.firstChild).toBeNull();
  });

  it('renders toolbar component from context', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test Context',
      icon: FileText,
      panels: { panel1: TestPanel },
      toolbar: TestToolbar,
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

    render(<ContextToolbar />);

    expect(screen.getByTestId('toolbar-test-context')).toBeInTheDocument();
    expect(screen.getByText('Toolbar for test-context')).toBeInTheDocument();
  });

  it('renders LayoutPicker component', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test Context',
      icon: FileText,
      panels: { panel1: TestPanel },
      toolbar: TestToolbar,
      layouts: [
        {
          id: 'single',
          label: 'Single Panel',
          description: 'Single panel',
          icon: LayoutGrid,
          arrangement: { type: 'single', panel: 'panel1' },
          category: 'preset',
        },
      ],
    });

    render(<ContextToolbar />);

    expect(screen.getByTestId('layout-picker-trigger')).toBeInTheDocument();
  });

  it('shows popout button when supported', () => {
    vi.mocked(useCanvasPopoutModule.useCanvasPopout).mockReturnValue({
      openPopout: vi.fn(),
      isSupported: true,
    });

    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test Context',
      icon: FileText,
      panels: { panel1: TestPanel },
      toolbar: TestToolbar,
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

    render(<ContextToolbar />);

    const popoutButton = screen.getByTestId('popout-button');
    expect(popoutButton).toBeInTheDocument();
    expect(popoutButton).toHaveAttribute('aria-label', 'Open in new window');
  });

  it('hides popout button when not supported', () => {
    vi.mocked(useCanvasPopoutModule.useCanvasPopout).mockReturnValue({
      openPopout: vi.fn(),
      isSupported: false,
    });

    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test Context',
      icon: FileText,
      panels: { panel1: TestPanel },
      toolbar: TestToolbar,
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

    render(<ContextToolbar />);

    expect(screen.queryByTestId('popout-button')).not.toBeInTheDocument();
  });

  it('calls openPopout when popout button clicked', async () => {
    const user = userEvent.setup();
    const mockOpenPopout = vi.fn();

    vi.mocked(useCanvasPopoutModule.useCanvasPopout).mockReturnValue({
      openPopout: mockOpenPopout,
      isSupported: true,
    });

    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test Context',
      icon: FileText,
      panels: { panel1: TestPanel },
      toolbar: TestToolbar,
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

    render(<ContextToolbar />);

    const popoutButton = screen.getByTestId('popout-button');
    await user.click(popoutButton);

    expect(mockOpenPopout).toHaveBeenCalledWith('test-context');
  });

  it('does NOT render context tabs', () => {
    useCanvasStore.getState().registerContext({
      id: 'context-1',
      label: 'Context 1',
      icon: FileText,
      panels: { panel1: TestPanel },
      toolbar: TestToolbar,
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

    useCanvasStore.getState().registerContext({
      id: 'context-2',
      label: 'Context 2',
      icon: FileText,
      panels: { panel1: TestPanel },
      toolbar: TestToolbar,
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

    render(<ContextToolbar />);

    // Tabs should NOT be rendered (moved to TitleBar)
    expect(screen.queryByTestId('context-tabs')).not.toBeInTheDocument();
    expect(screen.queryByTestId('context-tab-context-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('context-tab-context-2')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test Context',
      icon: FileText,
      panels: { panel1: TestPanel },
      toolbar: TestToolbar,
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

    render(<ContextToolbar className="custom-class" />);

    expect(screen.getByTestId('context-toolbar')).toHaveClass('custom-class');
  });

  it('renders context-toolbar test-id', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test Context',
      icon: FileText,
      panels: { panel1: TestPanel },
      toolbar: TestToolbar,
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

    render(<ContextToolbar />);

    expect(screen.getByTestId('context-toolbar')).toBeInTheDocument();
  });

  it('handles context without toolbar component', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test Context',
      icon: FileText,
      panels: { panel1: TestPanel },
      // No toolbar component
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

    render(<ContextToolbar />);

    // Should still render the container with layout picker
    expect(screen.getByTestId('context-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('layout-picker-trigger')).toBeInTheDocument();
    // But no toolbar content
    expect(screen.queryByTestId('toolbar-test-context')).not.toBeInTheDocument();
  });
});
