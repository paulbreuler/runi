/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { fn } from 'storybook/test';
import { FilterBar } from './FilterBar';
import { DEFAULT_HISTORY_FILTERS } from '@/types/history';
import { tabToElement } from '@/utils/storybook-test-helpers';

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

/**
 * Test filter interactions: changing search, method, status, and intelligence filters.
 */
export const FilterInteractionsTest: Story = {
  args: {
    filters: DEFAULT_HISTORY_FILTERS,
    onFilterChange: noop,
    selectedCount: 0,
    onSaveAll: noop,
    onSaveSelection: noop,
    onClearAll: noopAsync,
    isSaveSelectionDisabled: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Change search filter', async () => {
      const searchInput = canvas.getByLabelText(/filter history by url/i);
      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, 'api.example.com');
      // Wait for input value to update
      await new Promise((resolve) => setTimeout(resolve, 100));
      await expect(searchInput).toHaveValue('api.example.com');
    });

    await step('Change method filter', async () => {
      const methodFilter = canvas.getByTestId('method-filter');
      await userEvent.click(methodFilter);
      const postOption = canvas.getByRole('option', { name: /^post$/i });
      await userEvent.click(postOption);
      await expect(methodFilter).toHaveTextContent(/post/i);
    });

    await step('Change status filter', async () => {
      const statusFilter = canvas.getByTestId('status-filter');
      await userEvent.click(statusFilter);
      const statusOption = canvas.getByRole('option', { name: /4xx/i });
      await userEvent.click(statusOption);
      await expect(statusFilter).toHaveTextContent(/4xx/i);
    });

    await step('Change intelligence filter', async () => {
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
    onSaveAll: noop,
    onSaveSelection: noop,
    onClearAll: noopAsync,
    isSaveSelectionDisabled: false,
  },
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

/**
 * Test state management when filters change.
 */
export const StateManagementTest: Story = {
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Compare Selected button appears with 2 selected', async () => {
      const compareButton = canvas.getByTestId('compare-selected-button');
      await expect(compareButton).toBeVisible();
    });

    await step('Interact with filters and verify state updates', async () => {
      const methodFilter = canvas.getByTestId('method-filter');
      await userEvent.click(methodFilter);
      // Wait for select to open (Radix Select uses portals)
      await new Promise((resolve) => setTimeout(resolve, 200));
      // Options are in a Radix portal (document.body)
      const getOption = await within(document.body).findByRole(
        'option',
        { name: /^get$/i },
        { timeout: 2000 }
      );
      await userEvent.click(getOption);
      // Wait for select to close and update
      await new Promise((resolve) => setTimeout(resolve, 200));
      // Verify filter state changed (button text updates)
      await expect(methodFilter).toHaveTextContent(/get/i);
    });
  },
};
