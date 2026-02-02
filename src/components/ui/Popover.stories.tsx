/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Popover Storybook stories
 * @description Playground story with controls for open state and alignment.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within, waitFor } from 'storybook/test';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
  type PopoverContentProps,
} from './Popover';
import { Button } from './button';

const meta = {
  title: 'UI/Popover',
  component: Popover,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Popover component based on Base UI Popover.

**Features:**
- Accessible with keyboard navigation (Escape to close)
- Automatic focus management
- Click outside to close
- Portal + Positioner + Popup structure
- Configurable align and sideOffset

Use the Controls panel to explore open state and alignment.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Whether the popover is initially open',
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end'],
      description: 'Alignment of the popover relative to the trigger',
    },
    sideOffset: {
      control: { type: 'number', min: 0, max: 24 },
      description: 'Distance between the trigger and the popover (px)',
    },
  },
  args: {
    defaultOpen: false,
    align: 'start',
    sideOffset: 8,
  },
} as Meta<typeof Popover & { align?: PopoverContentProps['align']; sideOffset?: number }>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Playground with controls for open state, align, and sideOffset.
 */
export const Playground: Story = {
  render: function PlaygroundStory(args) {
    const { defaultOpen, align, sideOffset } = args as typeof args & {
      align?: 'start' | 'center' | 'end';
      sideOffset?: number;
    };
    return (
      <Popover defaultOpen={defaultOpen}>
        <PopoverTrigger
          render={(props) => (
            <Button {...props} data-test-id="popover-trigger">
              Open popover
            </Button>
          )}
        />
        <PopoverContent align={align} sideOffset={sideOffset} data-test-id="popover-content">
          <div className="space-y-2">
            <p className="text-sm font-medium">Popover title</p>
            <p className="text-xs text-text-secondary">
              This content is rendered in a portal. Use Escape or click outside to close.
            </p>
            <PopoverClose
              render={(props) => (
                <Button {...props} variant="outline" size="sm">
                  Close
                </Button>
              )}
            />
          </div>
        </PopoverContent>
      </Popover>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify trigger renders', async () => {
      const trigger = await canvas.findByTestId('popover-trigger', {}, { timeout: 3000 });
      await expect(trigger).toBeInTheDocument();
    });

    await step('Open popover on click', async () => {
      const trigger = canvas.getByTestId('popover-trigger');
      await userEvent.click(trigger);
      // Popover content renders in a portal (document.body), not inside canvas
      const doc = within(document.body);
      const content = await doc.findByTestId('popover-content', {}, { timeout: 2000 });
      await expect(content).toBeInTheDocument();
      await expect(content).toHaveTextContent('Popover title');
    });

    await step('Close via Close button', async () => {
      const doc = within(document.body);
      const closeBtn = doc.getByRole('button', { name: 'Close' });
      await userEvent.click(closeBtn);
      await waitFor(
        async () => {
          await expect(doc.queryByTestId('popover-content')).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground for Popover. Click the trigger to open; use the Close button or Escape to close. Use Controls to set defaultOpen, align, and sideOffset.',
      },
    },
  },
};
