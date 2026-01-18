import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { NetworkHistoryFilters } from './NetworkHistoryFilters';
import { DEFAULT_HISTORY_FILTERS } from '@/types/history';

const meta = {
  title: 'Components/History/NetworkHistoryFilters',
  component: NetworkHistoryFilters,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NetworkHistoryFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = fn();

/**
 * Default filter bar with all filters at default values.
 */
export const Default: Story = {
  args: {
    filters: DEFAULT_HISTORY_FILTERS,
    onFilterChange: noop,
    compareMode: false,
    onCompareModeToggle: noop,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded">
      <NetworkHistoryFilters {...args} />
    </div>
  ),
};

/**
 * With active search filter.
 */
export const WithSearch: Story = {
  args: {
    filters: { ...DEFAULT_HISTORY_FILTERS, search: 'api.example.com' },
    onFilterChange: noop,
    compareMode: false,
    onCompareModeToggle: noop,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded">
      <NetworkHistoryFilters {...args} />
    </div>
  ),
};

/**
 * With multiple active filters.
 */
export const WithActiveFilters: Story = {
  args: {
    filters: {
      search: 'users',
      method: 'POST',
      status: '4xx',
      intelligence: 'Has Drift',
    },
    onFilterChange: noop,
    compareMode: false,
    onCompareModeToggle: noop,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded">
      <NetworkHistoryFilters {...args} />
    </div>
  ),
};

/**
 * Compare mode active.
 */
export const CompareModeActive: Story = {
  args: {
    filters: DEFAULT_HISTORY_FILTERS,
    onFilterChange: noop,
    compareMode: true,
    onCompareModeToggle: noop,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded">
      <NetworkHistoryFilters {...args} />
    </div>
  ),
};
