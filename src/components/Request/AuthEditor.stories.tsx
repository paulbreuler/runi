import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { AuthEditor } from './AuthEditor';
import { useRequestStore } from '@/stores/useRequestStore';

type Story = StoryObj<typeof meta>;

const seedStore = (headers: Record<string, string>): void => {
  useRequestStore.setState({ headers });
};

const meta = {
  title: 'Components/Request/AuthEditor',
  component: AuthEditor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Authentication editor used in the request builder. Uses glass inputs for tokens and credentials to keep focus styles consistent.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AuthEditor>;

export default meta;

export const Empty: Story = {
  render: () => {
    seedStore({});
    return (
      <div className="min-h-[420px] bg-bg-app p-6">
        <AuthEditor />
      </div>
    );
  },
};

export const BearerToken: Story = {
  render: () => {
    seedStore({ Authorization: 'Bearer sk-live-demo-token' });
    return (
      <div className="min-h-[420px] bg-bg-app p-6">
        <AuthEditor />
      </div>
    );
  },
};
