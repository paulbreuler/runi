/**
 * @file HeadersPanel Storybook stories
 * @description Visual documentation for HeadersPanel component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { HeadersPanel } from './HeadersPanel';

const meta: Meta<typeof HeadersPanel> = {
  title: 'History/HeadersPanel',
  component: HeadersPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Panel with tabs for Request Headers and Response Headers. Response Headers tab is active by default. Includes copy button for the currently active tab.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof HeadersPanel>;

/**
 * Default panel with both request and response headers.
 */
export const Default: Story = {
  args: {
    requestHeaders: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer token123',
      'User-Agent': 'runi/1.0.0',
    },
    responseHeaders: {
      'Content-Type': 'application/json',
      'X-Rate-Limit': '100',
      'X-Rate-Limit-Remaining': '99',
      'X-Request-ID': 'abc-123-def-456',
    },
  },
};

/**
 * Panel with minimal headers.
 */
export const Minimal: Story = {
  args: {
    requestHeaders: {
      'Content-Type': 'application/json',
    },
    responseHeaders: {
      'Content-Type': 'application/json',
    },
  },
};

/**
 * Panel with many headers.
 */
export const ManyHeaders: Story = {
  args: {
    requestHeaders: {
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
    responseHeaders: {
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
  },
};

/**
 * Panel with no request headers (GET request).
 */
export const NoRequestHeaders: Story = {
  args: {
    requestHeaders: {},
    responseHeaders: {
      'Content-Type': 'application/json',
      'X-Rate-Limit': '100',
    },
  },
};

/**
 * Panel with no response headers.
 */
export const NoResponseHeaders: Story = {
  args: {
    requestHeaders: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer token123',
    },
    responseHeaders: {},
  },
};

/**
 * Panel with no headers at all.
 */
export const NoHeaders: Story = {
  args: {
    requestHeaders: {},
    responseHeaders: {},
  },
};

/**
 * Panel with long header values.
 */
export const LongHeaderValues: Story = {
  args: {
    requestHeaders: {
      'X-Custom-Header':
        'This is a very long header value that demonstrates how the component handles text wrapping',
      Authorization:
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
    },
    responseHeaders: {
      'X-Custom-Response':
        'Another very long header value that will wrap to multiple lines when displayed in the component',
      'Set-Cookie':
        'session_id=abc123def456; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600',
    },
  },
};
