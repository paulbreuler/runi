/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file IntelligenceSignals Storybook stories
 * @description Consolidated story using Storybook 10 controls
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { IntelligenceSignals, type IntelligenceSignalsProps } from './IntelligenceSignals';
import { SignalDot } from './SignalDot';
import type { IntelligenceInfo } from '@/types/history';

// Custom args for story controls (not part of component props)
interface IntelligenceSignalsStoryArgs {
  signalType?: 'none' | 'verified' | 'drift' | 'aiGenerated' | 'bound' | 'multiple';
}

const meta = {
  title: 'History/Signals/IntelligenceSignals',
  component: IntelligenceSignals,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Intelligence signals components showing verified, drift, AI-generated, and bound-to-spec states. Use controls to explore different intelligence configurations.

**Components:**
- **IntelligenceSignals** - Multiple signal indicators for a request
- **SignalDot** - Individual signal dot component with types and sizes

This story file includes both IntelligenceSignals and SignalDot stories.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    signalType: {
      control: 'select',
      options: ['none', 'verified', 'drift', 'aiGenerated', 'bound', 'multiple'],
      description: 'Type of intelligence signal to display',
    },
  },
  args: {
    signalType: 'verified',
  },
} satisfies Meta<IntelligenceSignalsProps & IntelligenceSignalsStoryArgs>;

export default meta;
type Story = StoryObj<IntelligenceSignalsProps & IntelligenceSignalsStoryArgs>;

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
    case 'aiGenerated':
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

// ============================================================================
// SignalDot Stories
// ============================================================================

/**
 * SignalDot - playground with controls for all features.
 */
export const SignalDotPlayground: Story = {
  render: (args) => {
    // Map signalType to SignalDot type (SignalDot doesn't support 'none', 'aiGenerated', 'multiple')
    let signalDotType: 'verified' | 'drift' | 'ai' | 'bound' = 'verified';
    if (args.signalType === 'aiGenerated') {
      signalDotType = 'ai';
    } else if (
      args.signalType === 'verified' ||
      args.signalType === 'drift' ||
      args.signalType === 'bound'
    ) {
      signalDotType = args.signalType;
    }

    return (
      <div className="bg-bg-surface p-6 rounded flex flex-col gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <SignalDot
              type={signalDotType}
              size="md"
              tooltip={`${args.signalType ?? 'verified'} signal`}
            />
            <span className="text-sm text-text-secondary">{args.signalType ?? 'verified'}</span>
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
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground for SignalDot. Use the Controls panel to explore different signal types (verified, drift, AI, bound) and sizes (sm, md, lg).',
      },
    },
  },
};
