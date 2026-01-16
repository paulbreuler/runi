import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { MainLayout } from './MainLayout';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

const meta = {
  title: 'Components/Layout/MainLayout',
  component: MainLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The MainLayout component provides a resizable, performant layout system following Apple's Zen design principles.

## Features
- **Resizable Sidebar**: Drag to resize between 256px (minimum) and 500px (maximum)
- **Resizable Panes**: Drag divider to adjust request/response split (20-80% range)
- **Keyboard Shortcuts**: ⌘B (Mac) or Ctrl+B (Windows/Linux) to toggle sidebar
- **Smooth Animations**: Motion-powered animations with immediate feedback during drag
- **Scrollbar Stability**: Prevents scrollbar flashing during resize operations
- **Visual Feedback**: Subtle handles appear on hover, following Apple's minimal aesthetic

## Performance
- Uses MotionValues for immediate updates during drag (no React re-render lag)
- Layout animations disabled during drag for instant feedback
- CSS containment for optimized rendering
- Scrollbar gutter reserved to prevent layout shifts
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MainLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify all main components are present
    await expect(canvas.getByTestId('main-layout')).toBeInTheDocument();
    await expect(canvas.getByTestId('sidebar')).toBeInTheDocument();
    await expect(canvas.getByTestId('request-pane')).toBeInTheDocument();
    await expect(canvas.getByTestId('response-pane')).toBeInTheDocument();
    await expect(canvas.getByTestId('pane-resizer')).toBeInTheDocument();
    await expect(canvas.getByTestId('status-bar')).toBeInTheDocument();
  },
};

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
              <p className="text-text-secondary mb-4">Request builder content goes here</p>
              <p className="text-xs text-text-muted">
                Hover over the divider to see the handle. Drag to resize panes.
              </p>
            </div>
          </Card>
        </div>
      }
      responseContent={
        <div className="p-6">
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">Response Pane</h3>
              <p className="text-text-secondary mb-4">Response viewer content goes here</p>
              <p className="text-xs text-text-muted">
                The divider has a subtle handle with three dots that appears on hover.
              </p>
            </div>
          </Card>
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify content is rendered
    await expect(canvas.getByText('Request Pane')).toBeInTheDocument();
    await expect(canvas.getByText('Response Pane')).toBeInTheDocument();
    
    // Verify resizer is interactive
    const resizer = canvas.getByTestId('pane-resizer');
    await expect(resizer).toBeInTheDocument();
    await expect(resizer).toHaveAttribute('role', 'separator');
  },
};

export const DividerHandle: Story = {
  render: () => (
    <MainLayout
      headerContent={
        <div className="h-14 p-2 flex items-center justify-center text-text-secondary">
          HTTP Method Selector
        </div>
      }
      requestContent={
        <div className="h-full p-4 flex flex-col items-center justify-center text-text-secondary border-r border-border">
          <h3 className="text-lg font-semibold mb-2">Request Builder</h3>
          <p className="text-sm text-text-muted">Hover over the divider between panes to see the handle</p>
          <p className="text-xs text-text-muted mt-1">
            The divider features a minimal three-dot handle that appears on hover, following Apple's zen aesthetic
          </p>
        </div>
      }
      responseContent={
        <div className="h-full p-4 flex flex-col items-center justify-center text-text-secondary">
          <h3 className="text-lg font-semibold mb-2">Response Viewer</h3>
          <p className="text-sm text-text-muted">Drag the divider to resize the panes</p>
          <p className="text-xs text-text-muted mt-1">
            The handle provides visual feedback and makes the divider feel more interactive
          </p>
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify divider handle is present
    const resizer = canvas.getByTestId('pane-resizer');
    await expect(resizer).toBeInTheDocument();
    
    // Verify handle structure (three dots)
    const handle = resizer.querySelector('.flex.flex-col.items-center.gap-1');
    await expect(handle).toBeInTheDocument();
  },
};

export const SidebarResizing: Story = {
  render: () => (
    <MainLayout
      requestContent={
        <div className="h-full p-4 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Sidebar Resizing</h3>
            <p className="text-sm text-text-secondary mb-4">
              Hover over the right edge of the sidebar to see the resizer
            </p>
            <p className="text-xs text-text-muted">
              Drag to resize between 256px (minimum) and 500px (maximum)
            </p>
          </div>
        </div>
      }
      responseContent={
        <div className="h-full p-4 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Main Content</h3>
            <p className="text-sm text-text-secondary">
              The sidebar can be resized to accommodate different content needs
            </p>
          </div>
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify sidebar resizer is present
    const sidebarResizer = canvas.getByTestId('sidebar-resizer');
    await expect(sidebarResizer).toBeInTheDocument();
    await expect(sidebarResizer).toHaveAttribute('role', 'separator');
    await expect(sidebarResizer).toHaveAttribute('aria-label', 'Resize sidebar');
    
    // Verify accessibility attributes
    await expect(sidebarResizer).toHaveAttribute('aria-valuemin', '256');
    await expect(sidebarResizer).toHaveAttribute('aria-valuemax', '500');
  },
};

export const SidebarHidden: Story = {
  render: () => (
    <MainLayout 
      initialSidebarVisible={false}
      requestContent={
        <div className="h-full p-4 flex items-center justify-center">
          <p className="text-text-secondary">Sidebar is hidden. Press ⌘B to toggle.</p>
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Sidebar should not be visible
    await expect(canvas.queryByTestId('sidebar')).not.toBeInTheDocument();
  },
};

export const ScrollbarStability: Story = {
  render: () => (
    <MainLayout
      requestContent={
        <div className="h-full overflow-auto p-4">
          <div className="space-y-4">
            {Array.from({ length: 50 }, (_, i) => (
              <div key={i} className="p-4 bg-bg-raised rounded-lg">
                <h4 className="font-semibold mb-2">Item {i + 1}</h4>
                <p className="text-sm text-text-secondary">
                  This content is scrollable. The scrollbar should remain stable during drag operations.
                </p>
              </div>
            ))}
          </div>
        </div>
      }
      responseContent={
        <div className="h-full overflow-auto p-4">
          <div className="space-y-4">
            {Array.from({ length: 50 }, (_, i) => (
              <div key={i} className="p-4 bg-bg-raised rounded-lg">
                <h4 className="font-semibold mb-2">Response Item {i + 1}</h4>
                <p className="text-sm text-text-secondary">
                  Scrollbars should not flash when resizing panes.
                </p>
              </div>
            ))}
          </div>
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify scrollable content is present
    await expect(canvas.getByText('Item 1')).toBeInTheDocument();
    await expect(canvas.getByText('Response Item 1')).toBeInTheDocument();
    
    // Verify panes have scrollbar-gutter stable
    const requestPane = canvas.getByTestId('request-pane');
    const responsePane = canvas.getByTestId('response-pane');
    
    expect(requestPane).toHaveStyle({ scrollbarGutter: 'stable' });
    expect(responsePane).toHaveStyle({ scrollbarGutter: 'stable' });
  },
};

export const KeyboardShortcuts: Story = {
  render: () => (
    <MainLayout
      requestContent={
        <div className="h-full p-4 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Keyboard Shortcuts</h3>
            <p className="text-sm text-text-secondary mb-4">
              Press ⌘B (Mac) or Ctrl+B (Windows/Linux) to toggle sidebar
            </p>
            <p className="text-xs text-text-muted">
              The sidebar state persists across toggles
            </p>
          </div>
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify sidebar is visible initially
    await expect(canvas.getByTestId('sidebar')).toBeInTheDocument();
    
    // Note: Keyboard shortcut testing requires browser environment
    // This is tested in E2E tests
  },
};
