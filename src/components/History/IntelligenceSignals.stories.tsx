/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { IntelligenceSignals } from './IntelligenceSignals';
import type { IntelligenceInfo } from '@/types/history';

const meta = {
  title: 'Components/History/IntelligenceSignals',
  component: IntelligenceSignals,
  parameters: {
    layout: 'centered',
    test: {
      skip: true, // Display-only component, no interactive elements to test
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof IntelligenceSignals>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrapper = (children: React.ReactNode): React.JSX.Element => (
  <div className="bg-bg-surface p-4 rounded flex items-center gap-2">
    <span className="text-sm text-text-secondary">Signals:</span>
    {children}
  </div>
);

/**
 * No intelligence signals - empty state.
 */
export const NoSignals: Story = {
  args: {
    intelligence: {
      boundToSpec: false,
      specOperation: null,
      drift: null,
      aiGenerated: false,
      verified: false,
    },
  },
  render: (args) => wrapper(<IntelligenceSignals {...args} />),
};

/**
 * Verified response - all clear, green signal.
 */
export const Verified: Story = {
  args: {
    intelligence: {
      boundToSpec: true,
      specOperation: 'getUsers',
      drift: null,
      aiGenerated: false,
      verified: true,
    },
  },
  render: (args) => wrapper(<IntelligenceSignals {...args} />),
};

/**
 * Drift detected - amber pulsing signal.
 */
export const DriftDetected: Story = {
  args: {
    intelligence: {
      boundToSpec: true,
      specOperation: 'createUser',
      drift: {
        type: 'response',
        fields: ['body.email'],
        message: 'Required field "email" missing in response',
      },
      aiGenerated: false,
      verified: false,
    },
  },
  render: (args) => wrapper(<IntelligenceSignals {...args} />),
};

/**
 * AI-generated request - purple signal.
 */
export const AIGenerated: Story = {
  args: {
    intelligence: {
      boundToSpec: false,
      specOperation: null,
      drift: null,
      aiGenerated: true,
      verified: false,
    },
  },
  render: (args) => wrapper(<IntelligenceSignals {...args} />),
};

/**
 * Bound to spec but not yet verified - blue signal only.
 */
export const BoundOnly: Story = {
  args: {
    intelligence: {
      boundToSpec: true,
      specOperation: 'deleteUser',
      drift: null,
      aiGenerated: false,
      verified: false,
    },
  },
  render: (args) => wrapper(<IntelligenceSignals {...args} />),
};

/**
 * AI-generated with drift - needs attention.
 */
export const AIWithDrift: Story = {
  args: {
    intelligence: {
      boundToSpec: true,
      specOperation: 'updateUser',
      drift: {
        type: 'request',
        fields: ['body.id'],
        message: 'Unexpected field "id" in request body',
      },
      aiGenerated: true,
      verified: false,
    },
  },
  render: (args) => wrapper(<IntelligenceSignals {...args} />),
};

/**
 * All signals active (unusual but possible during debugging).
 */
export const AllSignals: Story = {
  args: {
    intelligence: {
      boundToSpec: true,
      specOperation: 'testOperation',
      drift: {
        type: 'response',
        fields: ['status'],
        message: 'Status 404 not in spec',
      },
      aiGenerated: true,
      verified: true,
    } as IntelligenceInfo,
  },
  render: (args) => wrapper(<IntelligenceSignals {...args} />),
};
