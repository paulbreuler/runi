/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file IntelligenceSignals Storybook stories
 * @description Consolidated story using Storybook 10 controls
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { IntelligenceSignals } from './IntelligenceSignals';
import type { IntelligenceInfo } from '@/types/history';

const meta = {
  title: 'History/Signals/IntelligenceSignals',
  component: IntelligenceSignals,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Intelligence signals component showing verified, drift, AI-generated, and bound-to-spec states. Use controls to explore different intelligence configurations.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    signalType: {
      control: 'select',
      options: ['none', 'verified', 'drift', 'ai-generated', 'bound', 'multiple'],
      description: 'Type of intelligence signal to display',
    },
  },
  args: {
    signalType: 'verified',
  },
} satisfies Meta<typeof IntelligenceSignals>;

export default meta;
type Story = StoryObj<typeof meta>;

const createIntelligence = (type: string): IntelligenceInfo => {
  switch (type) {
    case 'verified':
      return {
        boundToSpec: true,
        specOperation: 'getUsers',
        drift: null,
        aiGenerated: false,
        verified: true,
      };
    case 'drift':
      return {
        boundToSpec: true,
        specOperation: 'createUser',
        drift: {
          type: 'response',
          fields: ['body.email'],
          message: 'Required field "email" missing in response',
        },
        aiGenerated: false,
        verified: false,
      };
    case 'ai-generated':
      return {
        boundToSpec: false,
        specOperation: null,
        drift: null,
        aiGenerated: true,
        verified: false,
      };
    case 'bound':
      return {
        boundToSpec: true,
        specOperation: 'updateUser',
        drift: null,
        aiGenerated: false,
        verified: false,
      };
    case 'multiple':
      return {
        boundToSpec: true,
        specOperation: 'getUsers',
        drift: {
          type: 'response',
          fields: ['body.email'],
          message: 'Field type mismatch',
        },
        aiGenerated: true,
        verified: false,
      };
    default:
      return {
        boundToSpec: false,
        specOperation: null,
        drift: null,
        aiGenerated: false,
        verified: false,
      };
  }
};

const wrapper = (children: React.ReactNode): React.JSX.Element => (
  <div className="bg-bg-surface p-4 rounded flex items-center gap-2">
    <span className="text-sm text-text-secondary">Signals:</span>
    {children}
  </div>
);

/**
 * Playground with controls for all IntelligenceSignals states.
 */
export const Playground: Story = {
  render: (args) => {
    const intelligence = createIntelligence(args.signalType as string);
    return wrapper(<IntelligenceSignals intelligence={intelligence} />);
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground for IntelligenceSignals. Use the Controls panel to explore different signal types: verified, drift, AI-generated, bound, or multiple signals.',
      },
    },
  },
};
