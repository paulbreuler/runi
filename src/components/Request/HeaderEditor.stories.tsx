import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect } from 'react';
import { userEvent, within } from '@storybook/test';
import { HeaderEditor } from './HeaderEditor';
import { useRequestStore } from '@/stores/useRequestStore';

type Story = StoryObj<typeof meta>;

const StoreSeed = ({
  headers = {},
  children,
}: {
  headers?: Record<string, string>;
  children: React.ReactNode;
}): React.JSX.Element => {
  useEffect(() => {
    useRequestStore.setState({ headers });
    return () => {
      useRequestStore.getState().reset();
    };
  }, [headers]);

  return <>{children}</>;
};

const meta = {
  title: 'Components/Request/HeaderEditor',
  component: HeaderEditor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Header editor used inside the request builder. Uses glass inputs to match the search aesthetic and provides inline editing for key/value pairs.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HeaderEditor>;

export default meta;

export const Empty: Story = {
  render: () => (
    <div className="min-h-[420px] bg-bg-app p-6">
      <StoreSeed>
        <HeaderEditor />
      </StoreSeed>
    </div>
  ),
};

export const Editing: Story = {
  render: () => (
    <div className="min-h-[420px] bg-bg-app p-6">
      <StoreSeed headers={{ 'Content-Type': 'application/json' }}>
        <HeaderEditor />
      </StoreSeed>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId('add-header-button'));
  },
};
