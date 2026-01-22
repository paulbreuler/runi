import type { Meta, StoryObj } from '@storybook/react-vite';
import { TimingTab } from './TimingTab';
import type { TimingWaterfallSegments } from '@/types/history';

const meta: Meta<typeof TimingTab> = {
  title: 'History/TimingTab',
  component: TimingTab,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        component: `
TimingTab displays detailed timing breakdown for HTTP requests in the expanded panel.

**Features:**
- Waterfall visualization with DNS, Connect, TLS, Wait (TTFB), and Download segments
- Color-coded segments with legend
- Total time display
- Streaming request indicator (animated pulse)
- Blocked request message
- Throttle rate indicator
- Intelligence signals (verified, bound, drift, AI-generated)

**Accessibility:**
- \`role="region"\` with label for screen readers
- \`role="alert"\` for blocked message
- Respects \`prefers-reduced-motion\` for streaming indicator
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-bg-app p-6 rounded-lg w-[600px]">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TimingTab>;

const defaultSegments: TimingWaterfallSegments = {
  dns: 15,
  connect: 25,
  tls: 45,
  wait: 120,
  download: 85,
};

/**
 * Default timing tab showing complete waterfall with all segments.
 */
export const Default: Story = {
  args: {
    segments: defaultSegments,
    totalMs: 290,
  },
};

/**
 * Fast response with minimal timing on each segment.
 */
export const FastResponse: Story = {
  args: {
    segments: {
      dns: 2,
      connect: 5,
      tls: 8,
      wait: 15,
      download: 10,
    },
    totalMs: 40,
  },
};

/**
 * Slow response (>1000ms) with long wait time.
 */
export const SlowResponse: Story = {
  args: {
    segments: {
      dns: 50,
      connect: 100,
      tls: 150,
      wait: 800,
      download: 400,
    },
    totalMs: 1500,
  },
};

/**
 * Streaming request with animated indicator.
 * The download segment is typically short or in-progress.
 */
export const Streaming: Story = {
  args: {
    segments: {
      dns: 10,
      connect: 20,
      tls: 30,
      wait: 50,
      download: 0,
    },
    totalMs: 110,
    isStreaming: true,
  },
};

/**
 * Blocked request showing error message.
 * No waterfall is displayed for blocked requests.
 */
export const Blocked: Story = {
  args: {
    segments: defaultSegments,
    totalMs: 0,
    isBlocked: true,
  },
};

/**
 * Throttled connection showing rate limit.
 */
export const Throttled: Story = {
  args: {
    segments: {
      dns: 10,
      connect: 25,
      tls: 40,
      wait: 100,
      download: 500,
    },
    totalMs: 675,
    throttleRateKbps: 256,
  },
};

/**
 * Request with all intelligence signals active.
 */
export const WithAllIntelligenceSignals: Story = {
  args: {
    segments: defaultSegments,
    totalMs: 290,
    intelligence: {
      verified: true,
      drift: {
        type: 'response',
        fields: ['status'],
        message: 'Schema mismatch: missing field "id"',
      },
      aiGenerated: true,
      boundToSpec: true,
      specOperation: 'getUsers',
    },
  },
};

/**
 * Request verified against OpenAPI spec.
 */
export const VerifiedRequest: Story = {
  args: {
    segments: defaultSegments,
    totalMs: 290,
    intelligence: {
      verified: true,
      drift: null,
      aiGenerated: false,
      boundToSpec: true,
      specOperation: 'createUser',
    },
  },
};

/**
 * Request with drift detected from spec.
 */
export const DriftDetected: Story = {
  args: {
    segments: defaultSegments,
    totalMs: 290,
    intelligence: {
      verified: false,
      drift: { type: 'response', fields: ['body.email'], message: 'Expected string, got number' },
      aiGenerated: false,
      boundToSpec: true,
      specOperation: 'getUserById',
    },
  },
};

/**
 * AI-generated request (not yet verified).
 */
export const AIGenerated: Story = {
  args: {
    segments: defaultSegments,
    totalMs: 290,
    intelligence: {
      verified: false,
      drift: null,
      aiGenerated: true,
      boundToSpec: false,
      specOperation: null,
    },
  },
};

/**
 * Empty state when no timing segments are available.
 */
export const EmptySegments: Story = {
  args: {
    totalMs: 0,
  },
};

/**
 * Complex scenario: streaming + throttled + AI-generated.
 */
export const StreamingThrottledAI: Story = {
  args: {
    segments: {
      dns: 8,
      connect: 15,
      tls: 25,
      wait: 40,
      download: 0,
    },
    totalMs: 88,
    isStreaming: true,
    throttleRateKbps: 128,
    intelligence: {
      verified: false,
      drift: null,
      aiGenerated: true,
      boundToSpec: true,
      specOperation: 'streamEvents',
    },
  },
};
