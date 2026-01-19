import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { FilterBar } from './FilterBar';
import { DEFAULT_HISTORY_FILTERS } from '@/types/history';

const meta = {
  title: 'Components/History/FilterBar',
  component: FilterBar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Complete filter bar with filters, compare controls, and action buttons.

## Features

- **Responsive variants**: Automatically adapts to container width (full > 800px, compact 600-800px, icon < 600px)
- **Horizontal scroll**: Scroll when content overflows with gradient cues
- **Touch support**: Swipe gestures for mobile

## Components

- **NetworkHistoryFilters**: Search, method/status/intelligence filters, compare selected button
- **FilterBarActions**: Save and delete buttons with composite button pattern

## Accessibility

- All buttons have aria-labels
- Filter dropdowns are keyboard accessible
- Compare Selected button appears when exactly 2 entries are selected
`,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = fn();
const noopAsync = fn().mockResolvedValue(undefined);

/**
 * Default filter bar showing all controls.
 */
export const Default: Story = {
  args: {
    filters: DEFAULT_HISTORY_FILTERS,
    onFilterChange: noop,
    selectedCount: 0,
    onSaveAll: noop,
    onSaveSelection: noop,
    onClearAll: noopAsync,
    isSaveSelectionDisabled: false,
  },
};

/**
 * With save selection disabled (no entries selected).
 */
export const SaveDisabled: Story = {
  args: {
    filters: DEFAULT_HISTORY_FILTERS,
    onFilterChange: noop,
    selectedCount: 0,
    onSaveAll: noop,
    onSaveSelection: noop,
    onClearAll: noopAsync,
    isSaveSelectionDisabled: true,
  },
};

/**
 * With 1 entry selected (Compare Selected button hidden).
 */
export const OneSelected: Story = {
  args: {
    filters: DEFAULT_HISTORY_FILTERS,
    onFilterChange: noop,
    selectedCount: 1,
    onSaveAll: noop,
    onSaveSelection: noop,
    onClearAll: noopAsync,
    isSaveSelectionDisabled: false,
  },
};

/**
 * Ready to compare (2 entries selected, Compare Selected button visible).
 */
export const ReadyToCompare: Story = {
  args: {
    filters: DEFAULT_HISTORY_FILTERS,
    onFilterChange: noop,
    selectedCount: 2,
    onCompareResponses: noop,
    onSaveAll: noop,
    onSaveSelection: noop,
    onClearAll: noopAsync,
    isSaveSelectionDisabled: false,
  },
};

/**
 * All three responsive variants side by side.
 * Resize the container to see automatic variant switching.
 */
export const AllVariants: Story = {
  args: {
    filters: { ...DEFAULT_HISTORY_FILTERS, method: 'GET', status: '2xx' },
    onFilterChange: noop,
    selectedCount: 2,
    onCompareResponses: noop,
    onSaveAll: noop,
    onSaveSelection: noop,
    onClearAll: noopAsync,
    isSaveSelectionDisabled: false,
  },
  render: (args) => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs text-text-muted mb-2">
          Full variant (width: 900px) - all labels visible
        </p>
        <div className="bg-bg-surface border border-border-subtle rounded" style={{ width: 900 }}>
          <FilterBar {...args} />
        </div>
      </div>
      <div>
        <p className="text-xs text-text-muted mb-2">
          Compact variant (width: 700px) - shorter labels
        </p>
        <div className="bg-bg-surface border border-border-subtle rounded" style={{ width: 700 }}>
          <FilterBar {...args} />
        </div>
      </div>
      <div>
        <p className="text-xs text-text-muted mb-2">
          Icon variant (width: 400px) - icon-only with tooltips
        </p>
        <div className="bg-bg-surface border border-border-subtle rounded" style={{ width: 400 }}>
          <FilterBar {...args} />
        </div>
      </div>
    </div>
  ),
};

/**
 * Narrow width showing horizontal scroll behavior.
 */
export const WithOverflow: Story = {
  args: {
    filters: { ...DEFAULT_HISTORY_FILTERS, method: 'POST', status: '4xx' },
    onFilterChange: noop,
    selectedCount: 2,
    onCompareResponses: noop,
    onSaveAll: noop,
    onSaveSelection: noop,
    onClearAll: noopAsync,
    isSaveSelectionDisabled: false,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded" style={{ width: 500 }}>
      <FilterBar {...args} />
    </div>
  ),
};
