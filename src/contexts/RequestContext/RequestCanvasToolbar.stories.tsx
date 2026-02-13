/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { RequestCanvasToolbar } from './RequestCanvasToolbar';
import { useRequestStoreRaw } from '@/stores/useRequestStore';

const meta = {
  title: 'Contexts/RequestCanvasToolbar',
  component: RequestCanvasToolbar,
  parameters: {
    docs: {
      description: {
        component:
          'Request canvas toolbar with action buttons (Send, Save, etc.). Context-specific toolbar for Request context.',
      },
    },
  },
  decorators: [
    (Story) => {
      useRequestStoreRaw.getState().initContext('global', {
        url: 'https://api.example.com/users',
        method: 'GET',
        headers: {},
        body: '',
      });

      return (
        <div className="p-4 bg-bg-app">
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof RequestCanvasToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default toolbar with Send button enabled.
 * Shows action buttons for valid request configuration.
 */
export const Default: Story = {
  args: {
    contextId: 'request',
    isPopout: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify action buttons render', async () => {
      const toolbar = canvas.getByTestId('request-canvas-toolbar');
      await expect(toolbar).toBeInTheDocument();
    });

    await step('Verify Send button is enabled', async () => {
      const sendButton = canvas.getByTestId('send-button');
      await expect(sendButton).toBeEnabled();
    });
  },
};

/**
 * Disabled state when URL is empty.
 * Send button should be disabled when request URL is not provided.
 */
export const Disabled: Story = {
  decorators: [
    (Story) => {
      useRequestStoreRaw.getState().initContext('global', { url: '' }); // Empty URL
      return <Story />;
    },
  ],
  args: {
    contextId: 'request',
    isPopout: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Send button is disabled', async () => {
      const sendButton = canvas.getByTestId('send-button');
      await expect(sendButton).toBeDisabled();
    });
  },
};
