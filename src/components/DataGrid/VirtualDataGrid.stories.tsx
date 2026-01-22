/**
 * @file VirtualDataGrid Storybook stories
 * @description Visual documentation for the VirtualDataGrid component with TestRow data
 *
 * STORIES:
 * - Default (generic test data)
 * - WithExpansion
 * - LargeDataset
 * - ConditionalPinning
 * - Empty
 * - WithSorting
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, userEvent, within } from '@storybook/test';
import { VirtualDataGrid, type VirtualDataGridProps } from './VirtualDataGrid';
import { createSelectionColumn } from './columns/selectionColumn';
import { createExpanderColumn } from './columns/expanderColumn';
import { cn } from '@/utils/cn';
import type { ColumnDef } from '@tanstack/react-table';
import type { Row } from '@tanstack/react-table';
import { tabToElement } from '@/utils/storybook-test-helpers';

// Simple test data type
interface TestRow {
  id: string;
  name: string;
  status: string;
  value: number;
  description: string;
  metadata?: {
    tags: string[];
    notes: string;
  };
}

// Generate sample data
function generateTestData(count: number): TestRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `row-${String(i + 1)}`,
    name: `Item ${String(i + 1)}`,
    status: (() => {
      const remainder = i % 3;
      if (remainder === 0) {
        return 'active';
      }
      if (remainder === 1) {
        return 'pending';
      }
      return 'inactive';
    })(),
    value: Math.floor(Math.random() * 1000),
    description: `This is a description for item ${String(i + 1)}. It contains some text to demonstrate how the grid handles longer content.`,
    metadata: {
      tags: ['tag1', 'tag2'],
      notes: `Additional notes for item ${String(i + 1)}`,
    },
  }));
}

// Column definitions
const createColumns = (): Array<ColumnDef<TestRow>> => [
  createSelectionColumn<TestRow>(),
  createExpanderColumn<TestRow>(),
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Name',
    size: 150,
    minSize: 100,
    maxSize: 300,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    size: 100,
    minSize: 80,
    maxSize: 150,
    cell: ({ getValue }) => {
      const status = getValue<string>();
      const colorClass = (() => {
        if (status === 'active') {
          return 'text-accent-green';
        }
        if (status === 'pending') {
          return 'text-accent-amber';
        }
        return 'text-text-secondary';
      })();
      return <span className={colorClass}>{status}</span>;
    },
  },
  {
    id: 'value',
    accessorKey: 'value',
    header: 'Value',
    size: 100,
    minSize: 80,
    maxSize: 150,
    cell: ({ getValue }) => {
      const value = getValue<number>();
      return <span className="font-mono">{value.toLocaleString()}</span>;
    },
  },
  {
    id: 'description',
    accessorKey: 'description',
    header: 'Description',
    size: 300,
    minSize: 200,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: () => (
      <div className="flex gap-1">
        <button className="px-2 py-1 text-xs bg-bg-raised hover:bg-bg-elevated rounded">
          Edit
        </button>
        <button className="px-2 py-1 text-xs bg-bg-raised hover:bg-bg-elevated rounded">
          Delete
        </button>
      </div>
    ),
    size: 120,
    minSize: 120,
    maxSize: 120,
    enableResizing: false,
    enableSorting: false,
    enablePinning: true,
  },
];

const meta = {
  title: 'Components/DataGrid/VirtualDataGrid',
  component: VirtualDataGrid,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof VirtualDataGrid>;

export default meta;

type Story = StoryObj<VirtualDataGridProps<TestRow>>;

const noop = fn();

/**
 * Basic grid with a small dataset.
 */
export const Default: Story = {
  args: {
    data: generateTestData(10),
    columns: createColumns(),
    getRowId: (row: TestRow) => row.id,
    height: 400,
    enableRowSelection: true,
    enableExpanding: true,
    getRowCanExpand: () => true,
    initialColumnPinning: { right: ['actions'] },
    onRowSelectionChange: noop,
    onExpandedChange: noop,
  },

  render: (args) => (
    <div className="h-[500px] bg-bg-app">
      <VirtualDataGrid {...args} />
    </div>
  ),
};

/**
 * Grid with row expansion enabled. Double-click rows to expand and see metadata.
 */
