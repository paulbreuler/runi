import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { DockablePanel } from './DockablePanel';
import { usePanelStore, DEFAULT_PANEL_SIZES } from '@/stores/usePanelStore';
import { useEffect, useState } from 'react';
import { NetworkHistoryPanel } from '../History/NetworkHistoryPanel';
import { PanelTabs, type PanelTabType } from '@/components/PanelTabs';
import { ConsolePanel } from '../Console/ConsolePanel';
import { PanelContent } from '@/components/PanelContent';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { getConsoleService } from '@/services/console-service';
import type { NetworkHistoryEntry } from '@/types/history';

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
      <div className="h-screen bg-bg-app flex flex-col overflow-hidden">
        <div className="p-2 text-xs text-text-muted shrink-0">
          Main content area - Panel docks below
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <Story />
        </div>
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

        // Populate history store with mock entries
        const statusTextMap: Record<number, string> = {
          200: 'OK',
          201: 'Created',
          404: 'Not Found',
          500: 'Server Error',
        };
        const mockEntries: NetworkHistoryEntry[] = Array.from({ length: 12 }, (_, i) => {
          const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
          const statuses = [200, 201, 404, 500];
          const method = methods[i % methods.length] as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
          const status = statuses[i % statuses.length] ?? 200;
          return {
            id: `hist_${String(i + 1)}`,
            timestamp: new Date(Date.now() - (i + 1) * 60 * 1000).toISOString(),
            request: {
              url: `https://api.example.com/${i === 0 ? 'users' : `resource/${String(i)}`}`,
              method,
              headers: { 'Content-Type': 'application/json' },
              body: method === 'POST' || method === 'PUT' ? '{"data":"test"}' : null,
              timeout_ms: 30000,
            },
            response: {
              status,
              status_text: statusTextMap[status] ?? 'Unknown',
              headers: { 'Content-Type': 'application/json' },
              body: status === 204 ? '' : '{"id":' + String(i + 1) + '}',
              timing: {
                total_ms: 100 + i * 10,
                dns_ms: 5 + i,
                connect_ms: 10 + i,
                tls_ms: 15 + i,
                first_byte_ms: 50 + i * 5,
              },
            },
            intelligence: {
              boundToSpec: i % 2 === 0,
              specOperation: i % 2 === 0 ? `operation${String(i)}` : null,
              drift:
                i === 2
                  ? { type: 'response' as const, fields: ['status'], message: 'Unexpected field' }
                  : null,
              aiGenerated: i === 1,
              verified: i % 3 === 0,
            },
          };
        });

        useHistoryStore.setState({ entries: mockEntries });

        // Populate console service with mock logs
        const consoleService = getConsoleService();
        consoleService.clear();
        // Set min log level to debug so all logs are visible
        consoleService.setMinLogLevel('debug');
        const mockLogs = [
          { level: 'info' as const, message: 'Application started', args: [] },
          { level: 'info' as const, message: 'Loading user data...', args: [] },
          { level: 'warn' as const, message: 'Deprecated API endpoint used', args: [] },
          { level: 'error' as const, message: 'Failed to fetch resource', args: [] },
          { level: 'debug' as const, message: 'Cache updated', args: [] },
        ];
        mockLogs.forEach((log, index) => {
          consoleService.addLog({
            ...log,
            timestamp: Date.now() - (mockLogs.length - index) * 1000,
          });
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

/**
 * Interactive story for testing focus restoration when changing dock positions.
 *
 * This story uses Storybook's `play` function to automatically test focus restoration.
 * The test runs when you view this story in Storybook - check the Interactions panel
 * to see the test steps execute in real-time.
 *
 * **Expected Behavior:**
 * - Focus stays on the button after position change
 * - No focus loss when panel remounts in new position
 * - Keyboard navigation remains continuous
 */
export const FocusRestorationTest: Story = {
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
      return (
        <div className="h-screen bg-bg-app flex flex-col overflow-hidden">
          <div className="p-4 text-sm text-text-secondary shrink-0 border-b border-border-default">
            <h2 className="font-semibold text-text-primary mb-2">Focus Restoration Test</h2>
            <p className="text-xs text-text-muted mb-2">
              This story includes automated interaction tests. Open the{' '}
              <strong>Interactions</strong> panel at the bottom to see the test steps execute
              automatically.
            </p>
            <p className="text-xs text-text-muted">
              Expected: Focus stays on the button after position change, no focus loss when panel
              remounts.
            </p>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <Story />
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
            networkCount={5}
            consoleCount={3}
          />
        }
      >
        <div className="p-4 text-text-secondary">
          <p className="mb-2">Panel content for focus testing.</p>
          <p className="text-xs text-text-muted">
            The interaction test will automatically navigate and verify focus restoration.
          </p>
        </div>
      </DockablePanel>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Wait for panel to render
    await expect(canvas.getByTestId('dockable-panel')).toBeVisible();

    // Find dock control buttons
    const bottomButton = canvas.getByRole('button', { name: /dock bottom/i });
    const leftButton = canvas.getByRole('button', { name: /dock left/i });
    const rightButton = canvas.getByRole('button', { name: /dock right/i });

    // Verify initial state (bottom is active)
    await expect(bottomButton).toHaveAttribute('aria-pressed', 'true');

    // Helper to tab to a specific button
    const tabToButton = async (targetButton: HTMLElement, maxTabs = 10): Promise<boolean> => {
      for (let i = 0; i < maxTabs; i++) {
        await userEvent.tab();
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            resolve();
          }, 100);
        });

        if (document.activeElement === targetButton) {
          return true;
        }
      }
      return false;
    };

    // Test 1: Change from bottom to left
    await step('Change position from bottom to left and verify focus', async () => {
      // Focus the panel header first to start from a neutral position
      const panelHeader = canvas.getByTestId('panel-header');
      await userEvent.click(panelHeader);

      // Tab to left button
      const foundLeft = await tabToButton(leftButton);
      if (!foundLeft) {
        throw new Error('Failed to tab to left button');
      }

      // Activate left button
      await userEvent.keyboard('{Space}');

      // Wait for position change (panel remounts)
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 800);
      });

      // Verify position changed
      await expect(leftButton).toHaveAttribute('aria-pressed', 'true');

      // Verify focus is still on left button
      await expect(leftButton).toHaveFocus();
    });

    // Test 2: Change from left to right
    await step('Change position from left to right and verify focus', async () => {
      // Tab to right button (should be next)
      await userEvent.tab();
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Verify we're on right button
      await expect(rightButton).toHaveFocus();

      // Activate right button
      await userEvent.keyboard('{Space}');

      // Wait for position change
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 800);
      });

      // Verify position changed
      await expect(rightButton).toHaveAttribute('aria-pressed', 'true');

      // Verify focus is still on right button
      await expect(rightButton).toHaveFocus();
    });

    // Test 3: Change back to left
    await step('Change position back to left and verify focus', async () => {
      // Tab backwards to left button
      await userEvent.tab({ shift: true });
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Verify we're on left button
      await expect(leftButton).toHaveFocus();

      // Activate left button
      await userEvent.keyboard('{Space}');

      // Wait for position change
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 800);
      });

      // Verify position changed
      await expect(leftButton).toHaveAttribute('aria-pressed', 'true');

      // Verify focus is still on left button
      await expect(leftButton).toHaveFocus();
    });
  },
};
