import type { Meta, StoryObj } from '@storybook/react';
import { DockablePanel } from './DockablePanel';
import { usePanelStore, DEFAULT_PANEL_SIZES } from '@/stores/usePanelStore';
import { useEffect, useState } from 'react';
import { NetworkHistoryPanel } from '../History/NetworkHistoryPanel';
import { PanelTabs, type PanelTabType } from '@/components/PanelTabs';
import { ConsolePanel } from '../Console/ConsolePanel';
import { PanelContent } from '@/components/PanelContent';

const meta: Meta<typeof DockablePanel> = {
  title: 'Layout/DockablePanel',
  component: DockablePanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `A DevTools-style dockable panel that can be resized and collapsed. Supports bottom, left, and right docking positions.

## Features

- **Resizable**: Drag edges to resize panel (bottom: vertical, left/right: horizontal)
- **Collapsible**: Click minimize button or double-click resizer to collapse to minimal size (28px)
- **Dockable**: Supports three positions - bottom (full width), left, and right
- **Horizontal Scroll**: Header content scrolls horizontally when space is constrained, with animated overflow cues
- **Motion Animations**: Smooth spring-based animations for size changes and content transitions
- **PanelTabs Integration**: Works seamlessly with PanelTabs for tab switching

## Usage

\`\`\`tsx
<DockablePanel
  title="DevTools"
  headerContent={<PanelTabs activeTab={activeTab} onTabChange={setActiveTab} />}
>
  <PanelContent
    activeTab={activeTab}
    networkContent={<NetworkHistoryPanel />}
    consoleContent={<ConsolePanel />}
  />
</DockablePanel>
\`\`\`

## Animation Details

- **Size Changes**: Uses spring physics (stiffness: 300, damping: 30, mass: 0.8) for natural resizing
- **Content Transitions**: Integrates with PanelContent for smooth fade transitions
- **Scroll Cues**: Animated gradient overlays indicate scrollable content
- **Reduced Motion**: Respects user's \`prefers-reduced-motion\` setting

## Resize Behavior

- **Bottom dock**: Drag top edge vertically
- **Left dock**: Drag right edge horizontally
- **Right dock**: Drag left edge horizontally
- **Double-click resizer**: Toggle collapse/expand
- **Minimum sizes**: Enforced to prevent panel from becoming unusable

## Accessibility

- Keyboard navigation for controls
- ARIA labels for screen readers
- Focus management during resize operations`,
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
 * Demonstrates the complete DockablePanel experience with tab switching.
 * Panel is docked at the bottom with default size.
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
 * Panel in collapsed state - shows minimal "tray" edge (28px).
 * Click the collapsed edge or double-click the resizer to expand.
 * When collapsed, header and content are hidden, showing only the tray grip indicator.
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
 * Panel with PanelTabs and real NetworkHistoryPanel/ConsolePanel components.
 * Demonstrates the complete integration with actual components and Motion animations.
 * Switch tabs to see content transitions.
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
        <PanelContent
          activeTab={activeTab}
          networkContent={
            <NetworkHistoryPanel
              onReplay={() => {
                // Story placeholder
              }}
              onCopyCurl={() => {
                // Story placeholder
              }}
            />
          }
          consoleContent={<ConsolePanel />}
        />
      </DockablePanel>
    );
  },
};

/**
 * Panel with NetworkHistoryPanel as content (without PanelTabs).
 * Shows the panel in a simpler configuration with just Network History content.
 * Useful for demonstrating the panel without tab switching.
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
 * Panel starts hidden (isVisible: false).
 * Demonstrates the panel's hidden state. The panel is not rendered when hidden.
 * Use this to test programmatic visibility control.
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
 * Demonstrates horizontal docking. Drag the left edge to resize.
 * Header content will scroll horizontally if space is constrained.
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
 * Panel docked on the right side in collapsed state.
 * Shows the minimal 28px edge on the right. Click to expand or drag to resize.
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
 * Demonstrates horizontal docking on the left. Drag the right edge to resize.
 * Header content will scroll horizontally if space is constrained.
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
 * Shows the minimal 28px edge on the left. Click to expand or drag to resize.
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
 * Panel with long header content to demonstrate horizontal scroll behavior.
 * When docked left/right with constrained width, header content scrolls horizontally.
 * Animated gradient cues appear on the edges to indicate scrollable content.
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
