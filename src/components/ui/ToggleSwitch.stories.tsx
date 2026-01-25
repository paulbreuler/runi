/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file ToggleSwitch Storybook stories
 * @description Consolidated story using Storybook 10 controls
 *
 * ToggleSwitch is an interactive toggle switch component with Motion animations.
 * Pair with Label component for accessibility.
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ToggleSwitch, type ToggleSwitchProps } from './ToggleSwitch';
import { Label } from './Label';
import { tabToElement } from '@/utils/storybook-test-helpers';

const meta = {
  title: 'UI/ToggleSwitch',
  component: ToggleSwitch,
  parameters: {
    layout: 'padded',
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        component: `Toggle switch component based on Radix UI Switch primitive.

**Features:**
- Built on Radix UI Switch for accessibility and keyboard navigation
- Motion animations for smooth toggle transitions
- Keyboard accessible (Tab, Space, Enter)
- Prevents event propagation (stopPropagation)
- Pair with Label component for accessibility

Use the Controls panel to explore different toggle states.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether toggle is checked',
    },
    onCheckedChange: {
      action: 'onCheckedChange',
      description: 'Callback when toggle changes',
    },
  },
  args: {
    checked: false,
    onCheckedChange: (_checked: boolean): void => {
      // Storybook action handler
    },
  },
} satisfies Meta<ToggleSwitchProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Playground with controls for all ToggleSwitch features.
 * Shows ToggleSwitch paired with Label component.
 * Interactive - click the label or switch to toggle.
 */
export const Playground: Story = {
  render: function PlaygroundStory(args) {
    const [checked, setChecked] = useState(args.checked);
    const toggleId = 'toggle-switch-playground';

    const handleChange = (value: boolean): void => {
      setChecked(value);
      args.onCheckedChange(value);
    };

    return (
      <div className="flex items-center gap-2">
        <Label
          htmlFor={toggleId}
          onClick={(e): void => {
            e.stopPropagation();
            handleChange(!checked);
          }}
        >
          Enable feature
        </Label>
        <ToggleSwitch {...args} id={toggleId} checked={checked} onCheckedChange={handleChange} />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify ToggleSwitch renders', async () => {
      const toggle = await canvas.findByTestId('toggle-switch', {}, { timeout: 3000 });
      await expect(toggle).toBeInTheDocument();
    });

    await step('Verify Label is associated with toggle', async () => {
      const label = await canvas.findByText('Enable feature', {}, { timeout: 3000 });
      await expect(label).toBeInTheDocument();
      await expect(label).toHaveAttribute('for', 'toggle-switch-playground');
    });

    await step('Toggle works on click', async () => {
      const toggle = canvas.getByTestId('toggle-switch');
      await userEvent.click(toggle);
      await expect(toggle).toHaveAttribute('data-state', 'checked');
    });

    await step('Toggle works on label click', async () => {
      const label = canvas.getByText('Enable feature');
      const toggle = canvas.getByTestId('toggle-switch');
      await userEvent.click(label);
      await expect(toggle).toHaveAttribute('data-state', 'unchecked');
    });

    await step('Verify toggle is keyboard accessible', async () => {
      const toggle = canvas.getByTestId('toggle-switch');
      const focused = await tabToElement(toggle, 5);
      await expect(focused).toBe(true);
      await expect(toggle).toHaveFocus();
      await userEvent.keyboard(' ');
      await expect(toggle).toHaveAttribute('data-state', 'checked');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground for ToggleSwitch paired with Label. Click the label or switch to toggle. Use the Controls panel to configure the initial checked state. The component uses CSS transitions for smooth animations and is fully keyboard accessible.',
      },
    },
  },
};
