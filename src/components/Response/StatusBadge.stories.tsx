import type { Meta, StoryObj } from '@storybook/react';
import { StatusBadge } from './StatusBadge';

const meta = {
  title: 'Components/Response/StatusBadge',
  component: StatusBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    status: 200,
    statusText: 'OK',
  },
};

export const Created: Story = {
  args: {
    status: 201,
    statusText: 'Created',
  },
};

export const Redirect: Story = {
  args: {
    status: 301,
    statusText: 'Moved Permanently',
  },
};

export const ClientError: Story = {
  args: {
    status: 404,
    statusText: 'Not Found',
  },
};

export const ServerError: Story = {
  args: {
    status: 500,
    statusText: 'Internal Server Error',
  },
};

export const AllStatusRanges: Story = {
  args: {
    status: 200,
    statusText: 'OK',
  },
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <StatusBadge status={200} statusText="OK" />
        <StatusBadge status={201} statusText="Created" />
        <StatusBadge status={204} statusText="No Content" />
      </div>
      <div className="flex flex-wrap gap-3">
        <StatusBadge status={301} statusText="Moved Permanently" />
        <StatusBadge status={302} statusText="Found" />
        <StatusBadge status={307} statusText="Temporary Redirect" />
      </div>
      <div className="flex flex-wrap gap-3">
        <StatusBadge status={400} statusText="Bad Request" />
        <StatusBadge status={401} statusText="Unauthorized" />
        <StatusBadge status={404} statusText="Not Found" />
        <StatusBadge status={429} statusText="Too Many Requests" />
      </div>
      <div className="flex flex-wrap gap-3">
        <StatusBadge status={500} statusText="Internal Server Error" />
        <StatusBadge status={502} statusText="Bad Gateway" />
        <StatusBadge status={503} statusText="Service Unavailable" />
      </div>
    </div>
  ),
};
