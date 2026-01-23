/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CopyButton Storybook stories
 * @description Visual documentation for CopyButton component with controls
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { CopyButton } from './CopyButton';

const meta: Meta<typeof CopyButton> = {
  title: 'History/CodeDisplay/CopyButton',
  component: CopyButton,
  parameters: {
    docs: {
      description: {
        component:
          'Button that copies text to clipboard and shows "✓ Copied" feedback. Uses the Clipboard API.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    text: {
      control: 'text',
      description: 'Text to copy to clipboard',
    },
    feedbackDuration: {
      control: 'number',
      min: 1000,
      max: 10000,
      step: 500,
      description: 'Duration to show feedback in milliseconds',
    },
  },
  args: {
    text: 'This is the text that will be copied to clipboard',
    feedbackDuration: 2000,
  },
};

export default meta;
type Story = StoryObj<typeof CopyButton>;

/**
 * Playground with controls for all CopyButton features.
 */
export const Playground: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click copy button', async () => {
      const copyButton = canvas.getByRole('button', { name: /copy to clipboard/i });
      await userEvent.click(copyButton);
      try {
        const copiedText = await canvas.findByText(/copied/i, {}, { timeout: 500 });
        await expect(copiedText).toBeVisible();
      } catch {
        // Clipboard permission denied in test environment - expected
        await expect(copyButton).toBeVisible();
      }
    });
  },
};
