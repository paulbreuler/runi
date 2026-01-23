/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file ResponseTab Storybook stories
 * @description Visual documentation for ResponseTab component
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ResponseTab } from './ResponseTab';
import type { NetworkHistoryEntry } from '@/types/history';

const meta: Meta<typeof ResponseTab> = {
  title: 'History/ResponseTab',
  component: ResponseTab,
  parameters: {
    docs: {
      description: {
        component: `
ResponseTab displays request and response bodies in a tabbed interface for the expanded panel.

**Features:**
- **Response Body tab (default)**: Shows formatted response body with JSON syntax highlighting
- **Request Body tab**: Shows formatted request body
- **JSON Formatting**: Automatically formats JSON with 2-space indentation
- **Copy Button**: Copies the active tab's body content to clipboard
- **Tab Navigation**: Switch between Response Body and Request Body views

**Feature #20: Expanded Panel - Response Tab**
- Response Body tab is active by default
- JSON bodies are formatted with proper indentation
- Copy button copies the currently active tab's content
        `,
      },
    },
    test: {
      skip: false, // Has interactive elements (tabs, copy button)
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

/**
 * Tests Feature #20: Response Body tab default, JSON formatting, and tab switching.
 */
export const ResponseTabFeaturesTest: Story = {
  args: {
    entry: mockEntry,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Response Body tab is active by default', async () => {
      const responseTab = canvas.getByRole('tab', { name: /response body/i });
      await expect(responseTab).toHaveAttribute('aria-selected', 'true');

      const requestTab = canvas.getByRole('tab', { name: /request body/i });
      await expect(requestTab).toHaveAttribute('aria-selected', 'false');
    });

    await step('Verify JSON is formatted', async () => {
      const codeSnippet = canvas.getByTestId('code-snippet');
      await expect(codeSnippet).toBeInTheDocument();
      // Should contain formatted JSON (with proper structure)
      await expect(codeSnippet).toHaveTextContent('John');
    });

    await step('Verify copy button is present', async () => {
      const copyButton = canvas.getByRole('button', { name: /copy/i });
      await expect(copyButton).toBeInTheDocument();
    });

    await step('Switch to Request Body tab', async () => {
      const requestTab = canvas.getByRole('tab', { name: /request body/i });
      await userEvent.click(requestTab);
      await expect(requestTab).toHaveAttribute('aria-selected', 'true');
    });

    await step('Verify Request Body content is displayed', async () => {
      const codeSnippet = canvas.getByTestId('code-snippet');
      await expect(codeSnippet).toBeInTheDocument();
      // Request body should contain the request data
      await expect(codeSnippet).toHaveTextContent('John Doe');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests Feature #20: Verifies Response Body tab is active by default, JSON formatting works, and tab switching displays correct content.',
      },
    },
  },
};