export const WithExpansion: Story = {
  args: {
    data: generateTestData(10),
    columns: createColumns(),
    getRowId: (row: TestRow) => row.id,
    height: 400,
    enableRowSelection: true,
    enableExpanding: true,
    getRowCanExpand: () => true,
    initialColumnPinning: { right: ['actions'] },
    onRowSelectionChange: noop,
    onExpandedChange: noop,
    renderRow: (row: Row<TestRow>, cells: React.ReactNode): React.ReactNode => {
      const isExpanded = row.getIsExpanded();
      const metadata = row.original.metadata;

      return (
        <>
          <tr
            key={row.id}
            className={cn(
              'border-b border-border-default hover:bg-bg-raised/50 transition-colors cursor-pointer',
              row.getIsSelected() && 'bg-accent-blue/10'
            )}
            onClick={() => {
              row.toggleSelected();
            }}
            onDoubleClick={() => {
              row.toggleExpanded();
            }}
          >
            {cells}
          </tr>
          {isExpanded && metadata !== undefined && (
            <tr key={`${row.id}-expanded`} data-testid="expanded-section">
              <td colSpan={createColumns().length} className="px-4 py-3 bg-bg-raised">
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-text-secondary">Tags:</span>
                    <div className="flex gap-1 mt-1">
                      {metadata.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-bg-elevated rounded border border-border-default"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-text-secondary">Notes:</span>
                    <p className="mt-1 text-sm text-text-primary">{metadata.notes}</p>
                  </div>
                </div>
              </td>
            </tr>
          )}
        </>
      );
    },
  },

  render: (args) => (
    <div className="h-[500px] bg-bg-app">
      <VirtualDataGrid {...args} />
    </div>
  ),
};

/**
 * Large dataset demonstrating virtualization. Only visible rows are rendered.
 */
export const LargeDataset: Story = {
  args: {
    data: generateTestData(1000),
    columns: createColumns(),
    getRowId: (row: TestRow) => row.id,
    height: 600,
    enableRowSelection: true,
    enableExpanding: true,
    getRowCanExpand: () => true,
    initialColumnPinning: { right: ['actions'] },
    onRowSelectionChange: noop,
    onExpandedChange: noop,
  },
  render: (args) => (
    <div className="h-[700px] bg-bg-app">
      <VirtualDataGrid {...args} />
    </div>
  ),
};

/**
 * Narrow container to demonstrate conditional actions column pinning.
 * When the table overflows horizontally, the actions column becomes sticky.
 */
export const ConditionalPinning: Story = {
  args: {
    data: generateTestData(20),
    columns: createColumns(),
    getRowId: (row: TestRow) => row.id,
    height: 400,
    enableRowSelection: true,
    enableExpanding: true,
    getRowCanExpand: () => true,
    initialColumnPinning: { right: ['actions'] },
    onRowSelectionChange: noop,
    onExpandedChange: noop,
  },
  render: (args) => (
    <div className="w-[600px] h-[500px] bg-bg-app border border-border-default rounded">
      <div className="p-2 text-xs text-text-secondary mb-2">
        Resize this container to see actions column pinning when table overflows
      </div>
      <VirtualDataGrid {...args} />
    </div>
  ),
};

/**
 * Empty state when no data is available.
 */
export const Empty: Story = {
  args: {
    data: [],
    columns: createColumns(),
    getRowId: (row: TestRow) => row.id,
    height: 400,
    emptyMessage: 'No items found',
    enableRowSelection: true,
    enableExpanding: true,
    getRowCanExpand: () => true,
    onRowSelectionChange: noop,
    onExpandedChange: noop,
  },

  render: (args) => (
    <div className="h-[500px] bg-bg-app">
      <VirtualDataGrid {...args} />
    </div>
  ),
};

/**
 * Grid with sorting enabled. Click column headers to sort.
 */
export const WithSorting: Story = {
  args: {
    data: generateTestData(20),
    columns: createColumns().map((col) => {
      if (col.id === 'name' || col.id === 'status' || col.id === 'value') {
        return {
          ...col,
          enableSorting: true,
        };
      }
      return col;
    }),
    getRowId: (row: TestRow) => row.id,
    height: 400,
    enableRowSelection: true,
    enableExpanding: true,
    getRowCanExpand: () => true,
    enableSorting: true,
    initialColumnPinning: { right: ['actions'] },
    onRowSelectionChange: noop,
    onExpandedChange: noop,
    onSortingChange: noop,
  },

  render: (args) => (
    <div className="h-[500px] bg-bg-app">
      <VirtualDataGrid {...args} />
    </div>
  ),
};

/**
 * Tests row selection via checkbox interaction.
 */
export const RowSelectionTest: Story = {
  args: {
    data: generateTestData(5),
    columns: createColumns(),
    getRowId: (row: TestRow) => row.id,
    height: 400,
    enableRowSelection: true,
    enableExpanding: true,
    getRowCanExpand: () => true,
    initialColumnPinning: { right: ['actions'] },
    onRowSelectionChange: fn(),
    onExpandedChange: fn(),
  },
  render: (args) => (
    <div className="h-[500px] bg-bg-app" data-testid="selection-test-container">
      <VirtualDataGrid {...args} />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click header checkbox to select all rows', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      const headerCheckbox = checkboxes[0];
      if (headerCheckbox !== undefined) {
        await userEvent.click(headerCheckbox);
        await expect(headerCheckbox).toHaveAttribute('aria-checked', 'true');
      }
    });

    await step('Verify all row checkboxes are selected', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      // Skip header checkbox (index 0), check row checkboxes
      for (let i = 1; i < checkboxes.length; i++) {
        const checkbox = checkboxes[i];
        if (checkbox !== undefined) {
          await expect(checkbox).toHaveAttribute('aria-checked', 'true');
        }
      }
    });

    await step('Click header checkbox again to deselect all', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      const headerCheckbox = checkboxes[0];
      if (headerCheckbox !== undefined) {
        await userEvent.click(headerCheckbox);
        await expect(headerCheckbox).toHaveAttribute('aria-checked', 'false');
      }
    });

    await step('Click individual row checkbox to select single row', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      const firstRowCheckbox = checkboxes[1];
      if (firstRowCheckbox !== undefined) {
        await userEvent.click(firstRowCheckbox);
        await expect(firstRowCheckbox).toHaveAttribute('aria-checked', 'true');
        // Header should show indeterminate state
        const headerCheckbox = checkboxes[0];
        if (headerCheckbox !== undefined) {
          await expect(headerCheckbox).toHaveAttribute('aria-checked', 'mixed');
        }
      }
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests row selection via checkbox clicks: select all, deselect all, and individual row selection.',
      },
    },
  },
};

