import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { HistoryEntry } from './HistoryEntry';
import type { HistoryEntry as HistoryEntryType } from '@/types/generated/HistoryEntry';

const noop = fn();

const meta = {
  title: 'Components/History/HistoryEntry',
  component: HistoryEntry,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HistoryEntry>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockEntry: HistoryEntryType = {
  id: 'hist_123',
  timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
  request: {
    url: 'https://api.example.com/users',
    method: 'GET',
    headers: {},
    body: null,
    timeout_ms: 30000,
  },
  response: {
    status: 200,
    status_text: 'OK',
    headers: {},
    body: '{"users": []}',
    timing: {
      total_ms: 150,
      dns_ms: null,
      connect_ms: null,
      tls_ms: null,
      first_byte_ms: null,
    },
  },
};

/**
 * Default history entry with GET request (recent - 2 minutes ago).
 */
export const Default: Story = {
  args: {
    entry: mockEntry,
    onSelect: noop,
    onDelete: noop,
  },
  render: (args) => (
    <div className="w-80 bg-bg-surface p-4">
      <HistoryEntry {...args} />
    </div>
  ),
};

/**
 * POST request entry (5 minutes ago).
 */
export const PostRequest: Story = {
  args: {
    entry: {
      ...mockEntry,
      id: 'hist_456',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      request: {
        ...mockEntry.request,
        method: 'POST',
        url: 'https://api.example.com/users',
        body: '{"name": "John Doe"}',
      },
      response: {
        ...mockEntry.response,
        status: 201,
        status_text: 'Created',
      },
    },
    onSelect: noop,
    onDelete: noop,
  },
  render: (args) => (
    <div className="w-80 bg-bg-surface p-4">
      <HistoryEntry {...args} />
    </div>
  ),
};

/**
 * DELETE request entry (1 hour ago).
 */
export const DeleteRequest: Story = {
  args: {
    entry: {
      ...mockEntry,
      id: 'hist_789',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      request: {
        ...mockEntry.request,
        method: 'DELETE',
        url: 'https://api.example.com/users/123',
      },
      response: {
        ...mockEntry.response,
        status: 204,
        status_text: 'No Content',
      },
    },
    onSelect: noop,
    onDelete: noop,
  },
  render: (args) => (
    <div className="w-80 bg-bg-surface p-4">
      <HistoryEntry {...args} />
    </div>
  ),
};

/**
 * Entry with long URL that gets truncated.
 */
export const LongUrl: Story = {
  args: {
    entry: {
      ...mockEntry,
      id: 'hist_long',
      request: {
        ...mockEntry.request,
        url: 'https://api.example.com/very/long/path/with/many/segments/and/parameters?query1=value1&query2=value2&query3=value3',
      },
    },
    onSelect: noop,
    onDelete: noop,
  },
  render: (args) => (
    <div className="w-80 bg-bg-surface p-4">
      <HistoryEntry {...args} />
    </div>
  ),
};

/**
 * Entry from yesterday (shows "yesterday" format).
 */
export const Yesterday: Story = {
  args: {
    entry: {
      ...mockEntry,
      id: 'hist_yesterday',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    onSelect: noop,
    onDelete: noop,
  },
  render: (args) => (
    <div className="w-80 bg-bg-surface p-4">
      <HistoryEntry {...args} />
    </div>
  ),
};

/**
 * Multiple entries in a list (as shown in HistoryDrawer).
 */
export const MultipleEntries: Story = {
  args: {
    entry: mockEntry,
    onSelect: noop,
    onDelete: noop,
  },
  render: () => (
    <div className="w-80 bg-bg-surface p-4 flex flex-col gap-1">
      <HistoryEntry
        entry={{
          ...mockEntry,
          id: 'hist_1',
          timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
          request: { ...mockEntry.request, method: 'GET', url: 'https://api.example.com/users' },
        }}
        onSelect={noop}
        onDelete={noop}
      />
      <HistoryEntry
        entry={{
          ...mockEntry,
          id: 'hist_2',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          request: { ...mockEntry.request, method: 'POST', url: 'https://api.example.com/users' },
        }}
        onSelect={noop}
        onDelete={noop}
      />
      <HistoryEntry
        entry={{
          ...mockEntry,
          id: 'hist_3',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          request: {
            ...mockEntry.request,
            method: 'DELETE',
            url: 'https://api.example.com/users/123',
          },
        }}
        onSelect={noop}
        onDelete={noop}
      />
    </div>
  ),
};
