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

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { fn } from 'storybook/test';
import { FilterBar } from './FilterBar';
import { DEFAULT_HISTORY_FILTERS } from '@/types/history';

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
} satisfies Meta<typeof FilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = fn();
const noopAsync = fn().mockResolvedValue(undefined);

/**
 * Playground with controls for all FilterBar features.
 */
export const Playground: Story = {
  render: (args) => {
    const filters = {
      ...DEFAULT_HISTORY_FILTERS,
      method: args.methodFilter === 'all' ? undefined : args.methodFilter,
      status: args.statusFilter === 'all' ? undefined : args.statusFilter,
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
        await userEvent.type(searchInput, 'test');
        await expect(searchInput).toHaveValue('test');
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
