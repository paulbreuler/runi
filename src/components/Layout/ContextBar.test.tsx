import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { ContextBar } from './ContextBar';
import { FileText, LayoutGrid, BookOpen } from 'lucide-react';
import type { CanvasPanelProps } from '@/types/canvas';

// Mock panel component
const TestPanel = ({ panelId }: CanvasPanelProps): ReactElement => <div>Panel: {panelId}</div>;

describe('ContextBar', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('renders all registered contexts as tabs', () => {
    useCanvasStore.getState().registerContext({
      id: 'context-1',
      label: 'Context 1',
      icon: FileText,
      panels: { panel1: TestPanel },
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
      order: 1,
    });

    useCanvasStore.getState().registerContext({
      id: 'context-2',
      label: 'Context 2',
      icon: BookOpen,
      panels: { panel1: TestPanel },
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
      order: 2,
    });

    render(<ContextBar />);

    expect(screen.getByText('Context 1')).toBeInTheDocument();
    expect(screen.getByText('Context 2')).toBeInTheDocument();
  });

  it('shows context icon and label', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test Context',
      icon: FileText,
      panels: { panel1: TestPanel },
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

    render(<ContextBar />);

    const tab = screen.getByTestId('context-tab-test-context');
    expect(tab).toBeInTheDocument();
    expect(screen.getByText('Test Context')).toBeInTheDocument();
  });

  it('highlights active context with underline', () => {
    useCanvasStore.getState().registerContext({
      id: 'context-1',
      label: 'Context 1',
      icon: FileText,
      panels: { panel1: TestPanel },
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
      icon: BookOpen,
      panels: { panel1: TestPanel },
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

    render(<ContextBar />);

    const activeTab = screen.getByTestId('context-tab-context-1');
    expect(activeTab).toHaveClass('bg-bg-app');
    expect(activeTab).toHaveClass('text-text-primary');

    const indicator = screen.getByTestId('active-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('bg-accent-blue');
  });

  it('switches context on tab click', async () => {
    const user = userEvent.setup();

    useCanvasStore.getState().registerContext({
      id: 'context-1',
      label: 'Context 1',
      icon: FileText,
      panels: { panel1: TestPanel },
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
      icon: BookOpen,
      panels: { panel1: TestPanel },
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

    render(<ContextBar />);

    const tab2 = screen.getByTestId('context-tab-context-2');
    await user.click(tab2);

    await waitFor(() => {
      expect(useCanvasStore.getState().activeContextId).toBe('context-2');
    });
  });

  it('renders LayoutPicker component', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test Context',
      icon: FileText,
      panels: { panel1: TestPanel },
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

    render(<ContextBar />);

    // LayoutPicker renders the trigger with layout name
    expect(screen.getByText('Single Panel')).toBeInTheDocument();
    expect(screen.getByTestId('layout-picker-trigger')).toBeInTheDocument();
  });

  it('renders popout button', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test Context',
      icon: FileText,
      panels: { panel1: TestPanel },
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

    render(<ContextBar />);

    const popoutButton = screen.getByTestId('popout-button');
    expect(popoutButton).toBeInTheDocument();
    expect(popoutButton).toHaveAttribute('aria-label', 'Open in new window');
  });

  it('logs to console when popout button clicked (placeholder for Phase 5)', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test Context',
      icon: FileText,
      panels: { panel1: TestPanel },
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

    render(<ContextBar />);

    const popoutButton = screen.getByTestId('popout-button');
    await user.click(popoutButton);

    expect(consoleSpy).toHaveBeenCalledWith('Popout requested');

    consoleSpy.mockRestore();
  });

  it('uses ARIA tablist pattern', () => {
    useCanvasStore.getState().registerContext({
      id: 'context-1',
      label: 'Context 1',
      icon: FileText,
      panels: { panel1: TestPanel },
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

    render(<ContextBar />);

    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();

    const tab = screen.getByRole('tab', { name: /Context 1/i });
    expect(tab).toBeInTheDocument();
    expect(tab).toHaveAttribute('aria-selected', 'true');
  });

  it('supports keyboard navigation with Enter key', async () => {
    const user = userEvent.setup();

    useCanvasStore.getState().registerContext({
      id: 'context-1',
      label: 'Context 1',
      icon: FileText,
      panels: { panel1: TestPanel },
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
      icon: BookOpen,
      panels: { panel1: TestPanel },
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

    render(<ContextBar />);

    const tab2 = screen.getByTestId('context-tab-context-2');
    tab2.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(useCanvasStore.getState().activeContextId).toBe('context-2');
    });
  });

  it('applies focus ring classes for accessibility', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test Context',
      icon: FileText,
      panels: { panel1: TestPanel },
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

    render(<ContextBar />);

    const tab = screen.getByTestId('context-tab-test-context');
    // focusRingClasses uses a more complex syntax, so just verify it has outline-none
    expect(tab).toHaveClass('outline-none');

    const popoutButton = screen.getByTestId('popout-button');
    expect(popoutButton).toHaveClass('outline-none');
  });

  it('applies custom className', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test Context',
      icon: FileText,
      panels: { panel1: TestPanel },
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

    render(<ContextBar className="custom-class" />);

    expect(screen.getByTestId('context-bar')).toHaveClass('custom-class');
  });

  it('renders context-bar test-id', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test Context',
      icon: FileText,
      panels: { panel1: TestPanel },
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

    render(<ContextBar />);

    expect(screen.getByTestId('context-bar')).toBeInTheDocument();
  });

  it('renders context-tabs test-id', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test Context',
      icon: FileText,
      panels: { panel1: TestPanel },
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

    render(<ContextBar />);

    expect(screen.getByTestId('context-tabs')).toBeInTheDocument();
  });
});
