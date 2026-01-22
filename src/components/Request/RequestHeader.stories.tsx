import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
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
