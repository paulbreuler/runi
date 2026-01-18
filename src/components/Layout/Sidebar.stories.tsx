import type { Meta, StoryObj } from '@storybook/react';
import { Sidebar } from './Sidebar';

const meta = {
  title: 'Layout/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Sidebar with Collections drawer (default state).
 */
export const Default: Story = {
  render: () => (
    <div className="w-64 h-screen border border-border-default bg-bg-app">
      <Sidebar />
    </div>
  ),
};
