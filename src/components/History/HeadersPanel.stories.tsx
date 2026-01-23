/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file HeadersPanel Storybook stories
 * @description Visual documentation for HeadersPanel component
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { HeadersPanel } from './HeadersPanel';
import { waitForFocus } from '@/utils/storybook-test-helpers';

const meta: Meta<typeof HeadersPanel> = {
  title: 'History/Tabs/HeadersPanel',
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

/**
 * Tests keyboard navigation between secondary tabs.
 * Feature #2: Hierarchical Keyboard Navigation (secondary tabs)
 *
 * Verifies:
 * - Tab focuses first secondary tab
 * - ArrowRight moves to next secondary tab
 * - ArrowLeft moves to previous secondary tab
 * - Arrow navigation adds data-focus-visible-added attribute
 */
export const SecondaryTabNavigationTest: Story = {
  args: {
    requestHeaders: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer token123',
    },
    responseHeaders: {
      'Content-Type': 'application/json',
      'X-Rate-Limit': '100',
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab focuses first secondary tab (Response Headers)', async () => {
      await userEvent.tab();

      const responseHeadersTab = canvas.getByTestId('response-headers-tab');
      await waitForFocus(responseHeadersTab, 1000);
      await expect(responseHeadersTab).toHaveFocus();
    });

    await step('ArrowRight moves to Request Headers tab with focus ring', async () => {
      await userEvent.keyboard('{ArrowRight}');

      // Wait for focus to settle
      await new Promise((resolve) => setTimeout(resolve, 100));

      const requestHeadersTab = canvas.getByTestId('request-headers-tab');
      await expect(requestHeadersTab).toHaveFocus();

      // Arrow navigation should add data-focus-visible-added for focus ring visibility
      await expect(requestHeadersTab).toHaveAttribute('data-focus-visible-added');
    });

    await step('ArrowLeft moves back to Response Headers tab', async () => {
      await userEvent.keyboard('{ArrowLeft}');

      await new Promise((resolve) => setTimeout(resolve, 100));

      const responseHeadersTab = canvas.getByTestId('response-headers-tab');
      await expect(responseHeadersTab).toHaveFocus();
      await expect(responseHeadersTab).toHaveAttribute('data-focus-visible-added');

      // Previous tab should no longer have the attribute
      const requestHeadersTab = canvas.getByTestId('request-headers-tab');
      await expect(requestHeadersTab).not.toHaveAttribute('data-focus-visible-added');
    });

    await step('ArrowRight wraps from last to first tab', async () => {
      // We're on Response Headers, go to Request Headers
      await userEvent.keyboard('{ArrowRight}');
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Now press ArrowRight again - should wrap to Response Headers
      await userEvent.keyboard('{ArrowRight}');
      await new Promise((resolve) => setTimeout(resolve, 100));

      const responseHeadersTab = canvas.getByTestId('response-headers-tab');
      await expect(responseHeadersTab).toHaveFocus();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Feature #2: Tests keyboard navigation within HeadersPanel secondary tabs. Arrow keys navigate between tabs and show focus ring via data-focus-visible-added attribute.',
      },
    },
  },
};
