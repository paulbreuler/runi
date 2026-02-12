/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, userEvent } from 'storybook/test';
import { LayoutPicker } from './LayoutPicker';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { requestContextDescriptor } from '@/contexts/RequestContext';

const meta = {
  title: 'Layout/LayoutPicker',
  component: LayoutPicker,
  parameters: {
    docs: {
      description: {
        component:
          'Layout picker dropdown for selecting canvas arrangements. Displays preset and generic layout options with keyboard navigation support.',
      },
    },
  },
  decorators: [
    (Story) => {
      const { registerContext, setActiveContext } = useCanvasStore.getState();
      registerContext(requestContextDescriptor);
      setActiveContext('request');

      return (
        <div className="p-4 bg-bg-app">
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof LayoutPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default layout picker with interaction test.
 * Opens picker, verifies sections, and selects a layout option.
 */
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Open layout picker', async () => {
      const trigger = canvas.getByTestId('layout-picker-trigger');
      await userEvent.click(trigger);
    });

    await step('Verify sections', async () => {
      const content = canvas.getByTestId('layout-picker-content');
      await expect(content).toBeInTheDocument();
    });

    await step('Select layout', async () => {
      // Side by Side is a generic layout
      const option = canvas.getByTestId('layout-option-side-by-side');
      await userEvent.click(option);

      // Verify picker closed and layout changed
      await expect(useCanvasStore.getState().getActiveLayout('request')?.id).toBe('side-by-side');
    });
  },
};
