import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { NetworkHistoryRow } from './NetworkHistoryRow';
import type { NetworkHistoryEntry } from '@/types/history';

const meta = {
  title: 'Components/History/NetworkHistoryRow',
  component: NetworkHistoryRow,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NetworkHistoryRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = fn();

const defaultIntelligence = {
  boundToSpec: false,
  specOperation: null,
  drift: null,
  aiGenerated: false,
  verified: false,
};

const baseEntry: NetworkHistoryEntry = {
  id: 'hist_123abc',
  timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  request: {
    url: 'https://api.example.com/users',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: null,
    timeout_ms: 30000,
  },
  response: {
    status: 200,
    status_text: 'OK',
    headers: { 'Content-Type': 'application/json' },
    body: '{"users": [{"id": 1, "name": "John"}]}',
    timing: {
      total_ms: 150,
      dns_ms: 10,
      connect_ms: 20,
      tls_ms: 30,
      first_byte_ms: 100,
    },
  },
  intelligence: {
    boundToSpec: true,
    specOperation: 'getUsers',
    drift: null,
    aiGenerated: false,
    verified: true,
  },
};

const defaultProps = {
  isExpanded: false,
  isSelected: false,
  onToggleExpand: noop,
  onSelect: noop,
  onReplay: noop,
  onCopyCurl: noop,
};

/**
 * Default collapsed row with verified status.
 */
export const Default: Story = {
  args: {
    entry: baseEntry,
    ...defaultProps,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded">
      <NetworkHistoryRow {...args} />
    </div>
  ),
};

/**
 * Expanded row showing timing waterfall and details.
 */
export const Expanded: Story = {
  args: {
    entry: baseEntry,
    ...defaultProps,
    isExpanded: true,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded">
      <NetworkHistoryRow {...args} />
    </div>
  ),
};

/**
 * Selected row with highlight.
 */
export const Selected: Story = {
  args: {
    entry: baseEntry,
    ...defaultProps,
    isSelected: true,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded">
      <NetworkHistoryRow {...args} />
    </div>
  ),
};

/**
 * Row with drift detected - amber pulsing signal.
 */
export const WithDrift: Story = {
  args: {
    entry: {
      ...baseEntry,
      id: 'hist_drift',
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
    ...defaultProps,
    isExpanded: true,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded">
      <NetworkHistoryRow {...args} />
    </div>
  ),
};

/**
 * AI-generated request.
 */
export const AIGenerated: Story = {
  args: {
    entry: {
      ...baseEntry,
      id: 'hist_ai',
      request: { ...baseEntry.request, method: 'POST', body: '{"name": "AI User"}' },
      response: { ...baseEntry.response, status: 201, status_text: 'Created' },
      intelligence: {
        boundToSpec: true,
        specOperation: 'createUser',
        drift: null,
        aiGenerated: true,
        verified: false,
      },
    },
    ...defaultProps,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded">
      <NetworkHistoryRow {...args} />
    </div>
  ),
};

/**
 * Error response (4xx).
 */
export const ClientError: Story = {
  args: {
    entry: {
      ...baseEntry,
      id: 'hist_404',
      response: {
        ...baseEntry.response,
        status: 404,
        status_text: 'Not Found',
        body: '{"error": "User not found"}',
      },
    },
    ...defaultProps,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded">
      <NetworkHistoryRow {...args} />
    </div>
  ),
};

/**
 * Server error (5xx).
 */
export const ServerError: Story = {
  args: {
    entry: {
      ...baseEntry,
      id: 'hist_500',
      response: {
        ...baseEntry.response,
        status: 500,
        status_text: 'Internal Server Error',
        body: '{"error": "Database connection failed"}',
      },
    },
    ...defaultProps,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded">
      <NetworkHistoryRow {...args} />
    </div>
  ),
};

/**
 * Multiple rows to show list context.
 */
export const MultipleRows: Story = {
  args: {
    entry: baseEntry,
    ...defaultProps,
  },
  render: () => (
    <div className="bg-bg-surface border border-border-subtle rounded">
      <NetworkHistoryRow
        entry={baseEntry}
        isExpanded={false}
        isSelected={true}
        onToggleExpand={noop}
        onSelect={noop}
        onReplay={noop}
        onCopyCurl={noop}
      />
      <NetworkHistoryRow
        entry={{
          ...baseEntry,
          id: 'hist_456',
          request: { ...baseEntry.request, method: 'POST', url: 'https://api.example.com/users' },
          response: { ...baseEntry.response, status: 201, status_text: 'Created' },
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          intelligence: {
            ...(baseEntry.intelligence ?? defaultIntelligence),
            verified: false,
            aiGenerated: true,
          },
        }}
        isExpanded={false}
        isSelected={false}
        onToggleExpand={noop}
        onSelect={noop}
        onReplay={noop}
        onCopyCurl={noop}
      />
      <NetworkHistoryRow
        entry={{
          ...baseEntry,
          id: 'hist_789',
          request: {
            ...baseEntry.request,
            method: 'DELETE',
            url: 'https://api.example.com/users/123',
          },
          response: { ...baseEntry.response, status: 204, status_text: 'No Content' },
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        }}
        isExpanded={false}
        isSelected={false}
        onToggleExpand={noop}
        onSelect={noop}
        onReplay={noop}
        onCopyCurl={noop}
      />
    </div>
  ),
};
