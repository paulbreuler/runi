import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
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

/**
 * Tests that status badges render correctly with different status codes.
 * StatusBadge is a display-only component with no interactions.
 */
export const StatusRangesTest: Story = {
  args: {
    status: 200,
    statusText: 'OK',
  },
  render: () => (
    <div className="flex flex-col gap-3">
      <StatusBadge status={200} statusText="OK" />
      <StatusBadge status={404} statusText="Not Found" />
      <StatusBadge status={500} statusText="Internal Server Error" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Success status badge renders correctly', async () => {
      const successBadge = canvas.getAllByTestId('status-badge')[0];
      await expect(successBadge).toBeVisible();
      await expect(successBadge).toHaveTextContent('200');
      await expect(successBadge).toHaveTextContent('OK');
    });

    await step('Client error status badge renders correctly', async () => {
      const errorBadge = canvas.getAllByTestId('status-badge')[1];
      await expect(errorBadge).toBeVisible();
      await expect(errorBadge).toHaveTextContent('404');
      await expect(errorBadge).toHaveTextContent('Not Found');
    });

    await step('Server error status badge renders correctly', async () => {
      const serverErrorBadge = canvas.getAllByTestId('status-badge')[2];
      await expect(serverErrorBadge).toBeVisible();
      await expect(serverErrorBadge).toHaveTextContent('500');
      await expect(serverErrorBadge).toHaveTextContent('Internal Server Error');
    });
  },
};
