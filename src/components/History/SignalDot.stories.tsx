/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file SignalDot Storybook stories
 * @description Consolidated story using Storybook 10 controls
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { SignalDot } from './SignalDot';

const meta = {
  title: 'History/Signals/SignalDot',
  component: SignalDot,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Signal dot component showing intelligence signal types. Use controls to explore different signal types and sizes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['verified', 'drift', 'ai', 'bound'],
      description: 'Signal type',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Signal dot size',
    },
  },
  args: {
    type: 'verified',
    size: 'md',
  },
} satisfies Meta<typeof SignalDot>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Playground with controls for all SignalDot features.
 */
export const Playground: Story = {
  render: (args) => (
    <div className="bg-bg-surface p-6 rounded flex flex-col gap-4">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <SignalDot
            type={args.type as 'verified' | 'drift' | 'ai' | 'bound'}
            size={args.size}
            tooltip={`${args.type} signal`}
          />
          <span className="text-sm text-text-secondary">{args.type}</span>
        </div>
      </div>
      <div className="border-t border-border-subtle pt-4">
        <p className="text-xs text-text-muted mb-2">All signal types:</p>
        <div className="flex items-center gap-4">
          <SignalDot type="verified" tooltip="Verified" />
          <SignalDot type="drift" tooltip="Drift" />
          <SignalDot type="ai" tooltip="AI Generated" />
          <SignalDot type="bound" tooltip="Bound to Spec" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground for SignalDot. Use the Controls panel to explore different signal types (verified, drift, AI, bound) and sizes (sm, md, lg).',
      },
    },
  },
};
