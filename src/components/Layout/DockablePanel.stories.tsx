import type { Meta, StoryObj } from '@storybook/react';
import { DockablePanel } from './DockablePanel';
import { usePanelStore, DEFAULT_PANEL_SIZES } from '@/stores/usePanelStore';
import { useEffect, useState } from 'react';
import { NetworkHistoryPanel } from '../History/NetworkHistoryPanel';
import { PanelTabs, type PanelTabType } from '@/components/PanelTabs';
import { ConsolePanel } from '../Console/ConsolePanel';

const meta: Meta<typeof DockablePanel> = {
  title: 'Layout/DockablePanel',
  component: DockablePanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A DevTools-style dockable panel that can be resized and collapsed. Supports bottom, left, and right docking. Features horizontal scroll for header content when space is constrained, and integrates with PanelTabs for tab switching with Motion animations.',
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
 * Default panel with PanelTabs and sample content.
 * This demonstrates the complete DockablePanel experience with tab switching.
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
  render: () => {
    const [activeTab, setActiveTab] = useState<PanelTabType>('network');
    return (
      <DockablePanel
        title="DevTools"
        headerContent={
          <PanelTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            networkCount={12}
            consoleCount={5}
          />
        }
      >
        {activeTab === 'network' ? (
          <div className="p-4 text-text-secondary">
            Network History content. Switch to Console tab to see console content.
          </div>
        ) : (
          <div className="p-4 text-text-secondary">Console content goes here.</div>
        )}
      </DockablePanel>
    );
  },
};

/**
 * Panel in collapsed state - click header to expand.
 * PanelTabs are hidden when collapsed (header is not visible).
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
  render: () => {
    const [activeTab, setActiveTab] = useState<PanelTabType>('network');
    return (
      <DockablePanel
        title="DevTools"
        headerContent={
          <PanelTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            networkCount={12}
            consoleCount={5}
          />
        }
      >
        <div className="p-4 text-text-secondary">This content is hidden when collapsed.</div>
      </DockablePanel>
    );
  },
};

/**
 * Panel with PanelTabs and NetworkHistoryPanel/ConsolePanel content.
 * Demonstrates the complete integration with real components and Motion animations.
 */
export const WithRealContent: Story = {
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
  render: () => {
    const [activeTab, setActiveTab] = useState<PanelTabType>('network');
    return (
      <DockablePanel
        title="DevTools"
        headerContent={
          <PanelTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            networkCount={12}
            consoleCount={5}
          />
        }
      >
        {activeTab === 'network' ? (
          <NetworkHistoryPanel
            onReplay={() => {
              // Story placeholder
            }}
            onCopyCurl={() => {
              // Story placeholder
            }}
          />
        ) : (
          <ConsolePanel />
        )}
      </DockablePanel>
    );
  },
};

/**
 * Panel with NetworkHistoryPanel as content (without PanelTabs).
 * Shows the panel with just Network History content.
 */
export const WithNetworkHistoryOnly: Story = {
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
 * Panel docked on the right side with PanelTabs.
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
  render: () => {
    const [activeTab, setActiveTab] = useState<PanelTabType>('network');
    return (
      <DockablePanel
        title="DevTools"
        headerContent={
          <PanelTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            networkCount={8}
            consoleCount={3}
          />
        }
      >
        {activeTab === 'network' ? (
          <div className="p-4 text-text-secondary">
            Network History content. Drag left edge to resize.
          </div>
        ) : (
          <div className="p-4 text-text-secondary">Console content.</div>
        )}
      </DockablePanel>
    );
  },
};

/**
 * Panel docked on the right side in collapsed state - click to expand.
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
  render: () => {
    const [activeTab, setActiveTab] = useState<PanelTabType>('network');
    return (
      <DockablePanel
        title="DevTools"
        headerContent={
          <PanelTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            networkCount={8}
            consoleCount={3}
          />
        }
      >
        <div className="p-4 text-text-secondary">This content is hidden when collapsed.</div>
      </DockablePanel>
    );
  },
};

/**
 * Panel docked on the left side with PanelTabs.
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
  render: () => {
    const [activeTab, setActiveTab] = useState<PanelTabType>('network');
    return (
      <DockablePanel
        title="DevTools"
        headerContent={
          <PanelTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            networkCount={8}
            consoleCount={3}
          />
        }
      >
        {activeTab === 'network' ? (
          <div className="p-4 text-text-secondary">
            Network History content. Drag right edge to resize.
          </div>
        ) : (
          <div className="p-4 text-text-secondary">Console content.</div>
        )}
      </DockablePanel>
    );
  },
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
  render: () => {
    const [activeTab, setActiveTab] = useState<PanelTabType>('network');
    return (
      <DockablePanel
        title="DevTools"
        headerContent={
          <PanelTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            networkCount={8}
            consoleCount={3}
          />
        }
      >
        <div className="p-4 text-text-secondary">This content is hidden when collapsed.</div>
      </DockablePanel>
    );
  },
};

/**
 * Panel with long header content to demonstrate horizontal scroll.
 * When docked left/right with constrained width, header content scrolls.
 */
export const WithHorizontalScroll: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        usePanelStore.setState({
          position: 'left',
          isVisible: true,
          isCollapsed: false,
          sizes: { bottom: 250, left: 200, right: 350 }, // Narrow width to trigger scroll
          isPopout: false,
        });
      }, []);
      return (
        <div className="h-screen bg-bg-app flex">
          <Story />
          <div className="flex-1 p-4 text-text-secondary">
            Main content - Panel is narrow to show horizontal scroll in header
          </div>
        </div>
      );
    },
  ],
  render: () => {
    const [activeTab, setActiveTab] = useState<PanelTabType>('network');
    return (
      <DockablePanel
        title="DevTools"
        headerContent={
          <div className="flex items-center gap-4 min-w-max">
            <PanelTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              networkCount={999}
              consoleCount={42}
            />
            <span className="text-xs text-text-muted whitespace-nowrap">
              Additional header content that will scroll
            </span>
          </div>
        }
      >
        <div className="p-4 text-text-secondary">
          Panel content. Resize the panel to see horizontal scroll in action when header content
          overflows.
        </div>
      </DockablePanel>
    );
  },
};
