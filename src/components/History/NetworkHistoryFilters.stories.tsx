/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { fn } from 'storybook/test';
import { NetworkHistoryFilters } from './NetworkHistoryFilters';
import { DEFAULT_HISTORY_FILTERS } from '@/types/history';
import { ActionBar } from '@/components/ActionBar';
import { tabToElement } from '@/utils/storybook-test-helpers';

const meta = {
  title: 'History/NetworkHistoryFilters',
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
- **Compare Selected**: Button appears when exactly 2 entries are selected
- **Responsive**: Inherits variant from ActionBar context

## Usage

NetworkHistoryFilters should be used inside an ActionBar to get automatic responsive behavior:

\`\`\`tsx
<ActionBar>
  <NetworkHistoryFilters
    filters={filters}
    onFilterChange={handleFilterChange}
    selectedCount={0}
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
    selectedCount: 0,
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
    selectedCount: 0,
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
    selectedCount: 0,
  },
  render: (args) => (
    <ActionBar aria-label="Network history filters">
      <NetworkHistoryFilters {...args} />
    </ActionBar>
  ),
};

/**
 * With 1 entry selected (Compare Selected button hidden).
 */
export const OneSelected: Story = {
  args: {
    filters: DEFAULT_HISTORY_FILTERS,
    onFilterChange: noop,
    selectedCount: 1,
  },
  render: (args) => (
    <ActionBar aria-label="Network history filters">
      <NetworkHistoryFilters {...args} />
    </ActionBar>
  ),
};

/**
 * With 2 entries selected (shows Compare Selected button).
 */
export const ReadyToCompare: Story = {
  args: {
    filters: DEFAULT_HISTORY_FILTERS,
    onFilterChange: noop,
    selectedCount: 2,
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
    selectedCount: 2,
    onCompareResponses: noop,
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

/**
 * Test filter interactions: changing search, method, status, and intelligence filters.
 */
export const FilterInteractionsTest: Story = {
  args: {
    filters: DEFAULT_HISTORY_FILTERS,
    onFilterChange: noop,
    selectedCount: 0,
  },
  render: (args) => (
    <ActionBar aria-label="Network history filters">
      <NetworkHistoryFilters {...args} />
    </ActionBar>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Change search filter', async () => {
      const searchInput = canvas.getByLabelText(/filter history by url/i);
      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, 'users');
      // Wait for input value to update
      await new Promise((resolve) => setTimeout(resolve, 100));
      await expect(searchInput).toHaveValue('users');
    });

    await step('Change method filter to POST', async () => {
      const methodFilter = canvas.getByTestId('method-filter');
      await userEvent.click(methodFilter);
      // Wait for select to open
      await new Promise((resolve) => setTimeout(resolve, 100));
      const postOption = await canvas.findByRole('option', { name: /^post$/i }, { timeout: 2000 });
      await userEvent.click(postOption);
      // Wait for select to close and update
      await new Promise((resolve) => setTimeout(resolve, 100));
      await expect(methodFilter).toHaveTextContent(/post/i);
    });

    await step('Change status filter to 4xx', async () => {
      const statusFilter = canvas.getByTestId('status-filter');
      await userEvent.click(statusFilter);
      // Wait for select to open
      await new Promise((resolve) => setTimeout(resolve, 100));
      const statusOption = await canvas.findByRole('option', { name: /4xx/i }, { timeout: 2000 });
      await userEvent.click(statusOption);
      // Wait for select to close
      await new Promise((resolve) => setTimeout(resolve, 100));
      await expect(statusFilter).toHaveTextContent(/4xx/i);
    });

    await step('Change intelligence filter to Has Drift', async () => {
      const intelligenceFilter = canvas.getByTestId('intelligence-filter');
      await userEvent.click(intelligenceFilter);
      const driftOption = canvas.getByRole('option', { name: /has drift/i });
      await userEvent.click(driftOption);
      await expect(intelligenceFilter).toHaveTextContent(/has drift/i);
    });
  },
};

/**
 * Test keyboard navigation through filter controls.
 */
export const KeyboardNavigationTest: Story = {
  args: {
    filters: DEFAULT_HISTORY_FILTERS,
    onFilterChange: noop,
    selectedCount: 0,
  },
  render: (args) => (
    <ActionBar aria-label="Network history filters">
      <NetworkHistoryFilters {...args} />
    </ActionBar>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab to search input', async () => {
      const searchInput = canvas.getByLabelText(/filter history by url/i);
      const focused = await tabToElement(searchInput, 10);
      await expect(focused).toBe(true);
      await expect(searchInput).toHaveFocus();
    });

    await step('Tab to method filter', async () => {
      const methodFilter = canvas.getByTestId('method-filter');
      const focused = await tabToElement(methodFilter, 10);
      await expect(focused).toBe(true);
      await expect(methodFilter).toHaveFocus();
    });

    await step('Tab to status filter', async () => {
      const statusFilter = canvas.getByTestId('status-filter');
      const focused = await tabToElement(statusFilter, 10);
      await expect(focused).toBe(true);
      await expect(statusFilter).toHaveFocus();
    });

    await step('Tab to intelligence filter', async () => {
      const intelligenceFilter = canvas.getByTestId('intelligence-filter');
      const focused = await tabToElement(intelligenceFilter, 10);
      await expect(focused).toBe(true);
      await expect(intelligenceFilter).toHaveFocus();
    });
  },
};
