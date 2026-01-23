/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file StatusBar Storybook stories
 * @description Consolidated story using Storybook 10 controls
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusBar } from './StatusBar';

const meta = {
  title: 'Layout/StatusBar',
  component: StatusBar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Status bar component displaying application status information.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StatusBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Playground for StatusBar.
 */
export const Playground: Story = {
  render: () => (
    <div className="w-full border border-border-default bg-bg-app">
      <StatusBar />
    </div>
  ),
};
