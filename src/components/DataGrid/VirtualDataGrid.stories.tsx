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
import { fn } from '@storybook/test';
import { VirtualDataGrid, type VirtualDataGridProps } from './VirtualDataGrid';
import { createSelectionColumn } from './columns/selectionColumn';
import { createExpanderColumn } from './columns/expanderColumn';
import { cn } from '@/utils/cn';
import type { ColumnDef } from '@tanstack/react-table';
import type { Row } from '@tanstack/react-table';

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
