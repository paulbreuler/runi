import type { Meta, StoryObj } from '@storybook/react-vite';
import { SignalDot } from './SignalDot';

const meta = {
  title: 'Components/History/SignalDot',
  component: SignalDot,
  parameters: {
    layout: 'centered',
    test: {
      skip: true, // Display-only component, no interactive elements to test
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SignalDot>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Verified signal - green, indicates response matches spec.
 */
export const Verified: Story = {
  args: {
    type: 'verified',
    tooltip: 'Response verified against spec',
  },
  render: (args) => (
    <div className="bg-bg-surface p-4 rounded">
      <SignalDot {...args} />
    </div>
  ),
};

/**
 * Drift signal - amber with pulse, indicates deviation from spec.
 */
export const Drift: Story = {
  args: {
    type: 'drift',
    tooltip: 'Drift detected: 2 fields differ from spec',
  },
  render: (args) => (
    <div className="bg-bg-surface p-4 rounded">
      <SignalDot {...args} />
    </div>
  ),
};

/**
 * AI-generated signal - purple, indicates AI created this request.
 */
export const AIGenerated: Story = {
  args: {
    type: 'ai',
    tooltip: 'AI-generated request',
  },
  render: (args) => (
    <div className="bg-bg-surface p-4 rounded">
      <SignalDot {...args} />
    </div>
  ),
};

/**
 * Bound to spec signal - blue, indicates request is linked to OpenAPI operation.
 */
export const BoundToSpec: Story = {
  args: {
    type: 'bound',
    tooltip: 'Bound to getUsers operation',
  },
  render: (args) => (
    <div className="bg-bg-surface p-4 rounded">
      <SignalDot {...args} />
    </div>
  ),
};

/**
 * All signal types together with different sizes.
 */
export const AllSignals: Story = {
  args: {
    type: 'verified',
  },
  render: () => (
    <div className="bg-bg-surface p-6 rounded flex flex-col gap-4">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <SignalDot type="verified" tooltip="Verified" />
          <span className="text-sm text-text-secondary">Verified</span>
        </div>
        <div className="flex items-center gap-2">
          <SignalDot type="drift" tooltip="Drift" />
          <span className="text-sm text-text-secondary">Drift</span>
        </div>
        <div className="flex items-center gap-2">
          <SignalDot type="ai" tooltip="AI Generated" />
          <span className="text-sm text-text-secondary">AI</span>
        </div>
        <div className="flex items-center gap-2">
          <SignalDot type="bound" tooltip="Bound to Spec" />
          <span className="text-sm text-text-secondary">Bound</span>
        </div>
      </div>

      <div className="border-t border-border-subtle pt-4">
        <p className="text-xs text-text-muted mb-2">Sizes: sm, md, lg</p>
        <div className="flex items-center gap-4">
          <SignalDot type="verified" size="sm" />
          <SignalDot type="verified" size="md" />
          <SignalDot type="verified" size="lg" />
        </div>
      </div>
    </div>
  ),
};
