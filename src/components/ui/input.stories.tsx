/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Input } from './input';
import { tabToElement, waitForFocus } from '@/utils/storybook-test-helpers';

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Text input component with glass-morphism support and smooth animations.

## Features

- **Glass-morphism**: Optional Apple 2025 aesthetic with backdrop blur
- **Motion Animations**: Smooth spring-based focus animations
- **Accessible**: Supports all standard HTML input attributes including \`id\`, \`aria-invalid\`, \`aria-describedby\`

## Accessibility

- **Label Association**: Always associate labels with inputs using \`htmlFor\`/\`id\`
- **Error States**: Use \`aria-invalid="true"\` and \`aria-describedby\` for error messages
- **Keyboard Navigation**: Full keyboard support (native HTML input)
- **Focus Indicators**: Visible focus rings (2px) with accent colors

## Usage

\`\`\`tsx
<label htmlFor="email-input">Email</label>
<Input id="email-input" type="email" placeholder="Enter your email" />
\`\`\`

## Error State

\`\`\`tsx
<label htmlFor="email-input">Email</label>
<Input
  id="email-input"
  type="email"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<span id="email-error" role="alert">Invalid email address</span>
\`\`\`

See the Accessibility panel below for automated checks.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'url'],
    },
    disabled: {
      control: 'boolean',
    },
    placeholder: {
      control: 'text',
    },
    glass: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText(/enter text/i);

    await step('Input is visible and focusable', async () => {
      await expect(input).toBeVisible();
      await expect(input).not.toBeDisabled();
    });

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

export const Glass: Story = {
  args: {
    placeholder: 'Glass input',
    glass: true,
  },
};

export const Types: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-64">
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="Email address" />
      <Input type="password" placeholder="Password" />
      <Input type="number" placeholder="Number" />
      <Input type="search" placeholder="Search..." />
      <Input type="url" placeholder="https://example.com" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-64">
      <Input placeholder="Normal input" />
      <Input placeholder="Glass input" glass />
      <Input placeholder="Disabled input" disabled />
      <Input defaultValue="With value" />
      <Input placeholder="Invalid input" aria-invalid="true" />
    </div>
  ),
};

export const WithLabels: Story = {
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

    await step('Labeled inputs are accessible via labels', async () => {
      await expect(nameInput).toBeVisible();
      await expect(emailInput).toBeVisible();
    });

    await step('Can tab between labeled inputs', async () => {
      await tabToElement(nameInput);
      await waitForFocus(nameInput);
      await expect(nameInput).toHaveFocus();

      await userEvent.tab();
      await waitForFocus(emailInput);
      await expect(emailInput).toHaveFocus();
    });

    await step('Can type into labeled inputs', async () => {
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'John Doe');
      await expect(nameInput).toHaveValue('John Doe');

      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'john@example.com');
      await expect(emailInput).toHaveValue('john@example.com');
    });
  },
};
