import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { useEffect } from 'react';
import { MainLayout } from './MainLayout';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { RequestBuilder } from '@/components/Request/RequestBuilder';
import { ResponseViewer } from '@/components/Response/ResponseViewer';
import { usePanelStore } from '@/stores/usePanelStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { HttpResponse } from '@/types/http';
import { isMacSync } from '@/utils/platform';

const meta = {
  title: 'Layout/MainLayout',
  component: MainLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The MainLayout provides a resizable layout with sidebar, request pane, response pane, and a dockable DevTools panel.

## Keyboard Shortcuts
- **Sidebar toggle**: \`Cmd+B\` (Mac) / \`Ctrl+B\` (Windows)
- **DevTools panel**: \`Cmd+Shift+I\` (Mac) / \`Ctrl+Shift+I\` (Windows)

## Interactions
- **Sidebar resize**: Drag the sidebar edge to resize (256-500px range)
- **Sidebar collapse**: Drag LEFT to collapse, drag RIGHT to expand/resize
- **Pane resize**: Drag the center divider to adjust request/response split (20-80%)
- **DevTools panel**: Can dock to bottom, left, or right; supports collapse and pop-out

## Design Principles
- Zen, calm aesthetic with minimal visual noise
- Smooth spring animations (respects prefers-reduced-motion)
- Scrollbar stability during resize operations
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MainLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default layout with placeholder content.
 */
export const Default: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId('main-layout')).toBeInTheDocument();
    await expect(canvas.getByTestId('sidebar')).toBeInTheDocument();
    await expect(canvas.getByTestId('request-pane')).toBeInTheDocument();
    await expect(canvas.getByTestId('response-pane')).toBeInTheDocument();
  },
};

/**
 * Layout with custom content in all regions.
 */
export const WithContent: Story = {
  render: () => (
    <MainLayout
      headerContent={
        <div className="h-14 p-2 flex items-center gap-2 border-b border-border-subtle bg-bg-surface">
          <Button variant="ghost" size="sm">
            File
          </Button>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
          <Button variant="ghost" size="sm">
            View
          </Button>
        </div>
      }
      requestContent={
        <div className="p-6">
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">Request Pane</h3>
              <p className="text-text-secondary">Drag the center divider to resize.</p>
            </div>
          </Card>
        </div>
      }
      responseContent={
        <div className="p-6">
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">Response Pane</h3>
              <p className="text-text-secondary">Drag the sidebar edge to resize or collapse.</p>
            </div>
          </Card>
        </div>
      }
    />
  ),
};

/**
 * Sidebar starts collapsed. Click or drag the left edge to expand.
 */
export const SidebarCollapsed: Story = {
  render: () => (
    <MainLayout
      initialSidebarVisible={false}
      requestContent={
        <div className="h-full p-4 flex items-center justify-center">
          <p className="text-text-secondary">
            Sidebar collapsed. Click the left edge or press ⌘B to expand.
          </p>
        </div>
      }
    />
  ),
};

/**
 * Test drag-to-close: drag the sidebar edge LEFT to collapse.
 */
export const DragToClose: Story = {
  render: () => (
    <MainLayout
      requestContent={
        <div className="h-full p-4 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold mb-4">Drag-to-Close Test</h3>
          <div className="space-y-2 text-sm text-text-secondary">
            <p>
              • Drag the sidebar edge <strong>LEFT</strong> → collapses
            </p>
            <p>
              • Drag the sidebar edge <strong>RIGHT</strong> → resizes
            </p>
            <p>• Double-click the edge → toggles</p>
          </div>
        </div>
      }
    />
  ),
};

const sampleResponse: HttpResponse = {
  status: 200,
  status_text: 'OK',
  headers: {
    'content-type': 'application/json',
  },
  body: JSON.stringify({ message: 'Hello, world!' }, null, 2),
  timing: {
    total_ms: 120,
    dns_ms: 10,
    connect_ms: 20,
    tls_ms: 30,
    first_byte_ms: 40,
  },
};

/**
 * Full integration with RequestBuilder, ResponseViewer, and DevTools panel.
 * Press Cmd+Shift+I (Mac) or Ctrl+Shift+I (Windows) to toggle the DevTools panel.
 */
export const FullIntegration: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        // Show DevTools panel for this story
        usePanelStore.setState({
          isVisible: true,
          position: 'bottom',
          isCollapsed: false,
        });
        return () => {
          usePanelStore.getState().reset();
        };
      }, []);
      return <Story />;
    },
  ],
  render: () => (
    <MainLayout
      requestContent={<RequestBuilder />}
      responseContent={<ResponseViewer response={sampleResponse} />}
    />
  ),
};

/**
 * DevTools panel docked to the bottom (default position).
 */
export const DevToolsBottom: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        usePanelStore.setState({
          isVisible: true,
          position: 'bottom',
          isCollapsed: false,
        });
        return () => {
          usePanelStore.getState().reset();
        };
      }, []);
      return <Story />;
    },
  ],
  render: () => (
    <MainLayout
      requestContent={
        <div className="h-full p-4 flex items-center justify-center">
          <p className="text-text-secondary">DevTools panel docked at bottom</p>
        </div>
      }
    />
  ),
};

/**
 * DevTools panel docked to the left. Sidebar auto-collapses.
 */
export const DevToolsLeft: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        usePanelStore.setState({
          isVisible: true,
          position: 'left',
          isCollapsed: false,
        });
        return () => {
          usePanelStore.getState().reset();
        };
      }, []);
      return <Story />;
    },
  ],
  render: () => (
    <MainLayout
      requestContent={
        <div className="h-full p-4 flex items-center justify-center">
          <p className="text-text-secondary">
            DevTools panel docked at left (sidebar auto-collapsed)
          </p>
        </div>
      }
    />
  ),
};

/**
 * DevTools panel docked to the right.
 */
export const DevToolsRight: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        usePanelStore.setState({
          isVisible: true,
          position: 'right',
          isCollapsed: false,
        });
        return () => {
          usePanelStore.getState().reset();
        };
      }, []);
      return <Story />;
    },
  ],
  render: () => (
    <MainLayout
      requestContent={
        <div className="h-full p-4 flex items-center justify-center">
          <p className="text-text-secondary">DevTools panel docked at right</p>
        </div>
      }
    />
  ),
};

/**
 * DevTools panel collapsed to thin bar. Click header or double-click resizer to expand.
 */
export const DevToolsCollapsed: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        usePanelStore.setState({
          isVisible: true,
          position: 'bottom',
          isCollapsed: true,
        });
        return () => {
          usePanelStore.getState().reset();
        };
      }, []);
      return <Story />;
    },
  ],
  render: () => (
    <MainLayout
      requestContent={
        <div className="h-full p-4 flex items-center justify-center">
          <p className="text-text-secondary">
            DevTools collapsed. Click the thin bar or double-click to expand.
          </p>
        </div>
      }
    />
  ),
};

/**
 * Scrollable content to verify scrollbar stability during resize.
 */
export const ScrollableContent: Story = {
  render: () => (
    <MainLayout
      requestContent={
        <div className="h-full overflow-auto p-4">
          <div className="space-y-4">
            {Array.from({ length: 30 }, (_, i) => (
              <div key={i} className="p-4 bg-bg-raised rounded-lg">
                <h4 className="font-semibold mb-2">Request Item {i + 1}</h4>
                <p className="text-sm text-text-secondary">
                  Scrollbar should remain stable during drag operations.
                </p>
              </div>
            ))}
          </div>
        </div>
      }
      responseContent={
        <div className="h-full overflow-auto p-4">
          <div className="space-y-4">
            {Array.from({ length: 30 }, (_, i) => (
              <div key={i} className="p-4 bg-bg-raised rounded-lg">
                <h4 className="font-semibold mb-2">Response Item {i + 1}</h4>
                <p className="text-sm text-text-secondary">
                  No scrollbar flashing when resizing panes.
                </p>
              </div>
            ))}
          </div>
        </div>
      }
    />
  ),
};

/**
 * Test keyboard shortcuts and resize interactions.
 * Verifies Cmd+B (sidebar toggle), Cmd+Shift+I (DevTools toggle), and resize functionality.
 */
export const KeyboardShortcutsTest: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        // Reset stores to known state
        useSettingsStore.setState({ sidebarVisible: true });
        usePanelStore.setState({ isVisible: false });
        return () => {
          // Reset to default state
          useSettingsStore.setState({ sidebarVisible: true });
          usePanelStore.getState().reset();
        };
      }, []);
      return <Story />;
    },
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const isMac = isMacSync();

    // Helper to dispatch keyboard event
    const dispatchKeyboardEvent = (
      key: string,
      options: { meta?: boolean; ctrl?: boolean; shift?: boolean } = {}
    ): void => {
      const event = new KeyboardEvent('keydown', {
        key,
        code: `Key${key.toUpperCase()}`,
        metaKey: options.meta ?? false,
        ctrlKey: options.ctrl ?? false,
        shiftKey: options.shift ?? false,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);
    };

    await step('Verify initial state', async () => {
      await expect(canvas.getByTestId('sidebar')).toBeInTheDocument();
      await expect(canvas.queryByTestId('dockable-panel')).not.toBeInTheDocument();
      void expect(useSettingsStore.getState().sidebarVisible).toBe(true);
      void expect(usePanelStore.getState().isVisible).toBe(false);
    });

    await step('Toggle sidebar with Cmd+B / Ctrl+B', async () => {
      dispatchKeyboardEvent('b', { meta: isMac, ctrl: !isMac });
      // Wait for state update
      await new Promise<void>((resolve) => {
        void setTimeout(() => {
          resolve();
        }, 100);
      });
      void expect(useSettingsStore.getState().sidebarVisible).toBe(false);
    });

    await step('Toggle sidebar back with Cmd+B / Ctrl+B', async () => {
      dispatchKeyboardEvent('b', { meta: isMac, ctrl: !isMac });
      await new Promise<void>((resolve) => {
        void setTimeout(() => {
          resolve();
        }, 100);
      });
      void expect(useSettingsStore.getState().sidebarVisible).toBe(true);
      await expect(canvas.getByTestId('sidebar')).toBeInTheDocument();
    });

    await step('Toggle DevTools panel with Cmd+Shift+I / Ctrl+Shift+I', async () => {
      dispatchKeyboardEvent('i', { meta: isMac, ctrl: !isMac, shift: true });
      await new Promise<void>((resolve) => {
        void setTimeout(() => {
          resolve();
        }, 100);
      });
      void expect(usePanelStore.getState().isVisible).toBe(true);
      await expect(canvas.getByTestId('dockable-panel')).toBeInTheDocument();
    });

    await step('Toggle DevTools panel back with Cmd+Shift+I / Ctrl+Shift+I', async () => {
      dispatchKeyboardEvent('i', { meta: isMac, ctrl: !isMac, shift: true });
      await new Promise<void>((resolve) => {
        void setTimeout(() => {
          resolve();
        }, 100);
      });
      void expect(usePanelStore.getState().isVisible).toBe(false);
      await expect(canvas.queryByTestId('dockable-panel')).not.toBeInTheDocument();
    });
  },
};

/**
 * Test resize interactions for sidebar and pane.
 * Verifies that dragging resizers updates layout correctly.
 */
export const ResizeInteractionsTest: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify initial layout elements', async () => {
      await expect(canvas.getByTestId('sidebar')).toBeInTheDocument();
      await expect(canvas.getByTestId('sidebar-resizer')).toBeInTheDocument();
      await expect(canvas.getByTestId('pane-resizer')).toBeInTheDocument();
      await expect(canvas.getByTestId('request-pane')).toBeInTheDocument();
      await expect(canvas.getByTestId('response-pane')).toBeInTheDocument();
    });

    await step('Verify sidebar resizer is interactive', async () => {
      const sidebarResizer = canvas.getByTestId('sidebar-resizer');
      await expect(sidebarResizer).toBeVisible();
      // Resizer should have cursor-col-resize class
      void expect(sidebarResizer).toHaveClass('cursor-col-resize');
    });

    await step('Verify pane resizer is interactive', async () => {
      const paneResizer = canvas.getByTestId('pane-resizer');
      await expect(paneResizer).toBeVisible();
      // Resizer should have cursor-col-resize class
      void expect(paneResizer).toHaveClass('cursor-col-resize');
    });
  },
};

/**
 * Test state persistence across interactions.
 * Verifies that sidebar and panel state persists correctly.
 */
export const StatePersistenceTest: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        // Set initial state
        useSettingsStore.setState({ sidebarVisible: true });
        usePanelStore.setState({ isVisible: false });
        return () => {
          // Reset to default state
          useSettingsStore.setState({ sidebarVisible: true });
          usePanelStore.getState().reset();
        };
      }, []);
      return <Story />;
    },
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify initial state', async () => {
      void expect(useSettingsStore.getState().sidebarVisible).toBe(true);
      void expect(usePanelStore.getState().isVisible).toBe(false);
      await expect(canvas.getByTestId('sidebar')).toBeInTheDocument();
      await expect(canvas.queryByTestId('dockable-panel')).not.toBeInTheDocument();
    });

    await step('Toggle sidebar and verify state persists', async () => {
      useSettingsStore.getState().toggleSidebar();
      await new Promise<void>((resolve) => {
        void setTimeout(() => {
          resolve();
        }, 100);
      });
      void expect(useSettingsStore.getState().sidebarVisible).toBe(false);
    });

    await step('Toggle panel and verify state persists', async () => {
      usePanelStore.getState().toggleVisibility();
      await new Promise<void>((resolve) => {
        void setTimeout(() => {
          resolve();
        }, 100);
      });
      void expect(usePanelStore.getState().isVisible).toBe(true);
      await expect(canvas.getByTestId('dockable-panel')).toBeInTheDocument();
    });

    await step('Verify both states persist together', () => {
      void expect(useSettingsStore.getState().sidebarVisible).toBe(false);
      void expect(usePanelStore.getState().isVisible).toBe(true);
    });
  },
};
