/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file StatusBadge Storybook stories
 * @description Visual documentation for StatusBadge component with controls
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusBadge } from './StatusBadge';

const meta = {
  title: 'Response/StatusBadge',
  component: StatusBadge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Status badge component showing HTTP status codes with semantic colors.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'number',
      min: 100,
      max: 599,
      step: 1,
      description: 'HTTP status code',
    },
    statusText: {
      control: 'text',
      description: 'Status text (e.g., "OK", "Not Found")',
    },
  },
  args: {
    status: 200,
    statusText: 'OK',
  },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Playground with controls for all status codes.
 */
export const Playground: Story = {
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
