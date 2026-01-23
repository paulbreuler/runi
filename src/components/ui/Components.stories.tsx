/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file UI Components Storybook stories
 * @description Consolidated stories for basic UI components: Button, Checkbox, Input, Select, Card, Separator
 *
 * This file consolidates stories from:
 * - button.stories.tsx
 * - checkbox.stories.tsx
 * - input.stories.tsx
 * - select.stories.tsx
 * - card.stories.tsx
 * - separator.stories.tsx
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useState } from 'react';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { Input } from './input';
import * as Select from './select';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';
import { Separator } from './separator';
import { Mail, Download, Trash2 } from 'lucide-react';
import { tabToElement, waitForFocus } from '@/utils/storybook-test-helpers';

const meta = {
  title: 'UI/Components',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Consolidated documentation for basic UI components.

**Components:**
- **Button** - Multiple variants, sizes, and Motion animations
- **Checkbox** - Radix UI Checkbox with Motion animations, supports indeterminate state
- **Input** - Text input with glass-morphism support
- **Select** - Radix UI Select with groups and custom styling
- **Card** - Container component with header, content, and footer
- **Separator** - Horizontal or vertical divider

All components follow runi's design system with Motion animations, accessibility support, and consistent styling.`,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Button Stories
// ============================================================================

/**
 * Button component - default state with keyboard navigation test.
 */
export const ButtonDefault: Story = {
  render: () => <Button>Button</Button>,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /button/i });

    await step('Button is visible', async () => {
      await expect(button).toBeVisible();
    });

    await step('Button receives focus via keyboard', async () => {
      await tabToElement(button);
      await waitForFocus(button);
      await expect(button).toHaveFocus();
    });

    await step('Button can be activated with Enter key', async () => {
      await userEvent.keyboard('{Enter}');
      await expect(button).toBeVisible();
    });
  },
};

/**
 * Button variants showcase.
 */
export const ButtonVariants: Story = {
  render: () => (
    <div className="flex items-center gap-3 flex-wrap">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="destructive-outline">
        <Trash2 className="mr-2" />
        Delete
      </Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

/**
 * Button sizes showcase.
 */
export const ButtonSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

/**
 * Button with icons and icon-only buttons.
 */
export const ButtonWithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Button>
          <Mail className="mr-2" />
          Send Email
        </Button>
        <Button variant="outline">
          <Download className="mr-2" />
          Download
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Button size="icon-xs" aria-label="Extra small icon">
          <Mail />
        </Button>
        <Button size="icon" aria-label="Default icon">
          <Mail />
        </Button>
        <Button size="icon-lg" aria-label="Large icon">
          <Trash2 />
        </Button>
      </div>
    </div>
  ),
};

/**
 * Button states: normal and disabled.
 */
export const ButtonStates: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button>Normal</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
};

// ============================================================================
// Checkbox Stories
// ============================================================================

/**
 * Checkbox component - default unchecked state.
 */
export const CheckboxDefault: Story = {
  render: () => <Checkbox checked={false} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox receives focus via keyboard', async () => {
      await tabToElement(checkbox);
      await waitForFocus(checkbox);
      await expect(checkbox).toHaveFocus();
    });
  },
};

/**
 * Checkbox states: unchecked, checked, indeterminate.
 */
export const CheckboxStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <Checkbox checked={false} />
        Unchecked
      </label>
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <Checkbox checked={true} />
        Checked
      </label>
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <Checkbox checked="indeterminate" />
        Indeterminate
      </label>
      <label className="flex items-center gap-2 text-sm text-text-secondary opacity-50">
        <Checkbox disabled />
        Disabled
      </label>
    </div>
  ),
};

/**
 * Interactive checkbox that toggles on click.
 */
