import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { LayoutPicker } from './LayoutPicker';
import { FileText, Square, LayoutGrid } from 'lucide-react';
import type { CanvasPanelProps } from '@/types/canvas';

// Mock panel component
const TestPanel = ({ panelId }: CanvasPanelProps): ReactElement => <div>Panel: {panelId}</div>;

describe('LayoutPicker', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('returns null when no active context', () => {
    const { container } = render(<LayoutPicker />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when context not found', () => {
    useCanvasStore.setState({ activeContextId: 'non-existent' });
    const { container } = render(<LayoutPicker />);
    expect(container.firstChild).toBeNull();
  });

  it('shows active layout name in trigger', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test',
      icon: FileText,
      panels: { panel1: TestPanel },
      layouts: [
        {
          id: 'single',
          label: 'Single Panel',
          description: 'Single panel',
          icon: Square,
          arrangement: { type: 'single', panel: 'panel1' },
          category: 'preset',
        },
      ],
    });

    render(<LayoutPicker />);
    expect(screen.getByText('Single Panel')).toBeInTheDocument();
  });

  it('opens popover on click', async () => {
    const user = userEvent.setup();

    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test',
      icon: FileText,
      panels: { panel1: TestPanel },
      layouts: [
        {
          id: 'single',
          label: 'Single Panel',
          description: 'Single panel',
          icon: Square,
          arrangement: { type: 'single', panel: 'panel1' },
          category: 'preset',
        },
      ],
    });

    render(<LayoutPicker />);

    const trigger = screen.getByTestId('layout-picker-trigger');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('layout-picker-content')).toBeInTheDocument();
    });
  });

  it('renders preset layouts section', async () => {
    const user = userEvent.setup();

    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test',
      icon: FileText,
      panels: { panel1: TestPanel },
      layouts: [
        {
          id: 'preset-1',
          label: 'Preset Layout 1',
          description: 'Description 1',
          icon: Square,
          arrangement: { type: 'single', panel: 'panel1' },
          category: 'preset',
        },
        {
          id: 'preset-2',
          label: 'Preset Layout 2',
          description: 'Description 2',
          icon: LayoutGrid,
          arrangement: { type: 'single', panel: 'panel1' },
          category: 'preset',
        },
      ],
    });

    render(<LayoutPicker />);

    const trigger = screen.getByTestId('layout-picker-trigger');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Panel Layouts')).toBeInTheDocument();
      expect(screen.getAllByText('Preset Layout 1').length).toBeGreaterThan(0);
      expect(screen.getByText('Description 1')).toBeInTheDocument();
      expect(screen.getAllByText('Preset Layout 2').length).toBeGreaterThan(0);
      expect(screen.getByText('Description 2')).toBeInTheDocument();
    });
  });

  it('renders generic layouts section', async () => {
    const user = userEvent.setup();

    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test',
      icon: FileText,
      panels: { panel1: TestPanel },
      layouts: [
        {
          id: 'preset-1',
          label: 'Preset',
          description: 'Preset',
          icon: Square,
          arrangement: { type: 'single', panel: 'panel1' },
          category: 'preset',
        },
      ],
    });

    render(<LayoutPicker />);

    const trigger = screen.getByTestId('layout-picker-trigger');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Generic')).toBeInTheDocument();
      expect(screen.getByText('Single Panel')).toBeInTheDocument();
      expect(screen.getByText('Focus on one panel at a time')).toBeInTheDocument();
    });
  });

  it('shows separator between preset and generic sections', async () => {
    const user = userEvent.setup();

    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test',
      icon: FileText,
      panels: { panel1: TestPanel },
      layouts: [
        {
          id: 'preset-1',
          label: 'Preset',
          description: 'Preset',
          icon: Square,
          arrangement: { type: 'single', panel: 'panel1' },
          category: 'preset',
        },
      ],
    });

    render(<LayoutPicker />);

    const trigger = screen.getByTestId('layout-picker-trigger');
    await user.click(trigger);

    await waitFor(() => {
      const content = screen.getByTestId('layout-picker-content');
      const separators = content.querySelectorAll('.border-t');
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  it('highlights active layout with checkmark', async () => {
    const user = userEvent.setup();

    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test',
      icon: FileText,
      panels: { panel1: TestPanel },
      layouts: [
        {
          id: 'layout-1',
          label: 'Layout 1',
          description: 'First',
          icon: Square,
          arrangement: { type: 'single', panel: 'panel1' },
          category: 'preset',
        },
        {
          id: 'layout-2',
          label: 'Layout 2',
          description: 'Second',
          icon: LayoutGrid,
          arrangement: { type: 'single', panel: 'panel1' },
          category: 'preset',
        },
      ],
    });

    render(<LayoutPicker />);

    const trigger = screen.getByTestId('layout-picker-trigger');
    await user.click(trigger);

    await waitFor(() => {
      const activeOption = screen.getByTestId('layout-option-layout-1');
      expect(activeOption).toHaveClass('bg-bg-raised');
      expect(activeOption).toHaveClass('text-text-primary');
    });
  });

  it('closes popover and updates store when layout clicked', async () => {
    const user = userEvent.setup();

    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test',
      icon: FileText,
      panels: { panel1: TestPanel },
      layouts: [
        {
          id: 'layout-1',
          label: 'Layout 1',
          description: 'First',
          icon: Square,
          arrangement: { type: 'single', panel: 'panel1' },
          category: 'preset',
        },
        {
          id: 'layout-2',
          label: 'Layout 2',
          description: 'Second',
          icon: LayoutGrid,
          arrangement: { type: 'single', panel: 'panel1' },
          category: 'preset',
        },
      ],
    });

    render(<LayoutPicker />);

    const trigger = screen.getByTestId('layout-picker-trigger');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('layout-picker-content')).toBeInTheDocument();
    });

    const option = screen.getByTestId('layout-option-layout-2');
    await user.click(option);

    await waitFor(() => {
      expect(screen.queryByTestId('layout-picker-content')).not.toBeInTheDocument();
    });

    // Verify store was updated
    const activeLayout = useCanvasStore.getState().getActiveLayout('test-context');
    expect(activeLayout?.id).toBe('layout-2');
  });

  it('supports keyboard navigation with Enter key', async () => {
    const user = userEvent.setup();

    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test',
      icon: FileText,
      panels: { panel1: TestPanel },
      layouts: [
        {
          id: 'layout-1',
          label: 'Layout 1',
          description: 'First',
          icon: Square,
          arrangement: { type: 'single', panel: 'panel1' },
          category: 'preset',
        },
      ],
    });

    render(<LayoutPicker />);

    const trigger = screen.getByTestId('layout-picker-trigger');
    trigger.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByTestId('layout-picker-content')).toBeInTheDocument();
    });
  });

  it('supports keyboard navigation with Escape key', async () => {
    const user = userEvent.setup();

    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test',
      icon: FileText,
      panels: { panel1: TestPanel },
      layouts: [
        {
          id: 'layout-1',
          label: 'Layout 1',
          description: 'First',
          icon: Square,
          arrangement: { type: 'single', panel: 'panel1' },
          category: 'preset',
        },
      ],
    });

    render(<LayoutPicker />);

    const trigger = screen.getByTestId('layout-picker-trigger');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('layout-picker-content')).toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByTestId('layout-picker-content')).not.toBeInTheDocument();
    });
  });

  it('applies focus ring classes for accessibility', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test',
      icon: FileText,
      panels: { panel1: TestPanel },
      layouts: [
        {
          id: 'layout-1',
          label: 'Layout 1',
          description: 'First',
          icon: Square,
          arrangement: { type: 'single', panel: 'panel1' },
          category: 'preset',
        },
      ],
    });

    render(<LayoutPicker />);

    const trigger = screen.getByTestId('layout-picker-trigger');
    // focusRingClasses uses a more complex syntax, so just verify it has outline-none
    expect(trigger).toHaveClass('outline-none');
  });

  it('applies custom className', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test',
      icon: FileText,
      panels: { panel1: TestPanel },
      layouts: [
        {
          id: 'layout-1',
          label: 'Layout 1',
          description: 'First',
          icon: Square,
          arrangement: { type: 'single', panel: 'panel1' },
          category: 'preset',
        },
      ],
    });

    render(<LayoutPicker className="custom-class" />);

    const trigger = screen.getByTestId('layout-picker-trigger');
    expect(trigger).toHaveClass('custom-class');
  });
});
