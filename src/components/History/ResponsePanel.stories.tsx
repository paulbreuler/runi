/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { waitForFocus } from '@/utils/storybook-test-helpers';
import { ResponsePanel } from './ResponsePanel';

const defaultResponseBody = JSON.stringify(
  { id: 1, name: 'John Doe', email: 'john@example.com', createdAt: '2024-01-01T00:00:00Z' },
  null,
  2
);

const defaultRequestBody = JSON.stringify({ name: 'John Doe', email: 'john@example.com' }, null, 2);

const meta: Meta<typeof ResponsePanel> = {
  title: 'History/ResponsePanel',
  component: ResponsePanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Request and response body panel with Base UI Tabs.

- **Keyboard**: Arrow Left/Right to move focus and activate tabs; roving tabindex (Tab moves into panel content).
- **Animated**: Tab indicator uses Motion \`layoutId\` and spring physics.
- JSON is formatted with 2-space indentation. Use controls to vary body content.`,
      },
    },
  },
  argTypes: {
    requestBody: { control: 'text', description: 'Request body (JSON or text)' },
    responseBody: { control: 'text', description: 'Response body (JSON or text)' },
  },
};

export default meta;
type Story = StoryObj<typeof ResponsePanel>;

/**
 * Playground with controls. Play runs keyboard interaction test.
 */
export const Playground: Story = {
  tags: ['test'],
  args: {
    requestBody: defaultRequestBody,
    responseBody: defaultResponseBody,
  },
  render: function PlaygroundRender(args) {
    return (
      <div className="w-full max-w-2xl h-80 bg-bg-app border border-border-default rounded-lg p-4">
        <ResponsePanel requestBody={args.requestBody} responseBody={args.responseBody} />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const responseTab = canvas.getByTestId('response-body-tab');
    const requestTab = canvas.getByTestId('request-body-tab');

    await step('Focus Response Body tab', async () => {
      responseTab.focus();
      await waitForFocus(responseTab, 1000);
      await expect(responseTab).toHaveFocus();
    });

    await step('Arrow Right → focus Request Body and activate', async () => {
      await userEvent.keyboard('{ArrowRight}');
      await expect(requestTab).toHaveFocus();
      const codeBox = canvas.getByTestId('code-box');
      await expect(codeBox).toHaveTextContent('John Doe');
    });

    await step('Arrow Left → focus Response Body and activate', async () => {
      await userEvent.keyboard('{ArrowLeft}');
      await expect(responseTab).toHaveFocus();
      const codeBox = canvas.getByTestId('code-box');
      await expect(codeBox).toHaveTextContent('id');
    });
  },
};

/**
 * Empty states when one or both bodies are missing.
 */
export const WithEmptyStates: Story = {
  tags: ['test'],
  args: {
    requestBody: null,
    responseBody: defaultResponseBody,
  },
  render: function WithEmptyStatesRender(args) {
    return (
      <div className="w-full max-w-2xl h-80 bg-bg-app border border-border-default rounded-lg p-4">
        <ResponsePanel requestBody={args.requestBody} responseBody={args.responseBody} />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Response Body shown by default', async () => {
      const responseTab = canvas.getByTestId('response-body-tab');
      await expect(responseTab).toHaveAttribute('aria-selected', 'true');
    });
    await step('Switch to Request Body shows empty state', async () => {
      const requestTab = canvas.getByTestId('request-body-tab');
      await userEvent.click(requestTab);
      await expect(canvas.getByText(/no request body/i)).toBeInTheDocument();
    });
  },
};
