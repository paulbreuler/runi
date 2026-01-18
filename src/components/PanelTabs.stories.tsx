import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { PanelTabs, type PanelTabType } from './PanelTabs';
import { AnimatePresence, motion } from 'motion/react';

const meta: Meta<typeof PanelTabs> = {
  title: 'Components/PanelTabs',
  component: PanelTabs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Tab switcher for dockable panel content. Uses Radix Tabs primitives with Motion animations for smooth tab indicator transitions.

## Features

- **Accessible**: Built on Radix UI Tabs primitives with full keyboard navigation support
- **Animated**: Smooth tab indicator transitions using Motion's \`layoutId\` for shared element animations
- **Spring Physics**: Tab indicator uses spring animations (stiffness: 300, damping: 30) for natural motion
- **Reduced Motion**: Respects user's \`prefers-reduced-motion\` setting
- **Interactive**: Hover and tap animations on tab buttons (scale: 1.02 on hover, 0.98 on tap)

## Usage

\`\`\`tsx
const [activeTab, setActiveTab] = useState<PanelTabType>('network');

<PanelTabs
  activeTab={activeTab}
  onTabChange={setActiveTab}
  networkCount={5}
  consoleCount={3}
/>
\`\`\`

## Animation Details

The tab indicator uses Motion's \`layoutId\` prop to create a shared element transition. When switching tabs, the indicator smoothly animates from one tab to another using spring physics. This pattern is inspired by Motion.dev's Radix Tabs example.

## Accessibility

- Full keyboard navigation (Tab, Arrow keys, Enter/Space)
- ARIA attributes provided by Radix UI
- Focus management handled automatically`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PanelTabs>;

/**
 * Default tabs with Network tab active.
 * Shows the component in its typical state with count badges displayed.
 */
export const Default: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState<PanelTabType>('network');
    return (
      <PanelTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        networkCount={5}
        consoleCount={3}
      />
    );
  },
};

/**
 * Console tab active by default.
 * Demonstrates the component state when Console is the initial active tab.
 */
export const ConsoleActive: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState<PanelTabType>('console');
    return (
      <PanelTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        networkCount={5}
        consoleCount={3}
      />
    );
  },
};

/**
 * Tabs with no count badges (zero counts are hidden).
 * Demonstrates the component appearance when no counts are provided or all counts are zero.
 */
export const NoCounts: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState<PanelTabType>('network');
    return <PanelTabs activeTab={activeTab} onTabChange={setActiveTab} />;
  },
};

/**
 * Tabs with large count values to test badge display and layout.
 * Verifies that badges handle large numbers gracefully without breaking the layout.
 */
export const LargeCounts: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState<PanelTabType>('network');
    return (
      <PanelTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        networkCount={999}
        consoleCount={42}
      />
    );
  },
};

/**
 * Interactive demo - click tabs to see Motion animations.
 * Shows the tab indicator smoothly animating between tabs when switching.
 * The indicator uses spring physics for natural motion.
 */
export const Interactive: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState<PanelTabType>('network');
    return (
      <div className="p-8 bg-bg-app">
        <PanelTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          networkCount={12}
          consoleCount={8}
        />
        <div className="mt-4 text-sm text-text-muted">
          Active tab: <strong>{activeTab}</strong>
        </div>
      </div>
    );
  },
};

/**
 * PanelTabs with content preview showing tab switching with AnimatePresence.
 * Demonstrates how PanelTabs integrates with content switching animations.
 * The content fades in/out smoothly when tabs are switched.
 */
export const WithContentPreview: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState<PanelTabType>('network');
    return (
      <div className="w-96 bg-bg-app border border-border-default rounded-lg overflow-hidden">
        <div className="p-3 border-b border-border-default">
          <PanelTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            networkCount={12}
            consoleCount={8}
          />
        </div>
        <div className="h-64 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'network' ? (
              <motion.div
                key="network"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="h-full p-4 overflow-auto"
              >
                <div className="space-y-2">
                  <div className="text-sm font-medium text-text-primary">Network History</div>
                  <div className="text-xs text-text-muted">
                    This is the Network tab content. Switch to Console to see the fade transition.
                  </div>
                  <div className="space-y-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-2 bg-bg-raised rounded text-xs text-text-secondary">
                        Request {i}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="console"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="h-full p-4 overflow-auto"
              >
                <div className="space-y-2">
                  <div className="text-sm font-medium text-text-primary">Console</div>
                  <div className="text-xs text-text-muted">
                    This is the Console tab content. Switch to Network to see the fade transition.
                  </div>
                  <div className="space-y-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="p-2 bg-bg-raised rounded text-xs text-text-secondary font-mono"
                      >
                        [INFO] Log entry {i}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  },
};

/**
 * Accessibility demonstration - keyboard navigation.
 * Use Tab to focus tabs, Arrow keys to navigate, Enter/Space to activate.
 * All keyboard interactions are handled by Radix UI Tabs primitives.
 */
export const AccessibilityDemo: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates keyboard navigation. Use Tab to focus, Arrow keys to navigate between tabs, and Enter/Space to activate. All interactions are handled by Radix UI.',
      },
    },
  },
  render: () => {
    const [activeTab, setActiveTab] = useState<PanelTabType>('network');
    return (
      <div className="p-8 bg-bg-app">
        <div className="mb-4 text-sm text-text-muted">
          <strong>Keyboard Navigation:</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Tab - Focus tabs</li>
            <li>Arrow Left/Right - Navigate between tabs</li>
            <li>Enter/Space - Activate focused tab</li>
          </ul>
        </div>
        <PanelTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          networkCount={12}
          consoleCount={8}
        />
        <div className="mt-4 text-sm text-text-muted">
          Active tab: <strong>{activeTab}</strong>
        </div>
      </div>
    );
  },
};

/**
 * Animation showcase with reduced motion disabled.
 * This story demonstrates the full spring animations when reduced motion is not preferred.
 * The tab indicator smoothly animates with spring physics (stiffness: 300, damping: 30).
 */
export const AnimationSlowMotion: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Shows the full animation experience. The tab indicator uses spring physics for natural motion. Click tabs to see the smooth indicator transition.',
      },
    },
  },
  render: () => {
    const [activeTab, setActiveTab] = useState<PanelTabType>('network');
    return (
      <div className="p-8 bg-bg-app">
        <div className="mb-4 text-sm text-text-muted">
          Click tabs to see the smooth spring animation of the indicator.
        </div>
        <PanelTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          networkCount={12}
          consoleCount={8}
        />
        <div className="mt-4 text-sm text-text-muted">
          Active tab: <strong>{activeTab}</strong>
        </div>
      </div>
    );
  },
};
