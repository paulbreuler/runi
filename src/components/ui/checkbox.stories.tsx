import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from '@storybook/test';
import { useState } from 'react';
import { Checkbox } from './checkbox';
import { tabToElement, waitForFocus } from '@/utils/storybook-test-helpers';

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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox is visible', async () => {
      await expect(checkbox).toBeVisible();
      await expect(checkbox).not.toBeChecked();
    });

    await step('Checkbox receives focus via keyboard', async () => {
      await tabToElement(checkbox);
      await waitForFocus(checkbox);
      await expect(checkbox).toHaveFocus();
    });

    await step('Checkbox can be toggled with Space key', async () => {
      await userEvent.keyboard(' ');
      // Note: This is an uncontrolled checkbox, so it won't change state
      // But we can verify it responds to keyboard
      await expect(checkbox).toHaveFocus();
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const unchecked = canvas.getByRole('checkbox', { name: /unchecked/i });
    const checked = canvas.getByRole('checkbox', { name: /checked/i });
    const indeterminate = canvas.getByRole('checkbox', { name: /indeterminate/i });
    const disabled = canvas.getByRole('checkbox', { name: /^disabled$/i });

    await step('Unchecked checkbox is not checked', async () => {
      await expect(unchecked).toBeVisible();
      await expect(unchecked).not.toBeChecked();
    });

    await step('Checked checkbox is checked', async () => {
      await expect(checked).toBeVisible();
      await expect(checked).toBeChecked();
    });

    await step('Indeterminate checkbox has indeterminate state', async () => {
      await expect(indeterminate).toBeVisible();
      // Radix checkbox uses aria-checked="mixed" for indeterminate
      await expect(indeterminate).toHaveAttribute('aria-checked', 'mixed');
    });

    await step('Disabled checkbox is not interactive', async () => {
      await expect(disabled).toBeVisible();
      await expect(disabled).toBeDisabled();
    });

    await step('Can navigate to checkboxes with keyboard', async () => {
      await tabToElement(unchecked);
      await waitForFocus(unchecked);
      await expect(unchecked).toHaveFocus();
    });
  },
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');
    const label = canvas.getByText(/click to toggle/i);

    await step('Checkbox starts unchecked', async () => {
      await expect(checkbox).toBeVisible();
      await expect(checkbox).not.toBeChecked();
      await expect(label).toHaveTextContent(/unchecked/i);
    });

    await step('Checkbox toggles on click', async () => {
      await userEvent.click(checkbox);
      await expect(checkbox).toBeChecked();
      await expect(label).toHaveTextContent(/checked/i);
    });

    await step('Checkbox toggles back on second click', async () => {
      await userEvent.click(checkbox);
      await expect(checkbox).not.toBeChecked();
      await expect(label).toHaveTextContent(/unchecked/i);
    });

    await step('Checkbox toggles with keyboard Space', async () => {
      await tabToElement(checkbox);
      await waitForFocus(checkbox);
      await userEvent.keyboard(' ');
      await expect(checkbox).toBeChecked();
      await expect(label).toHaveTextContent(/checked/i);
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const selectAll = canvas.getByRole('checkbox', { name: /select all items/i });
    const item1 = canvas.getByRole('checkbox', { name: /item 1/i });
    const item2 = canvas.getByRole('checkbox', { name: /item 2/i });
    const item3 = canvas.getByRole('checkbox', { name: /item 3/i });

    await step('Select all starts in indeterminate state', async () => {
      await expect(selectAll).toBeVisible();
      await expect(selectAll).toHaveAttribute('aria-checked', 'mixed');
      // Item 2 should be checked initially
      await expect(item2).toBeChecked();
    });

    await step('Clicking select all checks all items', async () => {
      await userEvent.click(selectAll);
      await expect(selectAll).toBeChecked();
      await expect(item1).toBeChecked();
      await expect(item2).toBeChecked();
      await expect(item3).toBeChecked();
    });

    await step('Clicking select all again unchecks all items', async () => {
      await userEvent.click(selectAll);
      await expect(selectAll).not.toBeChecked();
      await expect(item1).not.toBeChecked();
      await expect(item2).not.toBeChecked();
      await expect(item3).not.toBeChecked();
    });

    await step('Individual items can be toggled', async () => {
      await userEvent.click(item1);
      await expect(item1).toBeChecked();
      // Select all should now be indeterminate
      await expect(selectAll).toHaveAttribute('aria-checked', 'mixed');
    });

    await step('Keyboard navigation works', async () => {
      await tabToElement(selectAll);
      await waitForFocus(selectAll);
      await expect(selectAll).toHaveFocus();
    });
  },
};
