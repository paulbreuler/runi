import type { Meta, StoryObj } from '@storybook/react-vite';
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
    date: 'Wed, 16 Jan 2025 00:00:00 GMT',
  },
  body: JSON.stringify(
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      active: true,
    },
    null,
    2
  ),
  timing: {
    total_ms: 245,
    dns_ms: 12,
    connect_ms: 45,
    tls_ms: 78,
    first_byte_ms: 110,
  },
};

const mockErrorResponse: HttpResponse = {
  status: 404,
  status_text: 'Not Found',
  headers: {
    'content-type': 'application/json',
    date: 'Wed, 16 Jan 2025 00:00:00 GMT',
  },
  body: JSON.stringify(
    {
      error: 'Resource not found',
      code: 404,
    },
    null,
    2
  ),
  timing: {
    total_ms: 123,
    dns_ms: 5,
    connect_ms: 20,
    tls_ms: 30,
    first_byte_ms: 55,
  },
};

const mockLargeResponse: HttpResponse = {
  status: 200,
  status_text: 'OK',
  headers: {
    'content-type': 'application/json',
    'content-length': '5000',
  },
  body: JSON.stringify(
    {
      users: Array.from({ length: 10 }, (_, i) => {
        const id = i + 1;
        return {
          id,
          name: `User ${String(id)}`,
          email: `user${String(id)}@example.com`,
        };
      }),
    },
    null,
    2
  ),
  timing: {
    total_ms: 500,
    dns_ms: 10,
    connect_ms: 50,
    tls_ms: 100,
    first_byte_ms: 160,
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
