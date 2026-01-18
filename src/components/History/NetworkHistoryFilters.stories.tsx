import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { NetworkHistoryFilters } from './NetworkHistoryFilters';
import { DEFAULT_HISTORY_FILTERS } from '@/types/history';
import { ActionBar } from '@/components/ActionBar';

const meta = {
  title: 'Components/History/NetworkHistoryFilters',
  component: NetworkHistoryFilters,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Filter controls for the Network History Panel.

## Features

- **URL Search**: Filter by URL text
- **Method Filter**: Filter by HTTP method (GET, POST, etc.)
- **Status Filter**: Filter by response status code range
- **Intelligence Filter**: Filter by AI/drift status
- **Compare Mode**: Toggle to select entries for comparison
- **Responsive**: Inherits variant from ActionBar context

## Usage

NetworkHistoryFilters should be used inside an ActionBar to get automatic responsive behavior:

\`\`\`tsx
<ActionBar>
  <NetworkHistoryFilters
    filters={filters}
    onFilterChange={handleFilterChange}
    compareMode={false}
    onCompareModeToggle={handleToggle}
  />
</ActionBar>
\`\`\`
`,
      },
    },
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
    <ActionBar aria-label="Network history filters">
      <NetworkHistoryFilters {...args} />
    </ActionBar>
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
    <ActionBar aria-label="Network history filters">
      <NetworkHistoryFilters {...args} />
    </ActionBar>
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
    <ActionBar aria-label="Network history filters">
      <NetworkHistoryFilters {...args} />
    </ActionBar>
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
    <ActionBar aria-label="Network history filters">
      <NetworkHistoryFilters {...args} />
    </ActionBar>
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
    <ActionBar aria-label="Network history filters">
      <NetworkHistoryFilters {...args} />
    </ActionBar>
  ),
};

/**
 * All three variants side by side for comparison.
 * The variant is determined by the ActionBar container width.
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
        <p className="text-xs text-text-muted mb-2">
          Resize to see responsive variants (full → compact → icon)
        </p>
        <ActionBar aria-label="Network history filters">
          <NetworkHistoryFilters {...args} />
        </ActionBar>
      </div>
    </div>
  ),
};
