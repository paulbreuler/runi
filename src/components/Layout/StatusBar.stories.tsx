import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusBar } from './StatusBar';

const meta = {
  title: 'Layout/StatusBar',
  component: StatusBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StatusBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-full border border-border-default bg-bg-app">
      <StatusBar />
    </div>
  ),
};
