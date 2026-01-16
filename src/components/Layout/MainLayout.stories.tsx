import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';
import { MainLayout } from './MainLayout';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { RequestBuilder } from '@/components/Request/RequestBuilder';
import { ResponseViewer } from '@/components/Response/ResponseViewer';
import type { HttpResponse } from '@/types/http';

const meta = {
  title: 'Components/Layout/MainLayout',
  component: MainLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The MainLayout provides a resizable three-column layout with sidebar, request pane, and response pane.

## Interactions
- **Sidebar resize**: Drag the sidebar edge to resize (256-500px range)
- **Sidebar collapse**: Drag LEFT to collapse, drag RIGHT to expand/resize
- **Sidebar toggle**: ⌘B (Mac) / Ctrl+B (Windows) or double-click the sash
- **Pane resize**: Drag the center divider to adjust request/response split (20-80%)

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
          <Button variant="ghost" size="sm">File</Button>
          <Button variant="ghost" size="sm">Edit</Button>
          <Button variant="ghost" size="sm">View</Button>
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
            <p>• Drag the sidebar edge <strong>LEFT</strong> → collapses</p>
            <p>• Drag the sidebar edge <strong>RIGHT</strong> → resizes</p>
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
 * Full integration with actual RequestBuilder and ResponseViewer components.
 */
export const FullIntegration: Story = {
  render: () => (
    <MainLayout
      requestContent={<RequestBuilder />}
      responseContent={<ResponseViewer response={sampleResponse} />}
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
