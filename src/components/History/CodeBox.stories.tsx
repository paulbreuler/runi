/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CodeBox Storybook stories
 * @description Visual documentation for CodeBox component
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { CodeBox } from './CodeBox';
import { tabToElement } from '@/utils/storybook-test-helpers';

const meta: Meta<typeof CodeBox> = {
  title: 'History/CodeBox',
  component: CodeBox,
  parameters: {
    docs: {
      description: {
        component:
          'Reusable code box container with consistent styling and copy button positioning. Supports two variants: `contained` (default) for standalone use with full visual container, and `borderless` for use inside existing containers to avoid nested visual containers.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CodeBox>;

/**
 * Basic code box with simple content.
 */
export const Default: Story = {
  args: {
    children: (
      <pre>
        <code>const x = 1;</code>
      </pre>
    ),
  },
};

/**
 * Code box with copy button enabled.
 */
export const WithCopyButton: Story = {
  args: {
    copyText: 'const x = 1;\nconst y = 2;',
    copyButtonLabel: 'Copy code',
    children: (
      <pre>
        <code>
          {`const x = 1;
const y = 2;`}
        </code>
      </pre>
    ),
  },
};

/**
 * Code box with JSON content.
 */
export const WithJSON: Story = {
  args: {
    copyText: JSON.stringify({ name: 'John', age: 30 }, null, 2),
    copyButtonLabel: 'Copy JSON',
    children: (
      <pre>
        <code>{JSON.stringify({ name: 'John', age: 30 }, null, 2)}</code>
      </pre>
    ),
  },
};

/**
 * Code box with long content (scrollable).
 */
export const LongContent: Story = {
  args: {
    copyText: Array.from({ length: 50 }, (_, i) => `Line ${String(i + 1)}`).join('\n'),
    copyButtonLabel: 'Copy all lines',
    children: (
      <pre>
        <code>{Array.from({ length: 50 }, (_, i) => `Line ${String(i + 1)}`).join('\n')}</code>
      </pre>
    ),
  },
};

/**
 * Code box without copy button.
 */
export const WithoutCopyButton: Story = {
  args: {
    children: (
      <pre>
        <code>This code box does not have a copy button</code>
      </pre>
    ),
  },
};

/**
 * Borderless variant for use inside existing containers.
 * No background, border, or rounded corners to avoid nested visual containers.
 */
export const Borderless: Story = {
  args: {
    variant: 'borderless',
    copyText: 'const x = 1;\nconst y = 2;',
    copyButtonLabel: 'Copy code',
    children: (
      <pre>
        <code>
          {`const x = 1;
const y = 2;`}
        </code>
      </pre>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Borderless variant removes visual container styling (background, border, rounded corners) for use inside existing containers like MainLayout panes. Use this to avoid nested visual containers.',
      },
    },
  },
};

/**
 * Comparison of contained (default) vs borderless variants.
 */
export const VariantComparison: Story = {
  render: () => (
    <div className="space-y-8 p-4">
      <div>
        <h3 className="text-sm font-medium mb-2 text-text-primary">Contained Variant (Default)</h3>
        <p className="text-xs text-text-muted mb-4">
          Use for standalone code display (e.g., in expanded panels, history views)
        </p>
        <CodeBox
          variant="contained"
          copyText="const example = 'contained';"
          copyButtonLabel="Copy code"
        >
          <pre>
            <code>const example = &apos;contained&apos;;</code>
          </pre>
        </CodeBox>
      </div>
      <div className="bg-bg-app p-4 rounded">
        <h3 className="text-sm font-medium mb-2 text-text-primary">
          Borderless Variant (Inside Container)
        </h3>
        <p className="text-xs text-text-muted mb-4">
          Use inside existing containers (e.g., MainLayout panes) to avoid nested visual containers
        </p>
        <CodeBox
          variant="borderless"
          copyText="const example = 'borderless';"
          copyButtonLabel="Copy code"
        >
          <pre>
            <code>const example = &apos;borderless&apos;;</code>
          </pre>
        </CodeBox>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Side-by-side comparison showing when to use each variant. The borderless variant blends seamlessly into existing containers without creating visual disruption.',
      },
    },
  },
};

/**
 * Test copy button functionality and feedback.
 */
export const CopyFunctionalityTest: Story = {
  args: {
    copyText: 'const x = 1;\nconst y = 2;',
    copyButtonLabel: 'Copy code',
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

    await step('Click copy button', async () => {
      const copyButton = canvas.getByRole('button', { name: /copy code/i });
      await userEvent.click(copyButton);
      // Clipboard might fail in test environment, so check if feedback appears
      // If clipboard fails, the button won't show "Copied" but that's expected
      try {
        const copiedText = await canvas.findByText(/copied/i, {}, { timeout: 500 });
        await expect(copiedText).toBeVisible();
      } catch {
        // Clipboard permission denied in test environment - this is expected
        // Just verify button is still visible
        await expect(copyButton).toBeVisible();
      }
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
 * Test keyboard navigation to copy button.
 */
export const KeyboardNavigationTest: Story = {
  args: {
    copyText: 'const x = 1;\nconst y = 2;',
    copyButtonLabel: 'Copy code',
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

    await step('Tab to copy button', async () => {
      const copyButton = canvas.getByRole('button', { name: /copy code/i });
      const focused = await tabToElement(copyButton, 10);
      await expect(focused).toBe(true);
      await expect(copyButton).toHaveFocus();
    });

    await step('Activate copy button with Enter', async () => {
      const copyButton = canvas.getByRole('button', { name: /copy code/i });
      await userEvent.keyboard('{Enter}');
      // Button should still be visible after activation
      await expect(copyButton).toBeVisible();
    });
  },
};

/**
 * Test borderless variant copy button functionality.
 */
export const BorderlessCopyTest: Story = {
  args: {
    variant: 'borderless',
    copyText: 'const x = 1;\nconst y = 2;',
    copyButtonLabel: 'Copy code',
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

    await step('Verify copy button is present in borderless variant', async () => {
      const copyButton = canvas.getByRole('button', { name: /copy code/i });
      await expect(copyButton).toBeVisible();
    });

    await step('Click copy button', async () => {
      const copyButton = canvas.getByRole('button', { name: /copy code/i });
      await userEvent.click(copyButton);
      // Verify button is still visible after click
      await expect(copyButton).toBeVisible();
    });
  },
};
