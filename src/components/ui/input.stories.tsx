import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';

const meta = {
  title: 'Components/UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'url'],
    },
    disabled: {
      control: 'boolean',
    },
    placeholder: {
      control: 'text',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const Types: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-64">
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="Email address" />
      <Input type="password" placeholder="Password" />
      <Input type="number" placeholder="Number" />
      <Input type="search" placeholder="Search..." />
      <Input type="url" placeholder="https://example.com" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-64">
      <Input placeholder="Normal input" />
      <Input placeholder="Disabled input" disabled />
      <Input defaultValue="With value" />
      <Input placeholder="Invalid input" aria-invalid="true" />
    </div>
  ),
};

export const WithLabels: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <label className="text-sm text-text-secondary">Name</label>
      <Input placeholder="Enter your name" />
      <label className="text-sm text-text-secondary mt-4">Email</label>
      <Input type="email" placeholder="Enter your email" />
    </div>
  ),
};