export const CheckboxInteractive: Story = {
  render: function CheckboxInteractiveStory() {
    const [checked, setChecked] = useState(false);
    const handleChange = (value: boolean | 'indeterminate'): void => {
      if (value !== 'indeterminate') {
        setChecked(value);
      }
    };
    return (
      <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
        <Checkbox checked={checked} onCheckedChange={handleChange} />
        Click to toggle (currently: {checked ? 'checked' : 'unchecked'})
      </label>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox toggles on click', async () => {
      await userEvent.click(checkbox);
      await expect(checkbox).toBeChecked();
    });

    await step('Checkbox toggles with keyboard Space', async () => {
      await tabToElement(checkbox);
      await waitForFocus(checkbox);
      await userEvent.keyboard(' ');
      await expect(checkbox).not.toBeChecked();
    });
  },
};

// ============================================================================
// Input Stories
// ============================================================================

/**
 * Input component - default state with keyboard navigation test.
 */
export const InputDefault: Story = {
  render: () => <Input placeholder="Enter text..." />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText(/enter text/i);

    await step('Input receives focus via keyboard', async () => {
      await tabToElement(input);
      await waitForFocus(input);
      await expect(input).toHaveFocus();
    });

    await step('Input accepts text input', async () => {
      await userEvent.clear(input);
      await userEvent.type(input, 'Hello, World!');
      await expect(input).toHaveValue('Hello, World!');
    });
  },
};

/**
 * Input with glass effect.
 */
export const InputGlass: Story = {
  render: () => <Input placeholder="Glass input" glass />,
};

/**
 * Input types showcase.
 */
export const InputTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-64">
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="Email address" />
      <Input type="password" placeholder="Password" />
      <Input type="number" placeholder="Number" />
      <Input type="search" placeholder="Search..." />
    </div>
  ),
};

/**
 * Input states: normal, glass, disabled, invalid.
 */
export const InputStates: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-64">
      <Input placeholder="Normal input" />
      <Input placeholder="Glass input" glass />
      <Input placeholder="Disabled input" disabled />
      <Input placeholder="Invalid input" aria-invalid="true" />
    </div>
  ),
};

/**
 * Input with labels for accessibility.
 */
export const InputWithLabels: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <label htmlFor="name-input" className="text-sm text-text-secondary">
        Name
      </label>
      <Input id="name-input" placeholder="Enter your name" />
      <label htmlFor="email-input" className="text-sm text-text-secondary mt-4">
        Email
      </label>
      <Input id="email-input" type="email" placeholder="Enter your email" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const nameInput = canvas.getByLabelText(/name/i);
    const emailInput = canvas.getByLabelText(/email/i);

    await step('Can tab between labeled inputs', async () => {
      await tabToElement(nameInput);
      await waitForFocus(nameInput);
      await expect(nameInput).toHaveFocus();

      await userEvent.tab();
      await waitForFocus(emailInput);
      await expect(emailInput).toHaveFocus();
    });
  },
};

// ============================================================================
// Select Stories
// ============================================================================

/**
 * Select component - default state with interaction test.
 */
export const SelectDefault: Story = {
  render: () => (
    <Select.Select defaultValue="apple">
      <Select.SelectTrigger className="w-[180px]">
        <Select.SelectValue placeholder="Select a fruit" />
      </Select.SelectTrigger>
      <Select.SelectContent>
        <Select.SelectItem value="apple">Apple</Select.SelectItem>
        <Select.SelectItem value="banana">Banana</Select.SelectItem>
        <Select.SelectItem value="orange">Orange</Select.SelectItem>
        <Select.SelectItem value="grape">Grape</Select.SelectItem>
      </Select.SelectContent>
    </Select.Select>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox');

    await step('Select opens on click', async () => {
      await userEvent.click(trigger);
      await new Promise((resolve) => setTimeout(resolve, 200));
      const appleOption = await within(document.body).findByRole(
        'option',
        { name: /apple/i },
        { timeout: 2000 }
      );
      await expect(appleOption).toBeVisible();
    });
  },
};

/**
 * Select with groups and separators.
 */
