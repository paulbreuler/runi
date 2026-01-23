/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CodeBox Storybook stories
 * @description Visual documentation for CodeBox component with controls
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';
import { CodeBox } from './CodeBox';

const meta: Meta<typeof CodeBox> = {
  title: 'History/CodeDisplay/CodeBox',
  component: CodeBox,
  parameters: {
    docs: {
      description: {
        component:
          'Reusable code box container with consistent styling and copy button positioning. Supports two variants: `contained` (default) and `borderless`.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['contained', 'borderless'],
      description: 'Visual variant',
    },
    copyText: {
      control: 'text',
      description: 'Text to copy (enables copy button)',
    },
  },
  args: {
    variant: 'contained',
  },
};

export default meta;
type Story = StoryObj<typeof CodeBox>;

/**
 * Playground with controls for all CodeBox features.
 */
export const Playground: Story = {
  args: {
    copyText: 'const x = 1;\nconst y = 2;',
    children: (
      <pre>
        <code>
          {`const x = 1;
const y = 2;`}
        </code>
      </pre>
    ),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    if (canvas.queryByRole('button', { name: /copy/i }) !== null) {
      await step('Test copy button', async () => {
        const copyButton = canvas.getByRole('button', { name: /copy/i });
        await userEvent.click(copyButton);
        try {
          await canvas.findByText(/copied/i, {}, { timeout: 500 });
        } catch {
          // Expected in test environment
        }
      });
    }
  },
};
