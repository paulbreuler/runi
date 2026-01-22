/**
 * @file HeadersTab Storybook stories
 * @description Visual documentation for HeadersTab component
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { HeadersTab } from './HeadersTab';
import type { NetworkHistoryEntry } from '@/types/history';

const meta: Meta<typeof HeadersTab> = {
  title: 'History/HeadersTab',
  component: HeadersTab,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Main headers tab component for expanded panel. Displays request and response headers in a tabbed interface. Wraps HeadersPanel with NetworkHistoryEntry data.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof HeadersTab>;

/**
 * Creates a mock network history entry for stories.
 */
const createMockEntry = (overrides?: Partial<NetworkHistoryEntry>): NetworkHistoryEntry => {
  return {
    id: 'test-1',
    timestamp: new Date().toISOString(),
    request: {
      url: 'https://api.example.com/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token123',
        'User-Agent': 'runi/1.0.0',
      },
      body: '{"name":"John","email":"john@example.com"}',
      timeout_ms: 30000,
    },
    response: {
      status: 200,
      status_text: 'OK',
      headers: {
        'Content-Type': 'application/json',
        'X-Rate-Limit': '100',
        'X-Rate-Limit-Remaining': '99',
        'X-Request-ID': 'abc-123-def-456',
      },
      body: '{"id":1,"name":"John"}',
      timing: {
        total_ms: 156,
        dns_ms: 12,
        connect_ms: 23,
        tls_ms: 34,
        first_byte_ms: 98,
      },
    },
    ...overrides,
  };
};

/**
 * Default tab with typical request and response headers.
 */
export const Default: Story = {
  args: {
    entry: createMockEntry(),
  },
};

/**
 * Tab with GET request (no request body, minimal headers).
 */
export const GetRequest: Story = {
  args: {
    entry: createMockEntry({
      request: {
        url: 'https://api.example.com/users',
        method: 'GET',
        headers: {
          'User-Agent': 'runi/1.0.0',
        },
        body: null,
        timeout_ms: 30000,
      },
    }),
  },
};

/**
 * Tab with many headers on both request and response.
 */
export const ManyHeaders: Story = {
  args: {
    entry: createMockEntry({
      request: {
        url: 'https://api.example.com/users',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token123',
          'User-Agent': 'runi/1.0.0',
          'X-Request-ID': 'req-123',
          'X-Correlation-ID': 'corr-456',
          'X-Forwarded-For': '192.168.1.1',
          'X-Forwarded-Proto': 'https',
          Accept: 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        body: '{"name":"John"}',
        timeout_ms: 30000,
      },
      response: {
        status: 200,
        status_text: 'OK',
        headers: {
          'Content-Type': 'application/json',
          'X-Rate-Limit': '100',
          'X-Rate-Limit-Remaining': '99',
          'X-Rate-Limit-Reset': '1640995200',
          'X-Request-ID': 'abc-123-def-456',
          'X-Response-Time': '156ms',
          'X-Powered-By': 'Express',
          'Cache-Control': 'no-cache',
          ETag: 'W/"abc123"',
          'Last-Modified': 'Wed, 21 Oct 2015 07:28:00 GMT',
        },
        body: '{"id":1}',
        timing: {
          total_ms: 156,
          dns_ms: 12,
          connect_ms: 23,
          tls_ms: 34,
          first_byte_ms: 98,
        },
      },
    }),
  },
};

/**
 * Tab with no request headers.
 */
export const NoRequestHeaders: Story = {
  args: {
    entry: createMockEntry({
      request: {
        url: 'https://api.example.com/users',
        method: 'GET',
        headers: {},
        body: null,
        timeout_ms: 30000,
      },
    }),
  },
};

/**
 * Tab with no response headers.
 */
export const NoResponseHeaders: Story = {
  args: {
    entry: createMockEntry({
      response: {
        status: 200,
        status_text: 'OK',
        headers: {},
        body: '{"id":1}',
        timing: {
          total_ms: 156,
          dns_ms: 12,
          connect_ms: 23,
          tls_ms: 34,
          first_byte_ms: 98,
        },
      },
    }),
  },
};

/**
 * Tab with error response (4xx status).
 */
export const ErrorResponse: Story = {
  args: {
    entry: createMockEntry({
      response: {
        status: 404,
        status_text: 'Not Found',
        headers: {
          'Content-Type': 'application/json',
          'X-Error-Code': 'RESOURCE_NOT_FOUND',
          'X-Request-ID': 'abc-123-def-456',
        },
        body: '{"error":"Resource not found"}',
        timing: {
          total_ms: 45,
          dns_ms: 5,
          connect_ms: 10,
          tls_ms: 15,
          first_byte_ms: 30,
        },
      },
    }),
  },
};
