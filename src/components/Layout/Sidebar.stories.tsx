/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Sidebar Storybook stories
 * @description Consolidated story using Storybook 10 controls
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Sidebar } from './Sidebar';

const meta = {
  title: 'Layout/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Sidebar component with Collections drawer. Use controls to explore different states.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Playground with controls for Sidebar features.
 */
export const Playground: Story = {
  render: () => (
    <div className="w-64 h-screen border border-border-default bg-bg-app">
      <Sidebar />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('sidebar-content')).toBeInTheDocument();
  },
};
