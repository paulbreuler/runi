/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { CanvasHost } from './CanvasHost';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { requestContextDescriptor } from '@/contexts/RequestContext';

const meta = {
  title: 'Layout/CanvasHost',
  component: CanvasHost,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Canvas host that dynamically renders panels based on active context and layout. Supports single panel, columns, rows, and grid arrangements.',
      },
    },
  },
  decorators: [
    (Story) => {
      const { registerContext, setActiveContext } = useCanvasStore.getState();
      registerContext(requestContextDescriptor);
      setActiveContext('request');

      return (
        <div className="h-screen flex flex-col bg-bg-app">
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof CanvasHost>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Side-by-side layout with request and response panels.
 * Default layout for Request context showing both panels in columns.
 */
export const SideBySide: Story = {
  decorators: [
    (Story) => {
      useCanvasStore.getState().setLayout('request', 'request-default'); // Side by side
      return <Story />;
    },
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify both panels render', async () => {
      const requestPanel = canvas.getByTestId('canvas-panel-request');
      const responsePanel = canvas.getByTestId('canvas-panel-response');
      await expect(requestPanel).toBeInTheDocument();
      await expect(responsePanel).toBeInTheDocument();
    });
  },
};

/**
 * Single panel layout showing only the request panel.
 * Useful for focused editing of request details.
 */
export const SinglePanel: Story = {
  decorators: [
    (Story) => {
      useCanvasStore.getState().setLayout('request', 'request-only');
      return <Story />;
    },
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify single panel renders', async () => {
      const panel = canvas.getByTestId('canvas-panel-request');
      await expect(panel).toBeInTheDocument();
    });

    await step('Verify response panel is not rendered', async () => {
      const responsePanel = canvas.queryByTestId('canvas-panel-response');
      await expect(responsePanel).not.toBeInTheDocument();
    });
  },
};
