/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { tabToElement, waitForFocus } from '@/utils/storybook-test-helpers';
import { PanelTabs, type PanelTabType } from './PanelTabs';
import { AnimatePresence, motion } from 'motion/react';

const meta: Meta<typeof PanelTabs> = {
  title: 'UI/PanelTabs',
  component: PanelTabs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Tab switcher for dockable panel content. Uses Base UI Tabs with Motion animations.

- **Keyboard**: Arrow Left/Right to move focus and activate; Tab moves focus into panel content (roving tabindex).
- **Animated**: Tab indicator uses Motion \`layoutId\` and spring physics.
- Use controls below to change active tab and badge counts.`,
      },
    },
  },
  argTypes: {
    activeTab: {
      control: 'radio',
      options: ['network', 'console'],
      description: 'Initial active tab',
    },
    networkCount: { control: 'number', description: 'Network badge count (0 = hidden)' },
    consoleCount: { control: 'number', description: 'Console badge count (0 = hidden)' },
  },
};

export default meta;
type Story = StoryObj<typeof PanelTabs>;

/**
 * All states via controls: activeTab, networkCount, consoleCount.
 * Play runs keyboard interaction test (see Interactions panel).
 */
export const Playground: Story = {
  tags: ['test'],
  args: {
    activeTab: 'network',
    networkCount: 5,
    consoleCount: 3,
  },
  render: function PlaygroundRender(args) {
    const initialTab: PanelTabType = args.activeTab;
    const [activeTab, setActiveTab] = useState<PanelTabType>(initialTab);
    return (
      <div className="p-8 bg-bg-app">
        <PanelTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          networkCount={args.networkCount ?? 0}
          consoleCount={args.consoleCount ?? 0}
        />
        <p className="mt-4 text-sm text-text-muted" data-test-id="active-tab-display">
          Active tab: <strong>{activeTab}</strong>
        </p>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const networkTab = canvas.getByTestId('panel-tab-network');
    const consoleTab = canvas.getByTestId('panel-tab-console');

    await step('Focus Network tab', async () => {
      const focused = await tabToElement(networkTab, 6);
      await expect(focused).toBe(true);
      await waitForFocus(networkTab, 1000);
      await expect(networkTab).toHaveFocus();
    });

    await step('Arrow Right → focus Console and activate', async () => {
      await userEvent.keyboard('{ArrowRight}');
      await expect(consoleTab).toHaveFocus();
      await expect(canvas.getByTestId('active-tab-display')).toHaveTextContent(/console/i);
    });

    await step('Arrow Left → focus Network and activate', async () => {
      await userEvent.keyboard('{ArrowLeft}');
      await expect(networkTab).toHaveFocus();
      await expect(canvas.getByTestId('active-tab-display')).toHaveTextContent(/network/i);
    });

    await step('Tab moves focus out of tab list', async () => {
      await userEvent.tab();
      await expect(networkTab).not.toHaveFocus();
      await expect(consoleTab).not.toHaveFocus();
    });
  },
};

/**
 * Tabs with panel content preview. Shows how PanelTabs integrates with content switching (e.g. DevTools panel).
 */
export const WithContentPreview: Story = {
  render: function WithContentPreviewRender() {
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
                    Switch to Console to see the fade transition.
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
                    Switch to Network to see the fade transition.
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
