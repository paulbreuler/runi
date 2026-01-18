import type { Meta, StoryObj } from '@storybook/react';
import { DockablePanel } from './DockablePanel';
import { usePanelStore, DEFAULT_PANEL_SIZES } from '@/stores/usePanelStore';
import { useEffect } from 'react';
import { NetworkHistoryPanel } from '../History/NetworkHistoryPanel';

const meta: Meta<typeof DockablePanel> = {
  title: 'Layout/DockablePanel',
  component: DockablePanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A DevTools-style dockable panel that can be resized and collapsed. Currently supports bottom docking.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="h-screen bg-bg-app flex flex-col">
        <div className="flex-1 p-4 text-text-secondary">Main content area - Panel docks below</div>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DockablePanel>;

/**
 * Default panel with sample content.
 */
export const Default: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        usePanelStore.setState({
          position: 'bottom',
          isVisible: true,
          isCollapsed: false,
          sizes: { ...DEFAULT_PANEL_SIZES },
          isPopout: false,
        });
      }, []);
      return <Story />;
    },
  ],
  render: () => (
    <DockablePanel title="Network History">
      <div className="p-4 text-text-secondary">
        Panel content goes here. Drag the top edge to resize.
      </div>
    </DockablePanel>
  ),
};

/**
 * Panel in collapsed state - click header to expand.
 */
export const Collapsed: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        usePanelStore.setState({
          position: 'bottom',
          isVisible: true,
          isCollapsed: true,
          sizes: { ...DEFAULT_PANEL_SIZES },
          isPopout: false,
        });
      }, []);
      return <Story />;
    },
  ],
  render: () => (
    <DockablePanel title="Network History">
      <div className="p-4 text-text-secondary">This content is hidden when collapsed.</div>
    </DockablePanel>
  ),
};

/**
 * Panel with NetworkHistoryPanel as content.
 */
export const WithNetworkHistory: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        usePanelStore.setState({
          position: 'bottom',
          isVisible: true,
          isCollapsed: false,
          sizes: { bottom: 350, left: 350, right: 350 },
          isPopout: false,
        });
      }, []);
      return <Story />;
    },
  ],
  render: () => (
    <DockablePanel title="Network History">
      <NetworkHistoryPanel
        onReplay={() => {
          // Story placeholder
        }}
        onCopyCurl={() => {
          // Story placeholder
        }}
      />
    </DockablePanel>
  ),
};

/**
 * Panel starts hidden - trigger visibility programmatically.
 */
export const Hidden: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        usePanelStore.setState({
          position: 'bottom',
          isVisible: false,
          isCollapsed: false,
          sizes: { ...DEFAULT_PANEL_SIZES },
          isPopout: false,
        });
      }, []);
      return <Story />;
    },
  ],
  render: () => (
    <DockablePanel title="Hidden Panel">
      <div className="p-4">This should not be visible.</div>
    </DockablePanel>
  ),
};

/**
 * Panel docked on the right side.
 */
export const RightDock: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        usePanelStore.setState({
          position: 'right',
          isVisible: true,
          isCollapsed: false,
          sizes: { bottom: 250, left: 350, right: 350 },
          isPopout: false,
        });
      }, []);
      return (
        <div className="h-screen bg-bg-app flex">
          <div className="flex-1 p-4 text-text-secondary">Main content - Panel docks on right</div>
          <Story />
        </div>
      );
    },
  ],
  render: () => (
    <DockablePanel title="Network History">
      <div className="p-4 text-text-secondary">Panel content. Drag left edge to resize.</div>
    </DockablePanel>
  ),
};

/**
 * Panel docked on the right side in collapsed state - click header to expand.
 */
export const RightDockCollapsed: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        usePanelStore.setState({
          position: 'right',
          isVisible: true,
          isCollapsed: true,
          sizes: { bottom: 250, left: 350, right: 350 },
          isPopout: false,
        });
      }, []);
      return (
        <div className="h-screen bg-bg-app flex">
          <div className="flex-1 p-4 text-text-secondary">
            Main content - Click the collapsed panel to expand
          </div>
          <Story />
        </div>
      );
    },
  ],
  render: () => (
    <DockablePanel title="Network History">
      <div className="p-4 text-text-secondary">This content is hidden when collapsed.</div>
    </DockablePanel>
  ),
};

/**
 * Panel docked on the left side.
 */
export const LeftDock: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        usePanelStore.setState({
          position: 'left',
          isVisible: true,
          isCollapsed: false,
          sizes: { bottom: 250, left: 350, right: 350 },
          isPopout: false,
        });
      }, []);
      return (
        <div className="h-screen bg-bg-app flex">
          <Story />
          <div className="flex-1 p-4 text-text-secondary">Main content - Panel docks on left</div>
        </div>
      );
    },
  ],
  render: () => (
    <DockablePanel title="Network History">
      <div className="p-4 text-text-secondary">Panel content. Drag right edge to resize.</div>
    </DockablePanel>
  ),
};

/**
 * Panel docked on the left side in collapsed state.
 */
export const LeftDockCollapsed: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        usePanelStore.setState({
          position: 'left',
          isVisible: true,
          isCollapsed: true,
          sizes: { bottom: 250, left: 350, right: 350 },
          isPopout: false,
        });
      }, []);
      return (
        <div className="h-screen bg-bg-app flex">
          <Story />
          <div className="flex-1 p-4 text-text-secondary">
            Main content - Click the collapsed panel to expand
          </div>
        </div>
      );
    },
  ],
  render: () => (
    <DockablePanel title="Network History">
      <div className="p-4 text-text-secondary">This content is hidden when collapsed.</div>
    </DockablePanel>
  ),
};
