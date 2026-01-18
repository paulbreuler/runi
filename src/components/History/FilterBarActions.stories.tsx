import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { FilterBarActions } from './FilterBarActions';

const meta = {
  title: 'Components/History/FilterBarActions',
  component: FilterBarActions,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Action buttons for the filter bar: Save and Delete.

## Features

- **Composite Save button**: Split button with dropdown for "Save All" option
- **Destructive Delete button**: Uses destructive-outline variant
- **Responsive variants**: Full labels or icon-only mode

## Accessibility

- All buttons have aria-labels for screen readers
- Dropdown uses aria-expanded for state
- Delete button is clearly marked as destructive action
`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['full', 'compact', 'icon'],
    },
  },
} satisfies Meta<typeof FilterBarActions>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = fn();
const noopAsync = fn().mockResolvedValue(undefined);

/**
 * Default full variant with all labels.
 */
export const Default: Story = {
  args: {
    variant: 'full',
    onSaveAll: noop,
    onSaveSelection: noop,
    onClearAll: noopAsync,
    isSaveSelectionDisabled: false,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded p-3">
      <FilterBarActions {...args} />
    </div>
  ),
};

/**
 * Save selection disabled (no entries selected).
 */
export const SaveDisabled: Story = {
  args: {
    variant: 'full',
    onSaveAll: noop,
    onSaveSelection: noop,
    onClearAll: noopAsync,
    isSaveSelectionDisabled: true,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded p-3">
      <FilterBarActions {...args} />
    </div>
  ),
};

/**
 * Compact variant (same as full for actions).
 */
export const Compact: Story = {
  args: {
    variant: 'compact',
    onSaveAll: noop,
    onSaveSelection: noop,
    onClearAll: noopAsync,
    isSaveSelectionDisabled: false,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded p-3">
      <FilterBarActions {...args} />
    </div>
  ),
};

/**
 * Icon-only variant for narrow panels.
 */
export const IconMode: Story = {
  args: {
    variant: 'icon',
    onSaveAll: noop,
    onSaveSelection: noop,
    onClearAll: noopAsync,
    isSaveSelectionDisabled: false,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded p-3">
      <FilterBarActions {...args} />
    </div>
  ),
};

/**
 * All variants side by side for comparison.
 */
export const AllVariants: Story = {
  args: {
    variant: 'full',
    onSaveAll: noop,
    onSaveSelection: noop,
    onClearAll: noopAsync,
    isSaveSelectionDisabled: false,
  },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs text-text-muted mb-2">Full variant</p>
        <div className="bg-bg-surface border border-border-subtle rounded p-3">
          <FilterBarActions {...args} variant="full" />
        </div>
      </div>
      <div>
        <p className="text-xs text-text-muted mb-2">Compact variant</p>
        <div className="bg-bg-surface border border-border-subtle rounded p-3">
          <FilterBarActions {...args} variant="compact" />
        </div>
      </div>
      <div>
        <p className="text-xs text-text-muted mb-2">Icon variant</p>
        <div className="bg-bg-surface border border-border-subtle rounded p-3">
          <FilterBarActions {...args} variant="icon" />
        </div>
      </div>
    </div>
  ),
};
