import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from '@storybook/test';
import { tabToElement } from '@/utils/storybook-test-helpers';
import { RequestHeader } from './RequestHeader';
import type { HttpMethod } from '@/utils/http-colors';

const meta = {
  title: 'Components/Request/RequestHeader',
  component: RequestHeader,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RequestHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const RequestHeaderWithState = ({
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
      <RequestHeader
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
  render: () => <RequestHeaderWithState />,
};

export const Loading: Story = {
  args: {
    method: 'POST',
  },
  render: () => <RequestHeaderWithState initialMethod="POST" loading={true} />,
};

export const EmptyUrl: Story = {
  args: {
    method: 'GET',
  },
  render: () => <RequestHeaderWithState initialUrl="" />,
};

export const AllMethods: Story = {
  args: {
    method: 'GET',
  },
  render: () => <RequestHeaderWithState initialUrl="https://api.example.com/resource" />,
};

/**
 * Tests form interactions: method selection, URL input, and send button.
 */
export const FormInteractionsTest: Story = {
  render: () => <RequestHeaderWithState />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Select HTTP method', async () => {
      const methodSelect = canvas.getByTestId('method-select');
      await userEvent.click(methodSelect);
      const postOption = canvas.getByText('POST');
      await userEvent.click(postOption);
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
  render: () => <RequestHeaderWithState />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab to method select', async () => {
      const methodSelect = canvas.getByTestId('method-select');
      const focused = await tabToElement(methodSelect, 5);
      void expect(focused).toBe(true);
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
