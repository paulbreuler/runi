/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file ResponseViewer Storybook stories
 * @description Consolidated story using Storybook 10 controls for all state variations
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { tabToElement, waitForFocus } from '@/utils/storybook-test-helpers';
import { ResponseViewer, type ResponseViewerProps } from './ResponseViewer';
import { StatusBadge } from './StatusBadge';
import type { HttpResponse } from '@/types/http';

// Custom args for story controls (not part of component props)
interface ResponseViewerStoryArgs {
  responseStatus?: 'success' | 'error' | 'redirect' | 'client-error' | 'server-error';
  responseSize?: 'small' | 'medium' | 'large';
}

const meta = {
  title: 'Response/ResponseViewer',
  component: ResponseViewer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `Response viewer components for displaying HTTP responses.

**Components:**
- **ResponseViewer** - Response viewer with tabs for Body, Headers, and Raw views
- **StatusBadge** - Status badge component showing HTTP status codes with semantic colors

Use controls to explore different response statuses and sizes.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    responseStatus: {
      control: 'select',
      options: ['success', 'error', 'redirect', 'client-error', 'server-error'],
      description: 'Response status type',
    },
    responseSize: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Response body size',
    },
  },
  args: {
    responseStatus: 'success',
    responseSize: 'medium',
  },
} satisfies Meta<ResponseViewerProps & ResponseViewerStoryArgs>;

export default meta;
type Story = StoryObj<ResponseViewerProps & ResponseViewerStoryArgs>;

const createMockResponse = (
  status: number,
  statusText: string,
  bodySize: 'small' | 'medium' | 'large' = 'medium'
): HttpResponse => {
  let bodyData: Record<string, unknown>;
  if (bodySize === 'small') {
    bodyData = { id: 1, name: 'John' };
  } else if (bodySize === 'large') {
    bodyData = {
      users: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `User ${String(i + 1)}`,
        email: `user${String(i + 1)}@example.com`,
      })),
    };
  } else {
    bodyData = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      active: true,
    };
  }

  return {
    status,
    status_text: statusText,
    headers: {
      'content-type': 'application/json',
      'content-length': String(JSON.stringify(bodyData).length),
      date: 'Wed, 16 Jan 2025 00:00:00 GMT',
    },
    body: JSON.stringify(bodyData, null, 2),
    timing: {
      total_ms: 245,
      dns_ms: 12,
      connect_ms: 45,
      tls_ms: 78,
      first_byte_ms: 110,
    },
  };
};

/**
 * Playground with controls for all ResponseViewer features.
 */
export const Playground: Story = {
  tags: ['test'],
  render: (args: ResponseViewerProps & ResponseViewerStoryArgs) => {
    const statusMap = {
      success: { status: 200, text: 'OK' },
      error: { status: 500, text: 'Internal Server Error' },
      redirect: { status: 301, text: 'Moved Permanently' },
      'client-error': { status: 404, text: 'Not Found' },
      'server-error': { status: 500, text: 'Internal Server Error' },
    };

    const responseStatusKey = args.responseStatus ?? 'success';
    const statusEntry = statusMap[responseStatusKey];
    const { status, text } = statusEntry;
    const response = createMockResponse(status, text, args.responseSize ?? 'medium');

    return (
      <div className="h-screen border border-border-default bg-bg-app">
        <ResponseViewer response={response} />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Test tab navigation', async () => {
      const headersTab = canvas.queryByTestId('response-tab-headers');
      if (headersTab !== null) {
        const focused = await tabToElement(headersTab, 6);
        await expect(focused).toBe(true);
        await waitForFocus(headersTab, 1000);
        await expect(headersTab).toHaveClass('font-medium');
      }
    });
    await step('Arrow Right focuses Raw tab', async () => {
      const rawTab = canvas.queryByTestId('response-tab-raw');
      if (rawTab !== null) {
        await userEvent.keyboard('{ArrowRight}');
        await expect(rawTab).toHaveFocus();
      }
    });
  },
};

// ============================================================================
// StatusBadge Stories
// ============================================================================

/**
 * StatusBadge - playground with controls for all status codes.
 */
export const StatusBadgePlayground: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <StatusBadge status={200} statusText="OK" />
        <StatusBadge status={201} statusText="Created" />
        <StatusBadge status={204} statusText="No Content" />
      </div>
      <div className="flex flex-wrap gap-3">
        <StatusBadge status={301} statusText="Moved Permanently" />
        <StatusBadge status={302} statusText="Found" />
        <StatusBadge status={307} statusText="Temporary Redirect" />
      </div>
      <div className="flex flex-wrap gap-3">
        <StatusBadge status={400} statusText="Bad Request" />
        <StatusBadge status={401} statusText="Unauthorized" />
        <StatusBadge status={404} statusText="Not Found" />
        <StatusBadge status={429} statusText="Too Many Requests" />
      </div>
      <div className="flex flex-wrap gap-3">
        <StatusBadge status={500} statusText="Internal Server Error" />
        <StatusBadge status={502} statusText="Bad Gateway" />
        <StatusBadge status={503} statusText="Service Unavailable" />
      </div>
    </div>
  ),
};
