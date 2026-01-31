/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Tooltip Storybook stories
 * @description Playground story with controls for delay.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Tooltip, TooltipProvider } from './Tooltip';
import { Button } from './button';

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Tooltip component based on Base UI Tooltip.

**Features:**
- Shows on hover and focus
- Accessible with keyboard navigation
- Requires TooltipProvider in the tree
- Configurable delay via Provider

Use the Controls panel to explore delay.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: 'text',
      description: 'Tooltip content',
    },
    delayDuration: {
      control: { type: 'number', min: 0, max: 1000 },
      description: 'Delay before showing tooltip (ms)',
    },
  },
  args: {
    content: 'Tooltip content',
    delayDuration: 0,
  },
  decorators: [
    (Story, context) => (
      <TooltipProvider delayDuration={context.args.delayDuration ?? 0}>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Playground with controls for content and delay.
 */
export const Playground: Story = {
  args: {
    content: 'Tooltip content',
    children: 'Hover me',
  },
  render: function PlaygroundStory(args) {
    return (
      <Tooltip content={args.content} data-test-id="tooltip-trigger">
        <Button data-test-id="tooltip-trigger">Hover me</Button>
      </Tooltip>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify trigger renders', async () => {
      const trigger = await canvas.findByTestId('tooltip-trigger', {}, { timeout: 3000 });
      await expect(trigger).toBeInTheDocument();
    });

    await step('Show tooltip on hover', async () => {
      const trigger = canvas.getByTestId('tooltip-trigger');
      await userEvent.hover(trigger);
      const content = await canvas.findByTestId('tooltip-content', {}, { timeout: 2000 });
      await expect(content).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground for Tooltip. Hover the button to show the tooltip. Use Controls to set content and delayDuration (0 in Playground for instant show).',
      },
    },
  },
};
