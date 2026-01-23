/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';
import { Button } from './button';
import { tabToElement, waitForFocus } from '@/utils/storybook-test-helpers';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    hover: {
      control: 'boolean',
    },
    glass: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
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

export const WithoutHover: Story = {
  render: () => (
    <Card hover={false} className="w-96">
      <CardHeader>
        <CardTitle>Card Without Hover</CardTitle>
        <CardDescription>This card does not lift on hover</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-text-secondary">Hover over this card to see the difference.</p>
      </CardContent>
    </Card>
  ),
};

export const GlassEffect: Story = {
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

export const Simple: Story = {
  render: () => (
    <Card className="w-96">
      <CardContent className="pt-6">
        <p className="text-text-secondary">Simple card with just content.</p>
      </CardContent>
    </Card>
  ),
};

export const WithActions: Story = {
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
      await userEvent.click(cancelButton);
      await expect(cancelButton).toBeVisible();
    });

    await step('Keyboard navigation works', async () => {
      await tabToElement(cancelButton);
      await waitForFocus(cancelButton);
      await expect(cancelButton).toHaveFocus();
      await userEvent.tab();
      await waitForFocus(confirmButton);
      await expect(confirmButton).toHaveFocus();
    });
  },
};
