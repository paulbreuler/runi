/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file DockablePanel Storybook stories
 * @description Consolidated story using Storybook 10 controls
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { DockablePanel } from './DockablePanel';
import { usePanelStore } from '@/stores/usePanelStore';

const meta = {
  title: 'Layout/DockablePanel',
  component: DockablePanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A DevTools-style dockable panel that can be resized and collapsed. Supports bottom, left, and right docking positions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: 'select',
      options: ['bottom', 'left', 'right'],
      description: 'Panel docking position',
    },
    collapsed: {
      control: 'boolean',
      description: 'Panel collapsed state',
    },
  },
  args: {
    position: 'bottom',
    collapsed: false,
  },
} satisfies Meta<typeof DockablePanel>;

export default meta;
type Story = StoryObj<typeof DockablePanel>;

/**
 * Playground with controls for DockablePanel features.
 */
export const Playground: Story = {
  decorators: [
    (Story, context) => {
      useEffect(() => {
        usePanelStore.setState({
          devToolsPosition: context.args.position as 'bottom' | 'left' | 'right',
          devToolsCollapsed: context.args.collapsed as boolean,
        });
      }, [context.args.position, context.args.collapsed]);

      return (
        <div className="h-screen bg-bg-app flex flex-col overflow-hidden">
          <div className="p-2 text-xs text-text-muted shrink-0">Main content area</div>
          <div className="flex-1 min-h-0">
            <Story />
          </div>
        </div>
      );
    },
  ],
  render: (args) => (
    <DockablePanel
      title="DevTools"
      headerContent={<div className="text-xs">Panel Tabs</div>}
      position={args.position as 'bottom' | 'left' | 'right'}
      collapsed={args.collapsed as boolean}
    >
      <div className="p-4">Panel content</div>
    </DockablePanel>
  ),
};
