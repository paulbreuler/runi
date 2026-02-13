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
import { DockablePanel, type DockablePanelProps } from './DockablePanel';
import { usePanelStore } from '@/stores/usePanelStore';

// Custom args for story controls (not part of component props - controls store state)
interface DockablePanelStoryArgs {
  position?: 'bottom' | 'left' | 'right';
  collapsed?: boolean;
}

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
} satisfies Meta<DockablePanelProps & DockablePanelStoryArgs>;

export default meta;
type Story = StoryObj<DockablePanelProps & DockablePanelStoryArgs>;

/**
 * Playground with controls for DockablePanel features.
 */
export const Playground: Story = {
  decorators: [
    (Story, context) => {
      useEffect(() => {
        const position = context.args.position ?? 'bottom';
        const collapsed = context.args.collapsed ?? false;
        usePanelStore.setState({
          isVisible: true,
          position,
          isCollapsed: collapsed,
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
  render: () => (
    <DockablePanel title="DevTools" headerContent={<div className="text-xs">Panel Tabs</div>}>
      <div className="p-4">Panel content</div>
    </DockablePanel>
  ),
};

/**
 * Story specifically for testing focus restoration during dock position changes.
 */
export const FocusRestorationTest: Story = {
  decorators: Playground.decorators,
  render: Playground.render,
};
