/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file FilterBar Storybook stories
 * @description Consolidated story using Storybook 10 controls
 *
 * FilterBar includes FilterBarActions - use controls to explore all features.
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { fn } from 'storybook/test';
import { FilterBar, type FilterBarProps } from './FilterBar';
import { NetworkHistoryFilters } from './NetworkHistoryFilters';
import { ActionBar } from '@/components/ActionBar';
import { DEFAULT_HISTORY_FILTERS, type HistoryFilters } from '@/types/history';
import type { HttpMethod } from '@/utils/http-colors';
import { tabToElement } from '@/utils/storybook-test-helpers';

// Custom args for story controls (not part of component props)
interface FilterBarStoryArgs {
  methodFilter?: 'all' | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  statusFilter?: 'all' | '2xx' | '3xx' | '4xx' | '5xx';
}

const meta = {
  title: 'History/FilterBar',
  component: FilterBar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Complete filter bar with filters, compare controls, and action buttons.

**Features:**
- Responsive variants: Automatically adapts to container width
- Horizontal scroll: Scroll when content overflows with gradient cues
- FilterBarActions: Save and delete buttons integrated
- NetworkHistoryFilters: Search, method/status/intelligence filters

Use controls to explore different states and configurations.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    selectedCount: {
      control: 'number',
      min: 0,
      max: 10,
      step: 1,
      description: 'Number of selected entries',
    },
    methodFilter: {
      control: 'select',
      options: ['all', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      description: 'HTTP method filter',
    },
    statusFilter: {
      control: 'select',
      options: ['all', '2xx', '3xx', '4xx', '5xx'],
      description: 'Status code filter',
    },
    isSaveSelectionDisabled: {
      control: 'boolean',
      description: 'Save selection button disabled',
    },
  },
  args: {
    selectedCount: 0,
    methodFilter: 'all',
    statusFilter: 'all',
    isSaveSelectionDisabled: false,
  },
} satisfies Meta<FilterBarProps & FilterBarStoryArgs>;

export default meta;
type Story = StoryObj<FilterBarProps & FilterBarStoryArgs>;

const noop = fn();
const noopAsync = fn().mockResolvedValue(undefined);

/**
 * Playground with controls for all FilterBar features.
 */
export const Playground: Story = {
  render: (args: FilterBarProps & FilterBarStoryArgs) => {
    const methodFilter = args.methodFilter ?? 'all';
    const statusFilter = args.statusFilter ?? 'all';
    const filters: HistoryFilters = {
      ...DEFAULT_HISTORY_FILTERS,
      method: methodFilter === 'all' ? 'ALL' : (methodFilter as HttpMethod),
      status: statusFilter === 'all' ? 'All' : statusFilter,
    };

    return (
      <div className="bg-bg-surface border border-border-subtle rounded" style={{ width: 900 }}>
        <FilterBar
          filters={filters}
          onFilterChange={noop}
          selectedCount={args.selectedCount}
          onCompareResponses={args.selectedCount === 2 ? noop : undefined}
          onSaveAll={noop}
          onSaveSelection={noop}
          onClearAll={noopAsync}
          isSaveSelectionDisabled={args.isSaveSelectionDisabled}
        />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Test filter interaction', async () => {
      const searchInput = canvas.queryByLabelText(/filter history by url/i);
      if (searchInput !== null) {
        // Since this is a controlled component with noop onChange, the value won't update
        // Just verify the input is interactive and can receive focus
        await userEvent.click(searchInput);
        await new Promise((resolve) => setTimeout(resolve, 50));
        await expect(searchInput).toHaveFocus();
        // Type into it to verify it's functional (even though value won't update due to noop)
        await userEvent.type(searchInput, 'test');
        await new Promise((resolve) => setTimeout(resolve, 100));
        // Input should be visible and functional
        await expect(searchInput).toBeVisible();
      }
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground for FilterBar. Use the Controls panel to configure selection count, filters, and button states. FilterBarActions (Save/Delete buttons) are integrated.',
      },
    },
  },
};

/**
 * NetworkHistoryFilters component in isolation (used within FilterBar).
 * Shows filter controls with ActionBar wrapper for responsive behavior.
 */
export const NetworkHistoryFiltersIsolated: Story = {
  render: () => (
    <ActionBar aria-label="Network history filters">
      <NetworkHistoryFilters
        filters={DEFAULT_HISTORY_FILTERS}
        onFilterChange={noop}
        selectedCount={0}
      />
    </ActionBar>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'NetworkHistoryFilters component shown in isolation. This is the component used within FilterBar for filter controls.',
      },
    },
  },
};

