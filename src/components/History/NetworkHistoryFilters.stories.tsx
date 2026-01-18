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

/**
 * Compare mode with 2 entries selected (shows Compare Responses button).
 */
export const ReadyToCompare: Story = {
  args: {
    filters: DEFAULT_HISTORY_FILTERS,
    onFilterChange: noop,
    compareMode: true,
    onCompareModeToggle: noop,
    compareSelectionCount: 2,
    onCompareResponses: noop,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded">
      <NetworkHistoryFilters {...args} />
    </div>
  ),
};

/**
 * Full variant (default) - all filters with full labels.
 */
export const VariantFull: Story = {
  args: {
    variant: 'full',
    filters: { ...DEFAULT_HISTORY_FILTERS, method: 'POST', status: '2xx' },
    onFilterChange: noop,
    compareMode: false,
    onCompareModeToggle: noop,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded p-2" style={{ width: 900 }}>
      <NetworkHistoryFilters {...args} />
    </div>
  ),
};

/**
 * Compact variant - filters with shorter labels for medium-width panels.
 */
export const VariantCompact: Story = {
  args: {
    variant: 'compact',
    filters: { ...DEFAULT_HISTORY_FILTERS, method: 'POST', status: '2xx' },
    onFilterChange: noop,
    compareMode: false,
    onCompareModeToggle: noop,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded p-2" style={{ width: 700 }}>
      <NetworkHistoryFilters {...args} />
    </div>
  ),
};

/**
 * Icon variant - icon-only filters for narrow panels.
 */
export const VariantIcon: Story = {
  args: {
    variant: 'icon',
    filters: { ...DEFAULT_HISTORY_FILTERS, method: 'POST', status: '2xx' },
    onFilterChange: noop,
    compareMode: false,
    onCompareModeToggle: noop,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded p-2" style={{ width: 400 }}>
      <NetworkHistoryFilters {...args} />
    </div>
  ),
};

/**
 * Icon variant with compare mode and 1 entry selected.
 */
export const VariantIconWithSelection: Story = {
  args: {
    variant: 'icon',
    filters: DEFAULT_HISTORY_FILTERS,
    onFilterChange: noop,
    compareMode: true,
    onCompareModeToggle: noop,
    compareSelectionCount: 1,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded p-2" style={{ width: 400 }}>
      <NetworkHistoryFilters {...args} />
    </div>
  ),
};

/**
 * Icon variant ready to compare (2 entries selected).
 */
export const VariantIconReadyToCompare: Story = {
  args: {
    variant: 'icon',
    filters: DEFAULT_HISTORY_FILTERS,
    onFilterChange: noop,
    compareMode: true,
    onCompareModeToggle: noop,
    compareSelectionCount: 2,
    onCompareResponses: noop,
  },
  render: (args) => (
    <div className="bg-bg-surface border border-border-subtle rounded p-2" style={{ width: 400 }}>
      <NetworkHistoryFilters {...args} />
    </div>
  ),
};

/**
 * All three variants side by side for comparison.
 */
export const AllVariants: Story = {
  args: {
    filters: { ...DEFAULT_HISTORY_FILTERS, method: 'GET', status: '2xx' },
    onFilterChange: noop,
    compareMode: true,
    onCompareModeToggle: noop,
    compareSelectionCount: 1,
  },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs text-text-muted mb-2">Full variant (width: 900px)</p>
        <div
          className="bg-bg-surface border border-border-subtle rounded p-2"
          style={{ width: 900 }}
        >
          <NetworkHistoryFilters {...args} variant="full" />
        </div>
      </div>
      <div>
        <p className="text-xs text-text-muted mb-2">Compact variant (width: 700px)</p>
        <div
          className="bg-bg-surface border border-border-subtle rounded p-2"
          style={{ width: 700 }}
        >
          <NetworkHistoryFilters {...args} variant="compact" />
        </div>
      </div>
      <div>
        <p className="text-xs text-text-muted mb-2">Icon variant (width: 400px)</p>
        <div
          className="bg-bg-surface border border-border-subtle rounded p-2"
          style={{ width: 400 }}
        >
          <NetworkHistoryFilters {...args} variant="icon" />
        </div>
      </div>
    </div>
  ),
};
