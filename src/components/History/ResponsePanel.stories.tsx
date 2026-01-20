/**
 * @file ResponsePanel Storybook stories
 * @description Visual documentation for ResponsePanel component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ResponsePanel } from './ResponsePanel';

const meta: Meta<typeof ResponsePanel> = {
  title: 'History/ResponsePanel',
  component: ResponsePanel,
  parameters: {
    docs: {
      description: {
        component:
          "Panel with tabs for Request Body and Response Body. Response Body tab is active by default. Includes copy button for the currently active tab's content.",
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ResponsePanel>;

/**
 * Default panel with both request and response bodies.
 */
export const Default: Story = {
  args: {
    requestBody: JSON.stringify(
      {
        name: 'John Doe',
        email: 'john@example.com',
      },
      null,
      2
    ),
    responseBody: JSON.stringify(
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: '2024-01-01T00:00:00Z',
      },
      null,
      2
    ),
  },
};

/**
 * Panel with null request body (GET request).
 */
export const NoRequestBody: Story = {
  args: {
    requestBody: null,
    responseBody: JSON.stringify(
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
};

/**
 * Panel with large JSON bodies.
 */
export const LargeBodies: Story = {
  args: {
    requestBody: JSON.stringify(
      {
        data: Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          name: `Item ${String(i + 1)}`,
          description: `Description for item ${String(i + 1)}`,
        })),
      },
      null,
      2
    ),
    responseBody: JSON.stringify(
      {
        success: true,
        data: Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          name: `Item ${String(i + 1)}`,
          status: 'active',
        })),
        pagination: {
          page: 1,
          total: 50,
        },
      },
      null,
      2
    ),
  },
};
