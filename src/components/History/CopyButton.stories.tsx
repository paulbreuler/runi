/**
 * @file CopyButton Storybook stories
 * @description Visual documentation for CopyButton component
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from '@storybook/test';
import { CopyButton } from './CopyButton';
import { tabToElement } from '@/utils/storybook-test-helpers';

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

/**
 * Test copy functionality and feedback.
 */
export const CopyFunctionalityTest: Story = {
  args: {
    text: 'Test text to copy',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click copy button', async () => {
      const copyButton = canvas.getByRole('button', { name: /copy to clipboard/i });
      await userEvent.click(copyButton);
      // Verify feedback appears
      const copiedText = canvas.getByText(/copied/i);
      await expect(copiedText).toBeVisible();
    });

    await step('Verify feedback resets after duration', async () => {
      // Wait for feedback duration (2000ms default)
      await new Promise((resolve) => {
        setTimeout(resolve, 2100);
      });
      // Verify button shows "Copy" again
      const copyText = canvas.getByText(/^copy$/i);
      await expect(copyText).toBeVisible();
    });
  },
};

/**
 * Test keyboard navigation.
 */
export const KeyboardNavigationTest: Story = {
  args: {
    text: 'Test text to copy',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab to copy button', async () => {
      const copyButton = canvas.getByRole('button', { name: /copy to clipboard/i });
      const focused = await tabToElement(copyButton, 10);
      await expect(focused).toBe(true);
      await expect(copyButton).toHaveFocus();
    });
  },
};
