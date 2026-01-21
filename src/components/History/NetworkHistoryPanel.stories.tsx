import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { NetworkHistoryPanel } from './NetworkHistoryPanel';
import type { NetworkHistoryEntry } from '@/types/history';

const meta = {
  title: 'Components/History/NetworkHistoryPanel',
  component: NetworkHistoryPanel,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NetworkHistoryPanel>;

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

const mockEntries: NetworkHistoryEntry[] = [
  {
    id: 'hist_1',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
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
      body: '[{"id":1,"name":"John"},{"id":2,"name":"Jane"}]',
      timing: { total_ms: 156, dns_ms: 12, connect_ms: 23, tls_ms: 34, first_byte_ms: 98 },
    },
    intelligence: {
      boundToSpec: true,
      specOperation: 'getUsers',
      drift: null,
      aiGenerated: false,
      verified: true,
    },
  },
  {
    id: 'hist_2',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    request: {
      url: 'https://api.example.com/users',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":"Alice","email":"alice@example.com"}',
      timeout_ms: 30000,
    },
    response: {
      status: 201,
      status_text: 'Created',
      headers: { 'Content-Type': 'application/json' },
      body: '{"id":3,"name":"Alice"}',
      timing: { total_ms: 234, dns_ms: null, connect_ms: null, tls_ms: null, first_byte_ms: null },
    },
    intelligence: {
      boundToSpec: true,
      specOperation: 'createUser',
      drift: { type: 'response', fields: ['email'], message: 'Missing email field in response' },
      aiGenerated: true,
      verified: false,
    },
  },
  {
    id: 'hist_3',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    request: {
      url: 'https://api.example.com/users/1',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":"John Updated"}',
      timeout_ms: 30000,
    },
    response: {
      status: 200,
      status_text: 'OK',
      headers: { 'Content-Type': 'application/json' },
      body: '{"id":1,"name":"John Updated"}',
      timing: { total_ms: 189, dns_ms: 8, connect_ms: 18, tls_ms: 28, first_byte_ms: 120 },
    },
    intelligence: {
      boundToSpec: true,
      specOperation: 'updateUser',
      drift: null,
      aiGenerated: false,
      verified: true,
    },
  },
  {
    id: 'hist_4',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    request: {
      url: 'https://api.example.com/users/999',
      method: 'GET',
      headers: {},
      body: null,
      timeout_ms: 30000,
    },
    response: {
      status: 404,
      status_text: 'Not Found',
      headers: {},
      body: '{"error":"User not found"}',
      timing: { total_ms: 67, dns_ms: 5, connect_ms: 10, tls_ms: 15, first_byte_ms: 50 },
    },
    intelligence: {
      boundToSpec: true,
      specOperation: 'getUserById',
      drift: null,
      aiGenerated: false,
      verified: false,
    },
  },
  {
    id: 'hist_5',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    request: {
      url: 'https://api.example.com/users/2',
      method: 'DELETE',
      headers: {},
      body: null,
      timeout_ms: 30000,
    },
    response: {
      status: 204,
      status_text: 'No Content',
      headers: {},
      body: '',
      timing: { total_ms: 145, dns_ms: 6, connect_ms: 12, tls_ms: 20, first_byte_ms: 100 },
    },
    intelligence: {
      boundToSpec: true,
      specOperation: 'deleteUser',
      drift: null,
      aiGenerated: false,
      verified: true,
    },
  },
];

/**
 * Default panel with multiple entries showing various states.
 */
export const Default: Story = {
  args: {
    entries: mockEntries,
    onReplay: noop,
    onCopyCurl: noop,
  },
  render: (args) => (
    <div className="h-[600px] bg-bg-app">
      <NetworkHistoryPanel {...args} />
    </div>
  ),
};

/**
 * Empty state - no requests yet.
 */
export const Empty: Story = {
  args: {
    entries: [],
    onReplay: noop,
    onCopyCurl: noop,
  },
  render: (args) => (
    <div className="h-[400px] bg-bg-app">
      <NetworkHistoryPanel {...args} />
    </div>
  ),
};

/**
 * Panel with entries that have drift issues.
 */
export const WithDriftIssues: Story = {
  args: {
    entries: mockEntries.map((entry) =>
      entry.id === 'hist_1'
        ? {
            ...entry,
            intelligence: {
              ...(entry.intelligence ?? defaultIntelligence),
              drift: { type: 'response' as const, fields: ['status'], message: 'Unexpected field' },
              verified: false,
            },
          }
        : entry
    ),
    onReplay: noop,
    onCopyCurl: noop,
  },
  render: (args) => (
    <div className="h-[600px] bg-bg-app">
      <NetworkHistoryPanel {...args} />
    </div>
  ),
};

/**
 * Single entry.
 */
export const SingleEntry: Story = {
  args: {
    entries: mockEntries.slice(0, 1),
    onReplay: noop,
    onCopyCurl: noop,
  },
  render: (args) => (
    <div className="h-[400px] bg-bg-app">
      <NetworkHistoryPanel {...args} />
    </div>
  ),
};

/**
 * Test story for expander functionality - multiple rows to test expansion on different rows.
 * This story is used by Playwright E2E tests to verify expander works on all rows, not just the last one.
 */
export const ExpanderTest: Story = {
  args: {
    entries: mockEntries.slice(0, 5), // Use first 5 entries for testing
    onReplay: noop,
    onCopyCurl: noop,
  },
  render: (args) => (
    <div className="h-[800px] bg-bg-app">
      <NetworkHistoryPanel {...args} />
    </div>
  ),
};
