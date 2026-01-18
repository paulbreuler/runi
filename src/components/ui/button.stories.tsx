import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { Mail, Download, Trash2, ArrowRight } from 'lucide-react';

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
- **Sizes**: Small, default, large, and icon sizes (icon, icon-sm, icon-lg)
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
      options: ['default', 'sm', 'lg', 'icon', 'icon-sm', 'icon-lg'],
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
        <Button size="icon" aria-label="Send email">
          <Mail />
        </Button>
        <Button size="icon-sm" aria-label="Download">
          <Download />
        </Button>
        <Button size="icon-lg" aria-label="Delete">
          <Trash2 />
        </Button>
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button>Normal</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
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
