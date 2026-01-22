/**
 * @file ResponseTab Storybook stories
 * @description Visual documentation for ResponseTab component
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResponseTab } from './ResponseTab';
import type { NetworkHistoryEntry } from '@/types/history';

const meta: Meta<typeof ResponseTab> = {
  title: 'History/ResponseTab',
  component: ResponseTab,
  parameters: {
    docs: {
      description: {
        component:
          'Main response tab component for expanded panel. Displays request and response bodies in a tabbed interface using ResponsePanel.',
      },
    },
    test: {
      skip: true, // Display-only component, no interactive elements to test
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ResponseTab>;

const mockEntry: NetworkHistoryEntry = {
  id: 'hist_1',
  timestamp: new Date().toISOString(),
  request: {
    url: 'https://api.example.com/users',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      {
        name: 'John Doe',
        email: 'john@example.com',
      },
      null,
      2
    ),
    timeout_ms: 30000,
  },
  response: {
    status: 200,
    status_text: 'OK',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: '2024-01-01T00:00:00Z',
      },
      null,
      2
    ),
    timing: {
      total_ms: 156,
      dns_ms: 12,
      connect_ms: 23,
      tls_ms: 34,
      first_byte_ms: 98,
    },
  },
};

/**
 * Default response tab with request and response bodies.
 */
export const Default: Story = {
  args: {
    entry: mockEntry,
  },
};

/**
 * Response tab with GET request (no request body).
 */
export const GetRequest: Story = {
  args: {
    entry: {
      ...mockEntry,
      request: {
        ...mockEntry.request,
        method: 'GET',
        body: null,
      },
      response: {
        ...mockEntry.response,
        body: JSON.stringify(
          {
            users: [
              { id: 1, name: 'John' },
              { id: 2, name: 'Jane' },
            ],
          },
          null,
          2
        ),
      },
    },
  },
};

/**
 * Response tab with large response body.
 */
export const LargeResponse: Story = {
  args: {
    entry: {
      ...mockEntry,
      response: {
        ...mockEntry.response,
        body: JSON.stringify(
          {
            data: Array.from({ length: 100 }, (_, i) => ({
              id: i + 1,
              name: `User ${String(i + 1)}`,
              email: `user${String(i + 1)}@example.com`,
            })),
          },
          null,
          2
        ),
      },
    },
  },
};
