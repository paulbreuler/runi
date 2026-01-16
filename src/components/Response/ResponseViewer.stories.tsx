import type { Meta, StoryObj } from '@storybook/react';
import { ResponseViewer } from './ResponseViewer';
import type { HttpResponse } from '@/types/http';

const meta = {
  title: 'Components/Response/ResponseViewer',
  component: ResponseViewer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ResponseViewer>;

const mockResponse: HttpResponse = {
  status: 200,
  status_text: 'OK',
  headers: {
    'content-type': 'application/json',
    'content-length': '123',
    'date': 'Wed, 16 Jan 2025 00:00:00 GMT',
  },
  body: JSON.stringify({
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    active: true,
  }, null, 2),
  timing: {
    total_ms: 245,
    dns_ms: 12,
    connect_ms: 45,
    ssl_ms: 78,
    send_ms: 2,
    wait_ms: 108,
    receive_ms: 0,
  },
};

const mockErrorResponse: HttpResponse = {
  status: 404,
  status_text: 'Not Found',
  headers: {
    'content-type': 'application/json',
    'date': 'Wed, 16 Jan 2025 00:00:00 GMT',
  },
  body: JSON.stringify({
    error: 'Resource not found',
    code: 404,
  }, null, 2),
  timing: {
    total_ms: 123,
    dns_ms: 5,
    connect_ms: 20,
    ssl_ms: 30,
    send_ms: 1,
    wait_ms: 67,
    receive_ms: 0,
  },
};

const mockLargeResponse: HttpResponse = {
  status: 200,
  status_text: 'OK',
  headers: {
    'content-type': 'application/json',
    'content-length': '5000',
  },
  body: JSON.stringify({
    users: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
    })),
  }, null, 2),
  timing: {
    total_ms: 500,
    dns_ms: 10,
    connect_ms: 50,
    ssl_ms: 100,
    send_ms: 5,
    wait_ms: 335,
    receive_ms: 0,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    response: mockResponse,
  },
  render: (args) => (
    <div className="h-screen border border-border-default bg-bg-app">
      <ResponseViewer {...args} />
    </div>
  ),
};

export const ErrorResponse: Story = {
  args: {
    response: mockErrorResponse,
  },
  render: (args) => (
    <div className="h-screen border border-border-default bg-bg-app">
      <ResponseViewer {...args} />
    </div>
  ),
};

export const LargeResponse: Story = {
  args: {
    response: mockLargeResponse,
  },
  render: (args) => (
    <div className="h-screen border border-border-default bg-bg-app">
      <ResponseViewer {...args} />
    </div>
  ),
};
