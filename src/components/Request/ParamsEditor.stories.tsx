import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useEffect } from 'react';
import { userEvent, within } from '@storybook/test';
import { ParamsEditor } from './ParamsEditor';
import { useRequestStore } from '@/stores/useRequestStore';

type Story = StoryObj<typeof meta>;

const StoreSeed = ({
  url = 'https://httpbin.org/get',
  children,
}: {
  url?: string;
  children: React.ReactNode;
}): React.JSX.Element => {
  useEffect(() => {
    useRequestStore.setState({ url });
    return () => {
      useRequestStore.getState().reset();
    };
  }, [url]);

  return <>{children}</>;
};

const meta = {
  title: 'Components/Request/ParamsEditor',
  component: ParamsEditor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Query parameter editor for the request builder. Shows key/value inputs with glass styling for consistent focus and hover treatments.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ParamsEditor>;

export default meta;

export const Empty: Story = {
  render: () => (
    <div className="min-h-[420px] bg-bg-app p-6">
      <StoreSeed>
        <ParamsEditor />
      </StoreSeed>
    </div>
  ),
};

export const WithParams: Story = {
  render: () => (
    <div className="min-h-[420px] bg-bg-app p-6">
      <StoreSeed url="https://httpbin.org/get?status=active&limit=20">
        <ParamsEditor />
      </StoreSeed>
    </div>
  ),
};

export const Editing: Story = {
  render: () => (
    <div className="min-h-[420px] bg-bg-app p-6">
      <StoreSeed>
        <ParamsEditor />
      </StoreSeed>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('Add Parameter'));
  },
};
