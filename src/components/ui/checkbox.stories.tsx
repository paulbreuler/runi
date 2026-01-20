import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Checkbox } from './checkbox';

const meta = {
  title: 'Components/UI/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Checkbox component built on Radix UI Checkbox primitive with Motion animations.

## Features

- **States**: Unchecked, checked, and indeterminate
- **Sizes**: Small, default, and large
- **Accessible**: Full keyboard navigation and ARIA support (via Radix)
- **Motion Animations**: Smooth spring-based check/uncheck animations

## Accessibility

- **Keyboard Navigation**: Full support (Tab to focus, Space to toggle)
- **ARIA**: Automatically handled by Radix UI
- **Focus Indicators**: Visible focus rings with accent colors

## Usage

**Basic Checkbox:**
\`\`\`tsx
<Checkbox checked={isChecked} onCheckedChange={setIsChecked} />
\`\`\`

**With Label:**
\`\`\`tsx
<label className="flex items-center gap-2">
  <Checkbox checked={isChecked} onCheckedChange={setIsChecked} />
  <span>Accept terms</span>
</label>
\`\`\`

**Indeterminate (for select all):**
\`\`\`tsx
<Checkbox 
  checked={allSelected ? true : someSelected ? "indeterminate" : false}
  onCheckedChange={handleSelectAll}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'select',
      options: [true, false, 'indeterminate'],
      description: 'The controlled checked state',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Size of the checkbox',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the checkbox is disabled',
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    checked: false,
  },
};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const Indeterminate: Story = {
  args: {
    checked: 'indeterminate',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <Checkbox size="sm" />
        Small
      </label>
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <Checkbox size="default" />
        Default
      </label>
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <Checkbox size="lg" />
        Large
      </label>
    </div>
  ),
};

export const States: Story = {
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
      <label className="flex items-center gap-2 text-sm text-text-secondary opacity-50">
        <Checkbox checked={true} disabled />
        Checked & Disabled
      </label>
    </div>
  ),
};

/**
 * Interactive checkbox that toggles on click.
 * Demonstrates the component's animation when toggling.
 */
export const Interactive: Story = {
  render: function InteractiveCheckbox() {
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
};

/**
 * Demonstrates select all behavior with indeterminate state.
 */
export const SelectAll: Story = {
  render: function SelectAllCheckbox() {
    const [items, setItems] = useState([
      { id: 1, label: 'Item 1', checked: false },
      { id: 2, label: 'Item 2', checked: true },
      { id: 3, label: 'Item 3', checked: false },
    ]);

    const allChecked = items.every((item) => item.checked);
    const someChecked = items.some((item) => item.checked);

    const handleSelectAll = (checked: boolean | 'indeterminate'): void => {
      if (checked === 'indeterminate') {
        return;
      }
      setItems((prev) => prev.map((item) => ({ ...item, checked })));
    };

    const handleItemChange = (id: number, checked: boolean | 'indeterminate'): void => {
      if (checked === 'indeterminate') {
        return;
      }
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, checked } : item)));
    };

    // Compute checked state for select all
    const getSelectAllState = (): boolean | 'indeterminate' => {
      if (allChecked) {
        return true;
      }
      if (someChecked) {
        return 'indeterminate';
      }
      return false;
    };

    return (
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm text-text-secondary font-medium border-b border-border-subtle pb-2">
          <Checkbox
            checked={getSelectAllState()}
            onCheckedChange={handleSelectAll}
            aria-label="Select all items"
          />
          Select All
        </label>
        {items.map((item) => (
          <label key={item.id} className="flex items-center gap-2 text-sm text-text-secondary pl-4">
            <Checkbox
              checked={item.checked}
              onCheckedChange={(checked): void => {
                handleItemChange(item.id, checked);
              }}
            />
            {item.label}
          </label>
        ))}
      </div>
    );
  },
};
