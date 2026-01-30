/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { tabToElement, waitForFocus } from '@/utils/storybook-test-helpers';
import { HeadersPanel } from './HeadersPanel';

const defaultRequestHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  Authorization: 'Bearer token123',
  'User-Agent': 'runi/1.0.0',
};

const defaultResponseHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  'X-Rate-Limit': '100',
  'X-Rate-Limit-Remaining': '99',
  'X-Request-ID': 'abc-123-def-456',
};

const meta: Meta<typeof HeadersPanel> = {
  title: 'History/HeadersPanel',
  component: HeadersPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Request and response headers panel with Base UI Tabs.

- **Keyboard**: Arrow Left/Right to move focus and activate tabs; roving tabindex (Tab moves into panel content).
- **Animated**: Tab indicator uses Motion \`layoutId\` and spring physics.
- Use controls to vary header data.`,
      },
    },
  },
  argTypes: {
    requestHeaders: { control: 'object', description: 'Request headers' },
    responseHeaders: { control: 'object', description: 'Response headers' },
  },
};

export default meta;
type Story = StoryObj<typeof HeadersPanel>;

/**
 * Playground with controls. Play runs keyboard interaction test.
 */
export const Playground: Story = {
  tags: ['test'],
  args: {
    requestHeaders: defaultRequestHeaders,
    responseHeaders: defaultResponseHeaders,
  },
  render: function PlaygroundRender(args) {
    return (
      <div className="w-full max-w-2xl h-80 bg-bg-app border border-border-default rounded-lg p-4">
        <HeadersPanel requestHeaders={args.requestHeaders} responseHeaders={args.responseHeaders} />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const responseTab = canvas.getByTestId('response-headers-tab');
    const requestTab = canvas.getByTestId('request-headers-tab');

    await step('Focus Response Headers tab', async () => {
      const focused = await tabToElement(responseTab, 6);
      await expect(focused).toBe(true);
      await waitForFocus(responseTab, 1000);
      await expect(responseTab).toHaveFocus();
    });

    await step('Arrow Right → focus Request Headers and activate', async () => {
      await userEvent.keyboard('{ArrowRight}');
      await expect(requestTab).toHaveFocus();
      const codeBox = canvas.getByTestId('code-box');
      await expect(codeBox).toHaveTextContent('Authorization');
    });

    await step('Arrow Left → focus Response Headers and activate', async () => {
      await userEvent.keyboard('{ArrowLeft}');
      await expect(responseTab).toHaveFocus();
      const codeBox = canvas.getByTestId('code-box');
      await expect(codeBox).toHaveTextContent('X-Rate-Limit');
    });
  },
};

/**
 * Empty states when one or both header sets are missing.
 */
export const WithEmptyStates: Story = {
  tags: ['test'],
  args: {
    requestHeaders: {},
    responseHeaders: defaultResponseHeaders,
  },
  render: function WithEmptyStatesRender(args) {
    return (
      <div className="w-full max-w-2xl h-80 bg-bg-app border border-border-default rounded-lg p-4">
        <HeadersPanel requestHeaders={args.requestHeaders} responseHeaders={args.responseHeaders} />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Response Headers shown by default', async () => {
      const responseTab = canvas.getByTestId('response-headers-tab');
      await expect(responseTab).toHaveAttribute('aria-selected', 'true');
    });
    await step('Switch to Request Headers shows empty state', async () => {
      const requestTab = canvas.getByTestId('request-headers-tab');
      await userEvent.click(requestTab);
      await expect(canvas.getByText(/no request headers/i)).toBeInTheDocument();
    });
  },
};