/**
 * NetworkHistoryFilters with active filters.
 */
export const NetworkHistoryFiltersWithActiveFilters: Story = {
  render: () => (
    <ActionBar aria-label="Network history filters">
      <NetworkHistoryFilters
        filters={{
          search: 'users',
          method: 'POST',
          status: '4xx',
          intelligence: 'Has Drift',
        }}
        onFilterChange={noop}
        selectedCount={0}
      />
    </ActionBar>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'NetworkHistoryFilters with multiple active filters: search, method, status, and intelligence.',
      },
    },
  },
};

/**
 * NetworkHistoryFilters with 2 entries selected (shows Compare Selected button).
 */
export const NetworkHistoryFiltersReadyToCompare: Story = {
  render: () => (
    <ActionBar aria-label="Network history filters">
      <NetworkHistoryFilters
        filters={DEFAULT_HISTORY_FILTERS}
        onFilterChange={noop}
        selectedCount={2}
        onCompareResponses={noop}
      />
    </ActionBar>
  ),
  parameters: {
    docs: {
      description: {
        story: 'NetworkHistoryFilters with 2 entries selected, showing Compare Selected button.',
      },
    },
  },
};

/**
 * Tests filter interactions: changing search, method, status, and intelligence filters.
 */
export const FilterInteractionsTest: Story = {
  render: () => {
    // Use real state for this test so input values actually update
    const [filters, setFilters] = React.useState(DEFAULT_HISTORY_FILTERS);
    const handleFilterChange = (key: keyof typeof DEFAULT_HISTORY_FILTERS, value: string): void => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    };

    return (
      <div className="bg-bg-surface border border-border-subtle rounded" style={{ width: 900 }}>
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          selectedCount={0}
          onSaveAll={noop}
          onSaveSelection={noop}
          onClearAll={noopAsync}
          isSaveSelectionDisabled={false}
        />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Change search filter', async () => {
      const searchInput = canvas.getByLabelText(/filter history by url/i);
      await userEvent.clear(searchInput);
      await new Promise((resolve) => setTimeout(resolve, 50));
      await userEvent.type(searchInput, 'users');
      await new Promise((resolve) => setTimeout(resolve, 150));
      await expect(searchInput).toHaveValue('users');
    });

    await step('Change method filter to POST', async () => {
      const methodFilter = canvas.getByTestId('method-filter');
      await userEvent.click(methodFilter);
      await new Promise((resolve) => setTimeout(resolve, 200));
      // Radix Select renders options in a portal (document.body), search there
      const postOption = await within(document.body).findByRole(
        'option',
        { name: /^post$/i },
        { timeout: 3000 }
      );
      await userEvent.click(postOption);
      await new Promise((resolve) => setTimeout(resolve, 200));
      await expect(methodFilter).toHaveTextContent(/post/i);
    });

    await step('Change status filter to 4xx', async () => {
      const statusFilter = canvas.getByTestId('status-filter');
      await userEvent.click(statusFilter);
      await new Promise((resolve) => setTimeout(resolve, 200));
      // Radix Select renders options in a portal (document.body), search there
      const statusOption = await within(document.body).findByRole(
        'option',
        { name: /4xx/i },
        { timeout: 3000 }
      );
      await userEvent.click(statusOption);
      await new Promise((resolve) => setTimeout(resolve, 200));
      await expect(statusFilter).toHaveTextContent(/4xx/i);
    });

    await step('Change intelligence filter to Has Drift', async () => {
      const intelligenceFilter = canvas.getByTestId('intelligence-filter');
      await userEvent.click(intelligenceFilter);
      await new Promise((resolve) => setTimeout(resolve, 200));
      // Radix Select renders options in a portal (document.body), search there
      const driftOption = await within(document.body).findByRole(
        'option',
        { name: /has drift/i },
        { timeout: 3000 }
      );
      await userEvent.click(driftOption);
      await new Promise((resolve) => setTimeout(resolve, 200));
      await expect(intelligenceFilter).toHaveTextContent(/has drift/i);
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests filter interactions: changing search, method, status, and intelligence filters through the FilterBar.',
      },
    },
  },
};

/**
 * Tests keyboard navigation through filter controls.
 */
export const KeyboardNavigationTest: Story = {
  render: () => (
    <ActionBar aria-label="Network history filters">
      <NetworkHistoryFilters
        filters={DEFAULT_HISTORY_FILTERS}
        onFilterChange={noop}
        selectedCount={0}
      />
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
  parameters: {
    docs: {
      description: {
        story: 'Tests keyboard navigation through filter controls using Tab key.',
      },
    },
  },
};