/**
 * Tests row expansion via keyboard.
 */
export const RowExpansionTest: Story = {
  args: {
    data: generateTestData(5),
    columns: createColumns(),
    getRowId: (row: TestRow) => row.id,
    height: 400,
    enableRowSelection: true,
    enableExpanding: true,
    getRowCanExpand: () => true,
    initialColumnPinning: { right: ['actions'] },
    onRowSelectionChange: fn(),
    onExpandedChange: fn(),
  },
  render: (args) => (
    <div className="h-[500px] bg-bg-app" data-testid="expansion-test-container">
      <VirtualDataGrid {...args} />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Find and focus first expander button', async () => {
      const expanderButtons = canvas.getAllByRole('button', { name: /expand/i });
      const firstExpander = expanderButtons[0];
      if (firstExpander !== undefined) {
        await tabToElement(firstExpander, 20);
        await expect(firstExpander).toHaveFocus();
        await expect(firstExpander).toHaveAttribute('aria-expanded', 'false');
      }
    });

    await step('Press Enter to expand row', async () => {
      await userEvent.keyboard('{Enter}');
      const expanderButtons = canvas.getAllByRole('button', { name: /expand/i });
      const firstExpander = expanderButtons[0];
      if (firstExpander !== undefined) {
        await expect(firstExpander).toHaveAttribute('aria-expanded', 'true');
      }
    });

    await step('Press Space to collapse row', async () => {
      await userEvent.keyboard(' ');
      const expanderButtons = canvas.getAllByRole('button', { name: /expand/i });
      const firstExpander = expanderButtons[0];
      if (firstExpander !== undefined) {
        await expect(firstExpander).toHaveAttribute('aria-expanded', 'false');
      }
    });

    await step('Click expander button to expand', async () => {
      const expanderButtons = canvas.getAllByRole('button', { name: /expand/i });
      const firstExpander = expanderButtons[0];
      if (firstExpander !== undefined) {
        await userEvent.click(firstExpander);
        await expect(firstExpander).toHaveAttribute('aria-expanded', 'true');
      }
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests row expansion: Enter key, Space key, and click interactions on expander buttons.',
      },
    },
  },
};

/**
 * Tests sorting via header click.
 */
export const SortingTest: Story = {
  args: {
    data: generateTestData(10),
    columns: createColumns().map((col) => {
      if (col.id === 'name' || col.id === 'value') {
        return {
          ...col,
          enableSorting: true,
        };
      }
      return col;
    }),
    getRowId: (row: TestRow) => row.id,
    height: 400,
    enableRowSelection: true,
    enableExpanding: true,
    getRowCanExpand: () => true,
    enableSorting: true,
    initialColumnPinning: { right: ['actions'] },
    onRowSelectionChange: fn(),
    onExpandedChange: fn(),
    onSortingChange: fn(),
  },
  render: (args) => (
    <div className="h-[500px] bg-bg-app" data-testid="sorting-test-container">
      <VirtualDataGrid {...args} />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click Name header to sort ascending', async () => {
      const nameHeader = canvas.getByRole('columnheader', { name: /name/i });
      await userEvent.click(nameHeader);
      await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    });

    await step('Click Name header again to sort descending', async () => {
      const nameHeader = canvas.getByRole('columnheader', { name: /name/i });
      await userEvent.click(nameHeader);
      await expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    });

    await step('Click Name header third time to clear sort', async () => {
      const nameHeader = canvas.getByRole('columnheader', { name: /name/i });
      await userEvent.click(nameHeader);
      await expect(nameHeader).toHaveAttribute('aria-sort', 'none');
    });

    await step('Click Value header to sort a different column', async () => {
      const valueHeader = canvas.getByRole('columnheader', { name: /value/i });
      await userEvent.click(valueHeader);
      await expect(valueHeader).toHaveAttribute('aria-sort', 'ascending');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests sorting: click header to cycle through ascending, descending, and no sort states.',
      },
    },
  },
};
