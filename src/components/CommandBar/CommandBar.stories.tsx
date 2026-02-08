/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { waitForFocus } from '@/utils/storybook-test-helpers';
import { CommandBar } from './CommandBar';
import type { HttpMethod } from '@/utils/http-colors';

const meta = {
  title: 'CommandBar/CommandBar',
  component: CommandBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CommandBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const CommandBarWithState = ({
  initialMethod = 'GET',
  initialUrl = 'https://api.example.com/users',
  loading = false,
}: {
  initialMethod?: HttpMethod;
  initialUrl?: string;
  loading?: boolean;
}): React.JSX.Element => {
  const [method, setMethod] = useState<HttpMethod>(initialMethod);
  const [url, setUrl] = useState(initialUrl);

  return (
    <div className="w-full border border-border-default bg-bg-app">
      <CommandBar
        method={method}
        url={url}
        onMethodChange={setMethod}
        onUrlChange={setUrl}
        onSend={() => {
          alert(`Sending ${method} request to ${url}`);
        }}
        loading={loading}
      />
    </div>
  );
};

export const Default: Story = {
  args: {
    method: 'GET',
  },
  render: () => <CommandBarWithState />,
};

export const Loading: Story = {
  args: {
    method: 'POST',
  },
  render: () => <CommandBarWithState initialMethod="POST" loading={true} />,
};

export const EmptyUrl: Story = {
  args: {
    method: 'GET',
  },
  render: () => <CommandBarWithState initialUrl="" />,
};

export const AllMethods: Story = {
  args: {
    method: 'GET',
  },
  render: () => <CommandBarWithState initialUrl="https://api.example.com/resource" />,
};

/**
 * Tests form interactions: method selection, URL input, and send button.
 */
export const FormInteractionsTest: Story = {
  args: {
    method: 'GET',
    url: 'https://api.example.com/users',
  },
  render: () => <CommandBarWithState />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Select HTTP method', async () => {
      const methodSelect = canvas.getByTestId('method-select');
      await userEvent.click(methodSelect);
      // Wait for select to open
      await new Promise((resolve) => setTimeout(resolve, 200));
      // Radix Select renders options in a portal (document.body), search there
      const postOption = await within(document.body).findByRole(
        'option',
        { name: /^post$/i },
        { timeout: 3000 }
      );
      await userEvent.click(postOption);
      // Wait for select to close and update
      await new Promise((resolve) => setTimeout(resolve, 200));
      await expect(methodSelect).toHaveTextContent('POST');
    });

    await step('Type URL', async () => {
      const urlInput = canvas.getByTestId('url-input');
      await userEvent.clear(urlInput);
      await userEvent.type(urlInput, 'https://api.example.com/users');
      await expect(urlInput).toHaveValue('https://api.example.com/users');
    });

    await step('Send request with Enter key', async () => {
      // Mock the onSend handler
      const sendButton = canvas.getByTestId('send-button');
      await expect(sendButton).not.toBeDisabled();
      await userEvent.keyboard('{Enter}');
    });
  },
};

/**
 * Tests keyboard navigation through form elements.
 */
export const KeyboardNavigationTest: Story = {
  args: {
    method: 'GET',
    url: 'https://api.example.com/users',
  },
  render: () => <CommandBarWithState />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab to method select', async () => {
      const methodSelect = canvas.getByTestId('method-select');
      methodSelect.focus();
      await waitForFocus(methodSelect, 1000);
      await expect(methodSelect).toHaveFocus();
    });

    await step('Tab to URL input', async () => {
      const urlInput = canvas.getByTestId('url-input');
      await userEvent.tab();
      await expect(urlInput).toHaveFocus();
    });

    await step('Tab to send button', async () => {
      const sendButton = canvas.getByTestId('send-button');
      await userEvent.tab();
      await expect(sendButton).toHaveFocus();
    });
  },
};
