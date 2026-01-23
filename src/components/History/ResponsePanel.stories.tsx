/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file ResponsePanel Storybook stories
 * @description Visual documentation for ResponsePanel component
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ResponsePanel } from './ResponsePanel';
import { waitForFocus } from '@/utils/storybook-test-helpers';

const meta: Meta<typeof ResponsePanel> = {
  title: 'History/Tabs/ResponsePanel',
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
      },
      null,
      2
    ),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab focuses first secondary tab (Response Body)', async () => {
      await userEvent.tab();

      const responseBodyTab = canvas.getByTestId('response-body-tab');
      await waitForFocus(responseBodyTab, 1000);
      await expect(responseBodyTab).toHaveFocus();
    });

    await step('ArrowRight moves to Request Body tab with focus ring', async () => {
      await userEvent.keyboard('{ArrowRight}');

      // Wait for focus to settle
      await new Promise((resolve) => setTimeout(resolve, 100));

      const requestBodyTab = canvas.getByTestId('request-body-tab');
      await expect(requestBodyTab).toHaveFocus();

      // Arrow navigation should add data-focus-visible-added for focus ring visibility
      await expect(requestBodyTab).toHaveAttribute('data-focus-visible-added');
    });

    await step('ArrowLeft moves back to Response Body tab', async () => {
      await userEvent.keyboard('{ArrowLeft}');

      await new Promise((resolve) => setTimeout(resolve, 100));

      const responseBodyTab = canvas.getByTestId('response-body-tab');
      await expect(responseBodyTab).toHaveFocus();
      await expect(responseBodyTab).toHaveAttribute('data-focus-visible-added');

      // Previous tab should no longer have the attribute
      const requestBodyTab = canvas.getByTestId('request-body-tab');
      await expect(requestBodyTab).not.toHaveAttribute('data-focus-visible-added');
    });

    await step('ArrowRight wraps from last to first tab', async () => {
      // We're on Response Body, go to Request Body
      await userEvent.keyboard('{ArrowRight}');
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Now press ArrowRight again - should wrap to Response Body
      await userEvent.keyboard('{ArrowRight}');
      await new Promise((resolve) => setTimeout(resolve, 100));

      const responseBodyTab = canvas.getByTestId('response-body-tab');
      await expect(responseBodyTab).toHaveFocus();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Feature #2: Tests keyboard navigation within ResponsePanel secondary tabs. Arrow keys navigate between tabs and show focus ring via data-focus-visible-added attribute.',
      },
    },
  },
};
