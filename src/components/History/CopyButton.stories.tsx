/**
 * @file CopyButton Storybook stories
 * @description Visual documentation for CopyButton component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { CopyButton } from './CopyButton';

const meta: Meta<typeof CopyButton> = {
  title: 'History/CopyButton',
  component: CopyButton,
  parameters: {
    docs: {
      description: {
        component:
          'Button that copies text to clipboard and shows "✓ Copied" feedback. Uses the Clipboard API and provides visual feedback for 2 seconds by default.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CopyButton>;

/**
 * Default copy button with text to copy.
 */
export const Default: Story = {
  args: {
    text: 'This is the text that will be copied to clipboard',
  },
};

/**
 * Copy button with custom feedback duration.
 */
export const CustomDuration: Story = {
  args: {
    text: 'Custom duration text',
    feedbackDuration: 5000,
  },
};

/**
 * Copy button with long text.
 */
export const LongText: Story = {
  args: {
    text: JSON.stringify(
      {
        name: 'John Doe',
        email: 'john@example.com',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zip: '12345',
        },
        hobbies: ['reading', 'coding', 'hiking'],
      },
      null,
      2
    ),
  },
};
