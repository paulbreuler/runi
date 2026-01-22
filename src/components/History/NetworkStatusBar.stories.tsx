import type { Meta, StoryObj } from '@storybook/react-vite';
import { NetworkStatusBar } from './NetworkStatusBar';

const meta = {
  title: 'Components/History/NetworkStatusBar',
  component: NetworkStatusBar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NetworkStatusBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Empty state with no intelligence counts.
 */
export const Default: Story = {
  args: {
    totalCount: 25,
    driftCount: 0,
    aiCount: 0,
    boundCount: 0,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded">
      <NetworkStatusBar {...args} />
    </div>
  ),
};

/**
 * With all intelligence counts.
 */
export const WithAllCounts: Story = {
  args: {
    totalCount: 100,
    driftCount: 5,
    aiCount: 12,
    boundCount: 78,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded">
      <NetworkStatusBar {...args} />
    </div>
  ),
};

/**
 * With drift issues detected.
 */
export const WithDrift: Story = {
  args: {
    totalCount: 50,
    driftCount: 8,
    aiCount: 0,
    boundCount: 42,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded">
      <NetworkStatusBar {...args} />
    </div>
  ),
};

/**
 * Single request (singular form).
 */
export const SingleRequest: Story = {
  args: {
    totalCount: 1,
    driftCount: 0,
    aiCount: 0,
    boundCount: 1,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded">
      <NetworkStatusBar {...args} />
    </div>
  ),
};
