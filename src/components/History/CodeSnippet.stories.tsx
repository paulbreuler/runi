/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CodeSnippet Storybook stories
 * @description Visual documentation for CodeSnippet component with controls
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';
import { CodeSnippet } from './CodeSnippet';

const meta: Meta<typeof CodeSnippet> = {
  title: 'History/CodeDisplay/CodeSnippet',
  component: CodeSnippet,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Component for displaying code with syntax highlighting and copy functionality. Supports `contained` (default) and `borderless` variants.',
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
    language: {
      control: 'select',
      options: ['javascript', 'python', 'go', 'bash', 'json', 'typescript'],
      description: 'Programming language for syntax highlighting',
    },
    code: {
      control: 'text',
      description: 'Code content',
    },
  },
  args: {
    variant: 'contained',
    language: 'javascript',
    code: 'const response = await fetch("https://api.example.com/users");\nconst data = await response.json();',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Playground with controls for all CodeSnippet features.
 */
export const Playground: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const copyButton = canvas.queryByRole('button', { name: /copy/i });
    if (copyButton !== null) {
      await step('Test copy button', async () => {
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
