import type { Meta, StoryObj } from '@storybook/react';
import { TitleBar } from './TitleBar';

const meta = {
  title: 'Layout/TitleBar',
  component: TitleBar,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#0a0a0a',
        },
      ],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TitleBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default TitleBar with default title "runi".
 * On macOS, uses native traffic light controls (overlay style).
 * On Windows/Linux, shows custom window controls on the right.
 */
export const Default: Story = {
  render: () => (
    <div className="w-full bg-bg-app">
      <TitleBar />
    </div>
  ),
};

/**
 * TitleBar with custom title.
 */
export const WithCustomTitle: Story = {
  render: () => (
    <div className="w-full bg-bg-app">
      <TitleBar title="My Custom Title" />
    </div>
  ),
};

/**
 * TitleBar with custom children content instead of title text.
 */
export const WithContent: Story = {
  render: () => (
    <div className="w-full bg-bg-app">
      <TitleBar>
        <div className="flex items-center gap-2">
          <span className="font-medium">API Request</span>
          <span className="text-text-muted text-xs">GET /api/users</span>
        </div>
      </TitleBar>
    </div>
  ),
};

/**
 * TitleBar styling with backdrop blur and semi-transparent background
 * (matches macOS overlay style).
 */
export const OverlayStyle: Story = {
  render: () => (
    <div className="w-full bg-bg-app">
      <TitleBar title="Overlay Title Bar" />
      <div className="p-8 text-text-secondary">
        Content area below title bar. Notice the backdrop blur and semi-transparent background
        effect.
      </div>
    </div>
  ),
};