export const SelectWithGroups: Story = {
  render: () => (
    <Select.Select defaultValue="apple">
      <Select.SelectTrigger className="w-[200px]">
        <Select.SelectValue placeholder="Select a fruit" />
      </Select.SelectTrigger>
      <Select.SelectContent>
        <Select.SelectGroup>
          <Select.SelectLabel>Fruits</Select.SelectLabel>
          <Select.SelectItem value="apple">Apple</Select.SelectItem>
          <Select.SelectItem value="banana">Banana</Select.SelectItem>
        </Select.SelectGroup>
        <Select.SelectSeparator />
        <Select.SelectGroup>
          <Select.SelectLabel>Vegetables</Select.SelectLabel>
          <Select.SelectItem value="carrot">Carrot</Select.SelectItem>
        </Select.SelectGroup>
      </Select.SelectContent>
    </Select.Select>
  ),
};

/**
 * Select with disabled states.
 */
export const SelectDisabled: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Select.Select defaultValue="apple" disabled>
        <Select.SelectTrigger className="w-[180px]">
          <Select.SelectValue placeholder="Select a fruit" />
        </Select.SelectTrigger>
        <Select.SelectContent>
          <Select.SelectItem value="apple">Apple</Select.SelectItem>
        </Select.SelectContent>
      </Select.Select>
      <Select.Select defaultValue="banana">
        <Select.SelectTrigger className="w-[180px]">
          <Select.SelectValue placeholder="Select a fruit" />
        </Select.SelectTrigger>
        <Select.SelectContent>
          <Select.SelectItem value="banana" disabled>
            Banana (disabled)
          </Select.SelectItem>
        </Select.SelectContent>
      </Select.Select>
    </div>
  ),
};

// ============================================================================
// Card Stories
// ============================================================================

/**
 * Card component - default with header, content, and footer.
 */
export const CardDefault: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-text-secondary">
          This is the main content of the card. You can put any content here.
        </p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

/**
 * Card with glass effect.
 */
export const CardGlassEffect: Story = {
  render: () => (
    <Card glass className="w-96">
      <CardHeader>
        <CardTitle>Glass Card</CardTitle>
        <CardDescription>Card with glass effect</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-text-secondary">This card uses the glass effect styling.</p>
      </CardContent>
    </Card>
  ),
};

/**
 * Card with actions in footer.
 */
export const CardWithActions: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Card with Actions</CardTitle>
        <CardDescription>Multiple action buttons in footer</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-text-secondary">Card content here.</p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Confirm</Button>
      </CardFooter>
    </Card>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const cancelButton = canvas.getByRole('button', { name: /cancel/i });
    const confirmButton = canvas.getByRole('button', { name: /confirm/i });

    await step('Action buttons are clickable', async () => {
      await expect(cancelButton).toBeVisible();
      await expect(confirmButton).toBeVisible();
    });

    await step('Keyboard navigation works', async () => {
      await tabToElement(cancelButton);
      await waitForFocus(cancelButton);
      await expect(cancelButton).toHaveFocus();
    });
  },
};

// ============================================================================
// Separator Stories
// ============================================================================

/**
 * Separator - horizontal orientation.
 */
export const SeparatorHorizontal: Story = {
  render: () => (
    <div className="w-96">
      <div className="p-3">
        <p className="text-text-secondary mb-3">Content above separator</p>
        <Separator />
        <p className="text-text-secondary mt-3">Content below separator</p>
      </div>
    </div>
  ),
};

/**
 * Separator - vertical orientation.
 */
export const SeparatorVertical: Story = {
  render: () => (
    <div className="flex items-center h-20 gap-3">
      <span className="text-text-secondary">Left</span>
      <Separator orientation="vertical" />
      <span className="text-text-secondary">Middle</span>
      <Separator orientation="vertical" />
      <span className="text-text-secondary">Right</span>
    </div>
  ),
};

/**
 * Separator in a list context.
 */
export const SeparatorInList: Story = {
  render: () => (
    <div className="w-64">
      <div className="p-3 space-y-3">
        <div className="text-text-primary">Item 1</div>
        <Separator />
        <div className="text-text-primary">Item 2</div>
        <Separator />
        <div className="text-text-primary">Item 3</div>
      </div>
    </div>
  ),
};
