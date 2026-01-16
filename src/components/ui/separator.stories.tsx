import type { Meta, StoryObj } from '@storybook/react';
import { Separator } from './separator';

const meta = {
  title: 'Components/UI/Separator',
  component: Separator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-96">
      <div className="p-4">
        <p className="text-text-secondary mb-4">Content above separator</p>
        <Separator />
        <p className="text-text-secondary mt-4">Content below separator</p>
      </div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex items-center h-24 gap-4">
      <span className="text-text-secondary">Left</span>
      <Separator orientation="vertical" />
      <span className="text-text-secondary">Middle</span>
      <Separator orientation="vertical" />
      <span className="text-text-secondary">Right</span>
    </div>
  ),
};

export const InList: Story = {
  render: () => (
    <div className="w-64">
      <div className="p-4 space-y-4">
        <div className="text-text-primary">Item 1</div>
        <Separator />
        <div className="text-text-primary">Item 2</div>
        <Separator />
        <div className="text-text-primary">Item 3</div>
        <Separator />
        <div className="text-text-primary">Item 4</div>
      </div>
    </div>
  ),
};
