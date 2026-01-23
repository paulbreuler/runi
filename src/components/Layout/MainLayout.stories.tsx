/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file MainLayout Storybook stories
 * @description Consolidated story using Storybook 10 controls
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { useEffect } from 'react';
import { MainLayout } from './MainLayout';
import { usePanelStore } from '@/stores/usePanelStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

const meta = {
  title: 'Layout/MainLayout',
  component: MainLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `The MainLayout provides a resizable layout with sidebar, request pane, response pane, and a dockable DevTools panel.

**Features:**
- Sidebar: Resizable (256-500px), collapsible
- Request/Response panes: Resizable split (20-80%)
- DevTools panel: Dockable (bottom, left, right), collapsible
- Keyboard shortcuts: Cmd+B (sidebar), Cmd+Shift+I (DevTools)

Use controls to explore different configurations.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    sidebarCollapsed: {
      control: 'boolean',
      description: 'Sidebar collapsed state',
    },
    devToolsPosition: {
      control: 'select',
      options: ['bottom', 'left', 'right', 'hidden'],
      description: 'DevTools panel position',
    },
    devToolsCollapsed: {
      control: 'boolean',
      description: 'DevTools panel collapsed',
    },
  },
  args: {
    sidebarCollapsed: false,
    devToolsPosition: 'bottom',
    devToolsCollapsed: false,
  },
} satisfies Meta<typeof MainLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Playground with controls for all MainLayout features.
 */
export const Playground: Story = {
  decorators: [
    (Story, context) => {
      useEffect(() => {
        useSettingsStore.setState({
          sidebarCollapsed: context.args.sidebarCollapsed as boolean,
        });
        const position = context.args.devToolsPosition as 'bottom' | 'left' | 'right' | 'hidden';
        if (position !== 'hidden') {
          usePanelStore.setState({
            devToolsPosition: position,
            devToolsCollapsed: context.args.devToolsCollapsed as boolean,
          });
        }
      }, [
        context.args.sidebarCollapsed,
        context.args.devToolsPosition,
        context.args.devToolsCollapsed,
      ]);

      return (
        <div className="h-screen">
          <Story />
        </div>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('main-layout')).toBeInTheDocument();
  },
};
