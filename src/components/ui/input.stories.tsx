import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';

const meta = {
  title: 'Components/UI/Input',
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
};
