import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { PanelTabs, type PanelTabType } from './PanelTabs';

const meta: Meta<typeof PanelTabs> = {
  title: 'Components/PanelTabs',
  component: PanelTabs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Tab switcher for dockable panel content. Uses Radix Tabs primitives with Motion animations for smooth tab indicator transitions.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PanelTabs>;

/**
 * Default tabs with Network active.
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
 * Console tab active.
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
 * Tabs with no counts (zero badges hidden).
 */
export const NoCounts: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState<PanelTabType>('network');
    return <PanelTabs activeTab={activeTab} onTabChange={setActiveTab} />;
  },
};

/**
 * Tabs with large counts to test badge display.
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
