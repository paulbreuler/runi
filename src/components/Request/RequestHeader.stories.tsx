import type { Meta, StoryObj } from '@storybook/react';
import { RequestHeader } from './RequestHeader';
import { useState } from 'react';
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

export const Default: Story = {
  render: () => {
    const [method, setMethod] = useState<HttpMethod>('GET');
    const [url, setUrl] = useState('https://api.example.com/users');
    
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
        />
      </div>
    );
  },
};

export const Loading: Story = {
  render: () => (
    <div className="w-full border border-border-default bg-bg-app">
      <RequestHeader
        method="POST"
        url="https://api.example.com/users"
        loading={true}
      />
    </div>
  ),
};

export const EmptyUrl: Story = {
  render: () => {
    const [method, setMethod] = useState<HttpMethod>('GET');
    const [url, setUrl] = useState('');
    
    return (
      <div className="w-full border border-border-default bg-bg-app">
        <RequestHeader
          method={method}
          url={url}
          onMethodChange={setMethod}
          onUrlChange={setUrl}
        />
      </div>
    );
  },
};

export const AllMethods: Story = {
  render: () => {
    const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    const [method, setMethod] = useState<HttpMethod>('GET');
    const [url, setUrl] = useState('https://api.example.com/resource');
    
    return (
      <div className="w-full border border-border-default bg-bg-app">
        <RequestHeader
          method={method}
          url={url}
          onMethodChange={setMethod}
          onUrlChange={setUrl}
        />
      </div>
    );
  },
};
