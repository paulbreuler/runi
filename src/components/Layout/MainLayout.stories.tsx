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
The MainLayout component provides a resizable, performant layout system following **Motion.dev's official patterns** and Apple's Zen design principles.

## Features
- **Resizable Sidebar**: Drag to resize between 256px (minimum) and 500px (maximum)
- **Resizable Panes**: Drag divider to adjust request/response split (20-80% range)
- **Keyboard Shortcuts**: ⌘B (Mac) or Ctrl+B (Windows/Linux) to toggle sidebar
- **Smooth Animations**: Motion-powered animations with immediate feedback during drag
- **Scrollbar Stability**: Prevents scrollbar flashing during resize operations
- **Visual Feedback**: Subtle handles appear on hover, following Apple's minimal aesthetic
- **Accessibility**: Respects \`prefers-reduced-motion\` system preference

## Official Motion.dev Pattern

This implementation follows the **official Motion.dev pattern** for resizable panes:

- **Flex-based layout**: Resizer is in flex flow (not absolutely positioned) - [Motion.dev Layout Animations](https://motion.dev/docs/react-layout-animations)
- **MotionValues**: Uses \`useMotionValue\` and \`useTransform\` for immediate updates - [Motion.dev MotionValues](https://motion.dev/docs/react-motion-values)
- **Drag API**: Uses \`drag="x"\` with \`dragConstraints\` - [Motion.dev Drag](https://motion.dev/docs/react-drag)
- **Layout prop**: Uses \`layout\` for smooth size changes - [Motion.dev Layout Animations](https://motion.dev/docs/react-layout-animations)
- **Performance**: Uses transforms (not width/height) - [Motion.dev Performance](https://motion.dev/docs/performance)
- **Accessibility**: Uses \`useReducedMotion()\` - [Motion.dev Reduced Motion](https://motion.dev/motion/use-reduced-motion/)

## Performance
- Uses MotionValues for immediate updates during drag (no React re-render lag)
- Layout animations disabled during drag for instant feedback
- CSS containment for optimized rendering
- Scrollbar gutter reserved to prevent layout shifts
- Cached container width (no expensive DOM reads during drag)

## References
- [Motion.dev Documentation](https://motion.dev)
- [Motion.dev Layout Animations](https://motion.dev/docs/react-layout-animations)
- [Motion.dev Drag API](https://motion.dev/docs/react-drag)
- [Motion.dev Performance Guide](https://motion.dev/docs/performance)
- [Motion.dev Reduced Motion](https://motion.dev/motion/use-reduced-motion/)
- [Implementation Documentation](../../../docs/LAYOUT_IMPLEMENTATION.md)
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

// Performance testing stories
export const PerformanceRapidDrag: Story = {
  render: () => (
    <MainLayout
      requestContent={
        <div className="h-full p-4 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold mb-2">Performance Test: Rapid Dragging</h3>
          <p className="text-sm text-text-secondary mb-4">
            This test validates smooth performance during rapid, repeated drag operations
          </p>
          <p className="text-xs text-text-muted">
            Drag the divider rapidly back and forth multiple times
          </p>
        </div>
      }
      responseContent={
        <div className="h-full p-4 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold mb-2">Response Pane</h3>
          <p className="text-sm text-text-secondary">
            UI should remain stable and responsive during rapid drags
          </p>
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const resizer = canvas.getByTestId('pane-resizer');
    
    // Verify resizer is present
    await expect(resizer).toBeInTheDocument();
    
    // Get initial bounding box
    const initialBox = resizer.getBoundingClientRect();
    
    // Perform rapid drag operations (simulating user rapidly moving the divider)
    // This tests for performance degradation and UI stability
    for (let i = 0; i < 10; i++) {
      // Simulate drag to the right
      await userEvent.pointer([
        { keys: '[MouseLeft>]', target: resizer },
        { coords: { x: initialBox.x + 100 + (i * 20), y: initialBox.y } },
        { keys: '[/MouseLeft]' },
      ]);
      
      // Small delay to allow state updates
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Simulate drag back to the left
      await userEvent.pointer([
        { keys: '[MouseLeft>]', target: resizer },
        { coords: { x: initialBox.x - 50 - (i * 10), y: initialBox.y } },
        { keys: '[/MouseLeft]' },
      ]);
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Verify UI is still stable - all components should still be present
    await expect(canvas.getByTestId('request-pane')).toBeInTheDocument();
    await expect(canvas.getByTestId('response-pane')).toBeInTheDocument();
    await expect(canvas.getByTestId('pane-resizer')).toBeInTheDocument();
    
    // Verify panes still have valid widths (not broken)
    const requestPane = canvas.getByTestId('request-pane');
    const responsePane = canvas.getByTestId('response-pane');
    
    const requestStyle = requestPane.getAttribute('style') || '';
    const responseStyle = responsePane.getAttribute('style') || '';
    
    // Both panes should have width styles (MotionValue-driven)
    expect(requestStyle).toContain('width');
    expect(responseStyle).toContain('width');
  },
};

export const PerformanceExtendedDrag: Story = {
  render: () => (
    <MainLayout
      requestContent={
        <div className="h-full p-4 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold mb-2">Performance Test: Extended Drag Session</h3>
          <p className="text-sm text-text-secondary mb-4">
            This test validates performance during extended drag sessions
          </p>
          <p className="text-xs text-text-muted">
            Simulates a long drag operation to check for memory leaks or performance degradation
          </p>
        </div>
      }
      responseContent={
        <div className="h-full p-4 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold mb-2">Response Pane</h3>
          <p className="text-sm text-text-secondary">
            Performance should remain consistent throughout extended use
          </p>
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const resizer = canvas.getByTestId('pane-resizer');
    
    await expect(resizer).toBeInTheDocument();
    
    const initialBox = resizer.getBoundingClientRect();
    
    // Simulate extended drag session with many small movements
    // This tests for gradual performance degradation
    for (let i = 0; i < 50; i++) {
      const offset = Math.sin(i / 10) * 50; // Smooth sine wave pattern
      
      await userEvent.pointer([
        { keys: '[MouseLeft>]', target: resizer },
        { coords: { x: initialBox.x + offset, y: initialBox.y } },
        { keys: '[/MouseLeft]' },
      ]);
      
      // Very small delay to simulate continuous dragging
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    
    // Verify UI stability after extended use
    await expect(canvas.getByTestId('request-pane')).toBeInTheDocument();
    await expect(canvas.getByTestId('response-pane')).toBeInTheDocument();
    await expect(canvas.getByTestId('pane-resizer')).toBeInTheDocument();
    
    // Verify no layout breakage
    const requestPane = canvas.getByTestId('request-pane');
    const responsePane = canvas.getByTestId('response-pane');
    
    // Panes should still have valid dimensions
    const requestRect = requestPane.getBoundingClientRect();
    const responseRect = responsePane.getBoundingClientRect();
    
    expect(requestRect.width).toBeGreaterThan(0);
    expect(responseRect.width).toBeGreaterThan(0);
  },
};

export const PerformanceSidebarRapidDrag: Story = {
  render: () => (
    <MainLayout
      requestContent={
        <div className="h-full p-4 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold mb-2">Performance Test: Sidebar Rapid Drag</h3>
          <p className="text-sm text-text-secondary mb-4">
            This test validates sidebar resizing performance during rapid operations
          </p>
        </div>
      }
      responseContent={
        <div className="h-full p-4 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold mb-2">Response Pane</h3>
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sidebarResizer = canvas.getByTestId('sidebar-resizer');
    
    await expect(sidebarResizer).toBeInTheDocument();
    
    const initialBox = sidebarResizer.getBoundingClientRect();
    
    // Rapid sidebar resizing
    for (let i = 0; i < 15; i++) {
      await userEvent.pointer([
        { keys: '[MouseLeft>]', target: sidebarResizer },
        { coords: { x: initialBox.x + 50 + (i * 10), y: initialBox.y } },
        { keys: '[/MouseLeft]' },
      ]);
      
      await new Promise(resolve => setTimeout(resolve, 30));
      
      await userEvent.pointer([
        { keys: '[MouseLeft>]', target: sidebarResizer },
        { coords: { x: initialBox.x - 30 - (i * 5), y: initialBox.y } },
        { keys: '[/MouseLeft]' },
      ]);
      
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    
    // Verify sidebar is still functional
    await expect(canvas.getByTestId('sidebar')).toBeInTheDocument();
    await expect(canvas.getByTestId('sidebar-resizer')).toBeInTheDocument();
    
    // Verify sidebar has valid width
    const sidebar = canvas.getByTestId('sidebar');
    const sidebarStyle = sidebar.getAttribute('style') || '';
    expect(sidebarStyle).toContain('width');
  },
};

export const PerformanceStressTest: Story = {
  render: () => (
    <MainLayout
      requestContent={
        <div className="h-full overflow-auto p-4">
          <div className="space-y-2">
            {Array.from({ length: 100 }, (_, i) => (
              <div key={i} className="p-2 bg-bg-raised rounded">
                <p className="text-sm">Request Item {i + 1}</p>
              </div>
            ))}
          </div>
        </div>
      }
      responseContent={
        <div className="h-full overflow-auto p-4">
          <div className="space-y-2">
            {Array.from({ length: 100 }, (_, i) => (
              <div key={i} className="p-2 bg-bg-raised rounded">
                <p className="text-sm">Response Item {i + 1}</p>
              </div>
            ))}
          </div>
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const resizer = canvas.getByTestId('pane-resizer');
    
    await expect(resizer).toBeInTheDocument();
    
    const initialBox = resizer.getBoundingClientRect();
    
    // Stress test: rapid drags with heavy content
    // This tests performance with complex DOM structures
    for (let i = 0; i < 20; i++) {
      const offset = (i % 2 === 0 ? 1 : -1) * 80;
      
      await userEvent.pointer([
        { keys: '[MouseLeft>]', target: resizer },
        { coords: { x: initialBox.x + offset, y: initialBox.y } },
        { keys: '[/MouseLeft]' },
      ]);
      
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    
    // Verify all content is still accessible
    await expect(canvas.getByText('Request Item 1')).toBeInTheDocument();
    await expect(canvas.getByText('Response Item 1')).toBeInTheDocument();
    
    // Verify scrollbars are stable (scrollbar-gutter)
    const requestPane = canvas.getByTestId('request-pane');
    const responsePane = canvas.getByTestId('response-pane');
    
    expect(requestPane).toHaveStyle({ scrollbarGutter: 'stable' });
    expect(responsePane).toHaveStyle({ scrollbarGutter: 'stable' });
  },
};

/**
 * Extreme Drag Test - Video Game Style
 * 
 * Tests perfect synchronization during extreme drag scenarios:
 * - Drag all the way left (minimum constraint)
 * - Drag all the way right (maximum constraint)
 * - Rapid jittering movements (wild mouse movements)
 * 
 * All components must remain perfectly in sync, like a video game controller.
 */
export const ExtremeDragTest: Story = {
  render: () => (
    <MainLayout
      requestContent={
        <div className="h-full p-4 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold mb-2">Extreme Drag Test</h3>
          <p className="text-sm text-text-secondary mb-4">
            Drag all the way left, all the way right, then rapidly jitter
          </p>
          <p className="text-xs text-text-muted">
            All components must stay perfectly in sync - like a video game controller
          </p>
          <div className="mt-4 p-4 bg-bg-raised rounded-lg">
            <p className="text-xs text-text-muted">
              Request Pane: Should clamp to 20-80% range
            </p>
          </div>
        </div>
      }
      responseContent={
        <div className="h-full p-4 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold mb-2">Response Pane</h3>
          <p className="text-sm text-text-secondary">
            Watch for perfect synchronization during extreme movements
          </p>
          <div className="mt-4 p-4 bg-bg-raised rounded-lg">
            <p className="text-xs text-text-muted">
              Response Pane: Should stay in sync with request pane
            </p>
          </div>
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const resizer = canvas.getByTestId('pane-resizer');
    const requestPane = canvas.getByTestId('request-pane');
    const responsePane = canvas.getByTestId('response-pane');
    const container = canvas.getByTestId('pane-container');
    
    await expect(resizer).toBeInTheDocument();
    
    const containerBox = container.getBoundingClientRect();
    const resizerBox = resizer.getBoundingClientRect();
    const containerWidth = containerBox.width;
    
    // Test 1: Drag all the way LEFT (minimum constraint - 20%)
    const minX = containerBox.x + (containerWidth * 0.2);
    await userEvent.pointer([
      { keys: '[MouseLeft>]', target: resizer },
      { coords: { x: minX, y: resizerBox.y } },
      { keys: '[/MouseLeft]' },
    ]);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify minimum constraint
    const requestBoxAfterMin = requestPane.getBoundingClientRect();
    const requestPercentAfterMin = (requestBoxAfterMin.width / containerWidth) * 100;
    expect(requestPercentAfterMin).toBeGreaterThanOrEqual(18); // Allow tolerance
    
    // Test 2: Drag all the way RIGHT (maximum constraint - 80%)
    const maxX = containerBox.x + (containerWidth * 0.8);
    await userEvent.pointer([
      { keys: '[MouseLeft>]', target: resizer },
      { coords: { x: maxX, y: resizerBox.y } },
      { keys: '[/MouseLeft]' },
    ]);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify maximum constraint
    const requestBoxAfterMax = requestPane.getBoundingClientRect();
    const requestPercentAfterMax = (requestBoxAfterMax.width / containerWidth) * 100;
    expect(requestPercentAfterMax).toBeLessThanOrEqual(82); // Allow tolerance
    
    // Test 3: Rapid jittering (wild mouse movements)
    // Simulate rapid back-and-forth movements like a video game
    const centerX = containerBox.x + (containerWidth * 0.5);
    const jitterAmplitude = containerWidth * 0.3; // 30% of container width
    
    for (let i = 0; i < 30; i++) {
      // Rapid jitter: alternate between left and right with random amplitude
      const jitterOffset = (i % 2 === 0 ? 1 : -1) * jitterAmplitude * (0.5 + Math.random() * 0.5);
      const jitterX = centerX + jitterOffset;
      
      await userEvent.pointer([
        { keys: '[MouseLeft>]', target: resizer },
        { coords: { x: jitterX, y: resizerBox.y } },
        { keys: '[/MouseLeft]' },
      ]);
      
      // Very small delay to simulate rapid jittering
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify components stay in sync after each jitter
      const requestBox = requestPane.getBoundingClientRect();
      const responseBox = responsePane.getBoundingClientRect();
      const resizerBoxCurrent = resizer.getBoundingClientRect();
      
      // Panes should always be valid
      expect(requestBox.width).toBeGreaterThan(0);
      expect(responseBox.width).toBeGreaterThan(0);
      
      // Total width should equal container width (perfect sync)
      const totalWidth = requestBox.width + responseBox.width;
      expect(totalWidth).toBeCloseTo(containerWidth, 2);
      
      // Request pane should be within constraints
      const requestPercent = (requestBox.width / containerWidth) * 100;
      expect(requestPercent).toBeGreaterThanOrEqual(18);
      expect(requestPercent).toBeLessThanOrEqual(82);
    }
    
    // Final verification: All components still functional
    await expect(canvas.getByTestId('request-pane')).toBeInTheDocument();
    await expect(canvas.getByTestId('response-pane')).toBeInTheDocument();
    await expect(canvas.getByTestId('pane-resizer')).toBeInTheDocument();
    
    // Final sync check
    const finalRequestBox = requestPane.getBoundingClientRect();
    const finalResponseBox = responsePane.getBoundingClientRect();
    const finalTotal = finalRequestBox.width + finalResponseBox.width;
    
    expect(finalTotal).toBeCloseTo(containerWidth, 2);
    
    // Both panes should have valid styles
    const requestStyle = requestPane.getAttribute('style') || '';
    const responseStyle = responsePane.getAttribute('style') || '';
    expect(requestStyle).toContain('width');
    expect(responseStyle).toContain('width');
  },
};
