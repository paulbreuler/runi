import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useRequestStoreRaw } from '@/stores/useRequestStore';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { ContextToolbar } from './ContextToolbar';
import { FileText, LayoutGrid } from 'lucide-react';
import type { CanvasPanelProps, CanvasToolbarProps } from '@/types/canvas';
import * as useCanvasPopoutModule from '@/hooks/useCanvasPopout';
import { setFlag, resetFeatureFlags } from '@/test-utils/featureFlags';
import { requestContextDescriptor } from '@/contexts/RequestContext';

const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]): unknown => mockInvoke(...args),
}));

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
    useRequestStoreRaw.setState({ contexts: {} });
    useCollectionStore.setState({ collections: [], summaries: [] });
    resetFeatureFlags();
    setFlag('canvas', 'popout', true);
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue(null);

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
      popoutEnabled: true,
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
      popoutEnabled: true,
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
      popoutEnabled: true,
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
      popoutEnabled: true,
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
      popoutEnabled: true,
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
      popoutEnabled: true,
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
      popoutEnabled: true,
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
      popoutEnabled: true,
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

  it('updates URL bar when active request context changes', async () => {
    const user = userEvent.setup();

    useRequestStoreRaw.getState().initContext('request-a', {
      method: 'GET',
      url: 'https://api.example.com/a',
      headers: {},
      body: '',
    });
    useRequestStoreRaw.getState().initContext('request-b', {
      method: 'GET',
      url: 'https://api.example.com/b',
      headers: {},
      body: '',
    });

    const requestTabContext = {
      icon: requestContextDescriptor.icon,
      panels: requestContextDescriptor.panels,
      toolbar: requestContextDescriptor.toolbar,
      layouts: requestContextDescriptor.layouts,
      popoutEnabled: true,
      contextType: 'request' as const,
      order: 10,
    };

    useCanvasStore.getState().registerContext({
      id: 'request-a',
      label: 'Request A',
      ...requestTabContext,
    });
    useCanvasStore.getState().registerContext({
      id: 'request-b',
      label: 'Request B',
      ...requestTabContext,
      order: 11,
    });

    act(() => {
      useCanvasStore.getState().setActiveContext('request-a');
    });

    render(<ContextToolbar />);

    const urlInput: HTMLInputElement = screen.getByTestId('url-input');
    await user.clear(urlInput);
    await user.type(urlInput, 'https://draft.local/unsent');
    expect(urlInput.value).toBe('https://draft.local/unsent');

    act(() => {
      useCanvasStore.getState().setActiveContext('request-b');
    });

    await waitFor(() => {
      const activeUrlInput: HTMLInputElement = screen.getByTestId('url-input');
      expect(activeUrlInput.value).toBe('https://api.example.com/b');
    });
  });

  it('renders context-toolbar test-id', () => {
    useCanvasStore.getState().registerContext({
      id: 'test-context',
      label: 'Test Context',
      icon: FileText,
      panels: { panel1: TestPanel },
      toolbar: TestToolbar,
      popoutEnabled: true,
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
      popoutEnabled: true,
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
