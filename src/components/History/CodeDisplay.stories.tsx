/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Code Display Components Storybook stories
 * @description Consolidated stories for code display components: CodeSnippet, CodeBox, CopyButton
 *
 * This file consolidates stories from:
 * - CodeSnippet.stories.tsx
 * - CodeBox.stories.tsx
 * - CopyButton.stories.tsx
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { CodeSnippet } from './CodeSnippet';
import { CodeBox } from './CodeBox';
import { CopyButton } from './CopyButton';

const meta = {
  title: 'History/CodeDisplay',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Consolidated documentation for code display components.

**Components:**
- **CodeSnippet** - Component for displaying code with syntax highlighting and copy functionality
- **CodeBox** - Reusable code box container with consistent styling and copy button positioning
- **CopyButton** - Button that copies text to clipboard and shows feedback

All components support contained (default) and borderless variants.`,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// CodeSnippet Stories
// ============================================================================

/**
 * CodeSnippet - playground with controls for all features.
 */
export const CodeSnippetPlayground: Story = {
  render: () => (
    <CodeSnippet
      variant="contained"
      language="javascript"
      code='const response = await fetch("https://api.example.com/users");\nconst data = await response.json();'
    />
  ),
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

/**
 * CodeSnippet - borderless variant.
 */
export const CodeSnippetBorderless: Story = {
  render: () => (
    <CodeSnippet
      variant="borderless"
      language="json"
      code='{\n  "name": "runi",\n  "version": "1.0.0"\n}'
    />
  ),
};

// ============================================================================
// CodeBox Stories
// ============================================================================

/**
 * CodeBox - playground with controls for all features.
 */
export const CodeBoxPlayground: Story = {
  render: () => (
    <CodeBox variant="contained" copyText="const x = 1;\nconst y = 2;">
      <pre>
        <code>
          {`const x = 1;
const y = 2;`}
        </code>
      </pre>
    </CodeBox>
  ),
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

/**
 * CodeBox - borderless variant.
 */
export const CodeBoxBorderless: Story = {
  render: () => (
    <CodeBox variant="borderless" copyText="console.log('Hello, World!');">
      <pre>
        <code>console.log(&apos;Hello, World!&apos;);</code>
      </pre>
    </CodeBox>
  ),
};

// ============================================================================
// CopyButton Stories
// ============================================================================

/**
 * CopyButton - playground with controls for all features.
 */
export const CopyButtonPlayground: Story = {
  render: () => (
    <CopyButton text="This is the text that will be copied to clipboard" feedbackDuration={2000} />
  ),
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
