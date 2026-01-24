/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file TitleBar Storybook stories
 * @description Consolidated story using Storybook 10 controls
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { TitleBar } from './TitleBar';

const meta = {
  title: 'Layout/TitleBar',
  component: TitleBar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Title bar component for window title and controls.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Window title',
    },
  },
  args: {
    title: 'runi',
  },
} satisfies Meta<typeof TitleBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Playground with controls for TitleBar.
 */
export const Playground: Story = {
  render: (args) => (
    <div className="w-full border border-border-default bg-bg-app">
      <TitleBar title={args.title} />
    </div>
  ),
};
