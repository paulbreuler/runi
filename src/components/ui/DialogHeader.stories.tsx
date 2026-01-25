/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file DialogHeader Storybook stories
 * @description Consolidated story using Storybook 10 controls
 *
 * DialogHeader displays a dialog header with title, optional actions, and close button.
 * Use controls to explore different configurations.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { DialogHeader, type DialogHeaderProps } from './DialogHeader';
import { tabToElement } from '@/utils/storybook-test-helpers';

const meta = {
  title: 'UI/DialogHeader',
  component: DialogHeader,
  parameters: {
    layout: 'padded',
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        component: `Dialog header component with 3-column grid layout.

**Features:**
- Title on left
- Optional actions in center/right
- Close button on rightmost
- All items aligned center (same height)
- Keyboard accessible (Tab, Enter, Escape)

Use the Controls panel to explore different title and action configurations.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Header title text',
    },
    onClose: {
      action: 'onClose',
      description: 'Callback when close button is clicked',
    },
    actions: {
      control: false,
      description: 'Optional actions to display (center/right)',
    },
  },
  args: {
    title: 'App Metrics',
    onClose: (): void => {
      // Storybook action handler
    },
  },
} satisfies Meta<DialogHeaderProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Playground with controls for all DialogHeader features.
 * Use controls to explore different title and action configurations.
 */
export const Playground: Story = {
  render: (args) => {
    return <DialogHeader {...args} />;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('Verify DialogHeader renders', async () => {
      const header = await canvas.findByTestId('dialog-header', {}, { timeout: 3000 });
      await expect(header).toBeInTheDocument();
    });

    await step('Verify title is visible', async () => {
      const title = await canvas.findByText(args.title, {}, { timeout: 3000 });
      await expect(title).toBeInTheDocument();
    });

    await step('Verify close button is visible and keyboard accessible', async () => {
      const closeButton = await canvas.findByTestId('dialog-close-button', {}, { timeout: 3000 });
      await expect(closeButton).toBeInTheDocument();
      const focused = await tabToElement(closeButton, 5);
      await expect(focused).toBe(true);
      await expect(closeButton).toHaveFocus();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground for DialogHeader. Use the Controls panel to configure the title. The component displays a 3-column grid with title on left, optional actions in center/right, and close button on rightmost.',
      },
    },
  },
};
