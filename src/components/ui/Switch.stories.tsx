/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Switch Storybook stories
 * @description Consolidated story using Storybook 10 controls
 *
 * Switch is an interactive switch component with Motion animations.
 * Pair with Label component for accessibility.
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Switch, type SwitchProps } from './Switch';
import { Label } from './Label';
import { tabToElement } from '@/utils/storybook-test-helpers';

const meta = {
  title: 'UI/Switch',
  component: Switch,
  parameters: {
    layout: 'padded',
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        component: `Switch component based on Radix UI Switch primitive.

**Features:**
- Built on Radix UI Switch for accessibility and keyboard navigation
- Motion animations for smooth toggle transitions
- Keyboard accessible (Tab, Space, Enter)
- Prevents event propagation (stopPropagation)
- Pair with Label component for accessibility

Use the Controls panel to explore different switch states.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether switch is checked',
    },
    onCheckedChange: {
      action: 'onCheckedChange',
      description: 'Callback when switch changes',
    },
  },
  args: {
    checked: false,
    onCheckedChange: (_checked: boolean): void => {
      // Storybook action handler
    },
  },
} satisfies Meta<SwitchProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Playground with controls for all Switch features.
 * Shows Switch paired with Label component.
 * Interactive - click the label or switch to toggle.
 */
export const Playground: Story = {
  render: function PlaygroundStory(args) {
    const [checked, setChecked] = useState(args.checked);
    const switchId = 'switch-playground';

    const handleChange = (value: boolean): void => {
      setChecked(value);
      args.onCheckedChange(value);
    };

    return (
      <div className="flex items-center gap-2">
        <Label
          htmlFor={switchId}
          onClick={(e): void => {
            e.stopPropagation();
            handleChange(!checked);
          }}
        >
          Enable feature
        </Label>
        <Switch {...args} id={switchId} checked={checked} onCheckedChange={handleChange} />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Switch renders', async () => {
      const switchElement = await canvas.findByTestId('switch', {}, { timeout: 3000 });
      await expect(switchElement).toBeInTheDocument();
    });

    await step('Verify Label is associated with switch', async () => {
      const label = await canvas.findByText('Enable feature', {}, { timeout: 3000 });
      await expect(label).toBeInTheDocument();
      await expect(label).toHaveAttribute('for', 'switch-playground');
    });

    await step('Switch works on click', async () => {
      const switchElement = canvas.getByTestId('switch');
      await userEvent.click(switchElement);
      await expect(switchElement).toHaveAttribute('data-state', 'checked');
    });

    await step('Switch works on label click', async () => {
      const label = canvas.getByText('Enable feature');
      const switchElement = canvas.getByTestId('switch');
      await userEvent.click(label);
      await expect(switchElement).toHaveAttribute('data-state', 'unchecked');
    });

    await step('Verify switch is keyboard accessible', async () => {
      const switchElement = canvas.getByTestId('switch');
      const focused = await tabToElement(switchElement, 5);
      await expect(focused).toBe(true);
      await expect(switchElement).toHaveFocus();
      await userEvent.keyboard(' ');
      await expect(switchElement).toHaveAttribute('data-state', 'checked');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground for Switch paired with Label. Click the label or switch to toggle. Use the Controls panel to configure the initial checked state. The component uses CSS transitions for smooth animations and is fully keyboard accessible.',
      },
    },
  },
};
