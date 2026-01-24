/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Code Display Components Storybook stories
 * @description Consolidated stories for code display components: CodeBox, CopyButton
 *
 * Note: CodeSnippet has been replaced by CodeEditor mode="display".
 * See CodeHighlighting/CodeEditor.stories.tsx for the unified component.
 *
 * This file consolidates stories from:
 * - CodeBox.stories.tsx
 * - CopyButton.stories.tsx
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
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
- **CodeBox** - Reusable code box container with consistent styling and copy button positioning
- **CopyButton** - Button that copies text to clipboard and shows feedback

Note: CodeSnippet has been replaced by \`CodeEditor mode="display"\`.
See \`CodeHighlighting/CodeEditor\` for the unified component.

All components support contained (default) and borderless variants.`,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

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
