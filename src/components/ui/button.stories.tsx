import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from '@storybook/test';
import { Button } from './button';
import { Mail, Download, Trash2, ArrowRight } from 'lucide-react';
import { tabToElement, waitForFocus } from '@/utils/storybook-test-helpers';

const meta = {
  title: 'Components/UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Button component with multiple variants, sizes, and Motion animations.

## Features

- **Variants**: Default, destructive, destructive-outline, outline, secondary, ghost, link
- **Sizes**: Extra small, small, default, large, and icon sizes (icon-xs, icon-sm, icon, icon-lg)
- **Motion Animations**: Smooth spring-based hover and tap animations
- **Accessible**: Supports all standard HTML button attributes including \`aria-label\`

## Accessibility

- **Icon-Only Buttons**: Always provide \`aria-label\` for icon-only buttons
- **Keyboard Navigation**: Full keyboard support (Tab, Enter, Space)
- **Focus Indicators**: Visible focus rings (2px) with accent colors
- **Disabled State**: Properly disabled with \`disabled\` attribute

## Usage

**Text Button:**
\`\`\`tsx
<Button variant="default">Click me</Button>
\`\`\`

**Icon-Only Button:**
\`\`\`tsx
<Button size="icon" aria-label="Close dialog">
  <X />
</Button>
\`\`\`

**Button with Icon:**
\`\`\`tsx
<Button>
  <Mail className="mr-2" />
  Send Email
</Button>
\`\`\`

See the Accessibility panel below for automated checks.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'destructive',
        'destructive-outline',
        'outline',
        'secondary',
        'ghost',
        'link',
      ],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'xs', 'lg', 'icon', 'icon-sm', 'icon-xs', 'icon-lg'],
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /button/i });

    await step('Button is visible', async () => {
      await expect(button).toBeVisible();
    });

    await step('Button can be clicked', async () => {
      await userEvent.click(button);
      // Button should still be visible after click
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

    await step('Button can be activated with Space key', async () => {
      await userEvent.keyboard(' ');
      await expect(button).toBeVisible();
    });
  },
};

export const Variants: Story = {
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

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const WithIcons: Story = {
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
        <Button variant="destructive">
          <Trash2 className="mr-2" />
          Delete
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Button size="icon-xs" aria-label="Extra small icon">
          <Mail />
        </Button>
        <Button size="icon-sm" aria-label="Small icon">
          <Download />
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Text buttons with icons are clickable', async () => {
      const sendButton = canvas.getByRole('button', { name: /send email/i });
      const downloadButton = canvas.getByRole('button', { name: /download/i });
      const deleteButton = canvas.getByRole('button', { name: /delete/i });

      await userEvent.click(sendButton);
      await expect(sendButton).toBeVisible();

      await userEvent.click(downloadButton);
      await expect(downloadButton).toBeVisible();

      await userEvent.click(deleteButton);
      await expect(deleteButton).toBeVisible();
    });

    await step('Icon-only buttons are accessible via aria-label', async () => {
      const iconXs = canvas.getByRole('button', { name: /extra small icon/i });
      const iconSm = canvas.getByRole('button', { name: /small icon/i });
      const iconDefault = canvas.getByRole('button', { name: /default icon/i });
      const iconLg = canvas.getByRole('button', { name: /large icon/i });

      await expect(iconXs).toBeVisible();
      await expect(iconSm).toBeVisible();
      await expect(iconDefault).toBeVisible();
      await expect(iconLg).toBeVisible();
    });

    await step('Icon buttons support keyboard navigation', async () => {
      const iconButton = canvas.getByRole('button', { name: /default icon/i });
      await tabToElement(iconButton);
      await waitForFocus(iconButton);
      await expect(iconButton).toHaveFocus();
    });
  },
};

export const States: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button>Normal</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const normalButton = canvas.getByRole('button', { name: /normal/i });
    const disabledButton = canvas.getByRole('button', { name: /disabled/i });

    await step('Normal button is interactive', async () => {
      await expect(normalButton).toBeVisible();
      await expect(normalButton).not.toBeDisabled();
      await userEvent.click(normalButton);
      await expect(normalButton).toBeVisible();
    });

    await step('Disabled button is not interactive', async () => {
      await expect(disabledButton).toBeVisible();
      await expect(disabledButton).toBeDisabled();
      // Disabled button should not respond to clicks
      await userEvent.click(disabledButton);
      await expect(disabledButton).toBeDisabled();
    });

    await step('Keyboard navigation works for normal button', async () => {
      await tabToElement(normalButton);
      await waitForFocus(normalButton);
      await expect(normalButton).toHaveFocus();
    });
  },
};

export const AsChild: Story = {
  render: () => (
    <Button asChild>
      <a href="https://example.com">
        <ArrowRight className="mr-2" />
        Link Button
      </a>
    </Button>
  ),
};
